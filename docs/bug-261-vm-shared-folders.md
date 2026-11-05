# Bug 261: first VM deploy failed at the dashboard step (ownership of the shared folders)

Date: 5 Nov 2026. Reported by the VM admin after the first `deploy-vm.yml` run on the Azure VM (run 41972989732).
Nothing committed or deployed by Claude; the user commits and the VM admin re-runs `setup.sh`.

## What happened

The site part deployed (`Live: 20261105-051806-d9d9a69f4b`), then the sync into `/srv/cambridge/admin` ended with

```
rsync: [generator] chgrp "/srv/cambridge/admin/." failed: Operation not permitted (1)
rsync error: ... (code 23)
```

so `admin-update.sh` never ran and `/admin` answered 502. Visitors were never affected.

## Cause

Two users share `/srv/cambridge`: `deploy` (GitHub deploys) and `cambridge` (the dashboard and the site). `setup.sh` relied
on setgid directories with group `cambridge` to let both write, but:

1. `deploy.sh` ran rsync with `-a`, which preserves the sender's group. The GitHub runner's group id (1001) is `deploy` on
   the VM, and `deploy` may set that group, so every synced file came out `deploy:deploy`, not group `cambridge`. The
   dashboard (user `cambridge`, not in group `deploy`) could not have written its own checkout: no post edits, no
   `npm ci`, no build.
2. The top folder `/srv/cambridge/admin` was `cambridge:cambridge`. rsync also sets the group, mode and time of the folder
   it syncs into, and only the owner may do that: hence the `chgrp` error and exit code 23.
3. `/srv/cambridge` itself was `deploy:deploy 755`. A dashboard publish (`publish.sh` as `cambridge`) runs `activate.sh`,
   which switches the `current` link inside `/srv/cambridge`; that would have failed too, as would pruning release folders
   whose group was `deploy`.

## Fix

- `deploy/vm/deploy.sh`: all three rsyncs use `--no-group` (the group comes from the setgid directory: `cambridge`) and
  `--omit-dir-times` (rsync must not try to set the time of a directory the dashboard created and owns, for example a
  post's image folder that later also exists in the repository through `fetch-content.sh`; that failure alone would fail a
  deploy). Options shared in `rsync_opts`.
- `deploy/vm/setup.sh`: `/srv/cambridge`, `releases/` and `admin/` are `deploy:cambridge 2775`; `cache/` and `backups/`
  stay `cambridge:cambridge 2775`. Ownership is set explicitly (`chown` + `chmod`), not through `install -d`, which leaves
  an existing directory alone. A repair block makes everything under `releases/` and `admin/` group `cambridge`,
  group-writable, directories setgid: it corrects the partial copy of 5 Nov and is a no-op afterwards.
- `deploy/vm/README.md`: the ownership table and a troubleshooting row.

Checked locally with rsync 3.2.7 into a setgid directory of a secondary group: `-a` gives the file the sender's primary
group, `-a --no-group` leaves the directory's group. The ownership steps need root and run on the VM.

## On the VM (VM admin)

1. `sudo bash /tmp/vm/setup.sh '<deploy public key>'` from a fresh copy of `deploy/vm/` (the repair runs inside it).
2. Re-run the deploy (push to `main` or "Run workflow" on *Deploy to Azure VM*); the dashboard step should end green and
   `/admin` answer.
3. Sign in to the dashboard and run one **Publish site**: this is the first time `publish.sh` + `activate.sh` run as
   `cambridge` on the VM. Expected: a release `<time>-dashboard` under `/srv/cambridge/releases`, `current` pointing at
   it, the site answering, old releases pruned. If it fails, the publish log in the dashboard and
   `journalctl -u cambridge-admin` show why.
