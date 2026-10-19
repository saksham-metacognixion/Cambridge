# Bug 111 — Safari white band, Media Hub "Latest Blogs & Posts" (14 Oct 2026)

URL: https://cambridge-hospital-staging.vercel.app/media-hub/?category=health-articles#latest

**Status:** no white band reproduced (Outcome A for the white symptom). The related, reproducible jump of the empty lead
at each loop restart is **fixed locally** (14 Oct, user decision: keep the Figma lead on load, Media Hub Latest only). The
fix is uncommitted and not deployed.

## Environment
- macOS 26.6.2 (25G83), Safari 26.6.2, built-in Retina display 1440×900 pt (device pixel ratio 2).
- Real Safari, two ways:
  1. A normal Safari window driven through its menus (AppleScript). Pixels come from `screencapture -l<window id>` (the
     composited on-screen window, not a WebDriver snapshot). "Allow JavaScript from Apple Events" was off and was left off.
  2. A safaridriver window for bounds, computed styles and per-frame `scrollLeft` logging, captured the same way.
- Windows of 1680 and 1920 extend past the 1440 pt screen. Their left edge, where the band is reported, stays on screen.
- Safari zoom steps are 85 / 100 / 115 % (Safari has no 90 / 110 %).

## Tests
| Check | Result |
|---|---|
| Widths 1280 / 1440 / 1680 / 1920 × zoom 85 / 100 / 115 %, overlay scrollbars, ~25 s each, 1 frame/s | 0 frames with a white band (12 runs) |
| Same matrix with System Settings → Show scroll bars → **Always** (clientWidth 1423 at 1440, scrollbar 17 px) | 0 frames with a white band (12 runs) |
| 250 s natural autoscroll at 1440 / 100 %, 2 frames/s (437 frames) | 0 frames with a white band |
| Loop wrap (all 27 posts loaded, row parked just before the end of the period) at 1440 and 1920, ~4 frames/s plus a per-frame `scrollLeft` log | Wrap `10407 → 0` in one frame; 0 frames with a white band |

The detector flagged a row as a band when its left pixels up to the first `#f3f3f3` pixel were all white (≥ 250). A frame
counted when 20 or more rows inside `#latest` were flagged, with the toolbar, site header and rounded window corner left
out. The only frames flagged were checked by eye: one was a fading-in card above `#latest`, captured before the `#hash`
jump, and the others were single card edges. All were false positives.

Computed values (Safari, every width): `section#latest` spans `0 … viewport width`, background `rgb(243, 243, 243)`
(`--color-mist-50`). `#latest-posts` and `ul[data-loop-row]` are transparent, so anything not covered by a card shows the
section grey. A blank frame during a rebuild would therefore show grey, not white. The rebuild (`build(true)` on
`autoscroll:refresh`) and the wrap (`pos -= period`) also run synchronously inside one task or frame.

## Reproducible related behaviour: the left padding pops in at the loop wrap
The wrap is seamless on the right of the first card but **not to its left**:

- Just before the wrap (`scrollLeft ≈ period`), the right part of the last post (e.g. the "Gastroesophageal Reflux" tile)
  fills the left `115u + gutter` (157 px at 1440).
- One frame later (`scrollLeft = 0`) that area is the empty row padding: a plain light-grey band before the first card.

It happens once per loop, about every 3.5 min with the 27 health articles, longer with all posts. Beside the white cards a
light-grey `#f3f3f3` band can read as "white". This fits a client seeing a strip that QA could not reproduce on a static
load. Frame pair: scratchpad `wrap-before-after.png` (not in the repo). It can be re-captured with the steps above.

The same wrap code (`src/scripts/autoscroll.ts`) drives the Home doctors, Our Care doctors, Care Support and Testimonials
rows. They have the same pop wherever their row has leading padding (not separately verified).

### Fix (applied locally, Media Hub Latest only)
- `src/components/media-hub/LatestPosts.astro`: `data-autoscroll-lead` on `#latest-posts`.
- `src/scripts/autoscroll.ts`: with that attribute, `lead` = the row's `padding-inline-start`. The wrap is
  `pos >= period + lead`, `read()` maps into `[lead, lead + period)`, the copies fill `clientWidth + lead`, and the lead is
  published as `data-loop-lead`. Without the attribute, `lead = 0` and the code paths are identical to before.
- `src/scripts/drag-scroll.ts`: `put()` wraps a drag into `[lead, lead + period)`. With lead 0 it gives the same results
  as the old `abs %= p` (checked on sample values).
- Unchanged: the lead on first load (Figma 115u + gutter), speed and timing, card geometry, `--u`, `--gutter`, `MAX_W`,
  and every other autoscroll row.

Verified in real Safari 26.6.2 against the local dev server, with a per-frame log of `scrollLeft` and the post under the
left edge (x = 5 / 60 / 120 px):
- EN 1440: the wrap goes `10689 → 157` (it used to go `→ 0`). The same post ("8 Exercises…") is at all three points before
  and after, so the empty lead never reappears. No white band in the window captures.
- AR (RTL) 1440: the wrap goes `−10689 → −157`. The same post is at the mirrored points before and after.
- Home: none of its three autoscroll rows has a `loopLead`, and they keep scrolling as before.

Still to do: a staging deploy, then QA's four-browser and width sweep (EN/AR) on Media Hub Latest.

## Needed from the client
1. A screenshot or short screen recording of the strip, plus Safari / macOS version, window width and zoom.
2. Does it appear right after the row "jumps back" to the first post, or on a static page?
3. Do `Cmd+0` and a hard refresh (`Cmd+Option+R`) clear it?

## Not done
- No real-Safari check of Arabic / RTL or other widths. Not needed without a reproduction or a code change.
- No four-browser sweep, because no code changed.

## Update 14 Oct (second pass, user decision): lead 115u → 48u
The user wanted the gap before the first post removed. Per the user's choice, the first post now starts at
`48u + gutter`, the left edge of the Explore Our Media tiles. The end padding is `47u + gutter` as on Explore, and phones
(<1024) keep 16 px. **This deviates from Figma (x 115) and should be confirmed with Pramod.** The loop-restart fix above
stays.

Verified in real Safari 26.6.2 (local dev):
- The first Latest card and the first Explore tile start at the same x: 58 / 66 / 306 px at 1280 / 1440 / 1920, in both
  EN and AR.
- No horizontal page scroll at any of those widths.
- The loop restart goes `10597 → 65` with the same post at the left edge before and after.

Files: `src/components/media-hub/LatestPosts.astro` (padding / scroll-padding).

## Update 14 Oct (third pass, user decision): Latest = centred three-card window (replaces the 48u start)
The user wanted the Latest row centred like Explore Our Media, not starting on the left and running off the right edge.
At ≥ 1024 `#latest-posts` is now a centred window (`mx-auto`) of exactly three cards. The width is
`3 × 248.389 + 2 × 36.6 = 818.367u` plus `22u` each side for the card shadows (`862.367u`), and the row padding and
scroll padding are `22u`. This matches the Figma composition: three centred cards at x 115 / 401 / 685. Cards glide in
and out at the window edges. Below 1024 nothing changed.

Verified in real Safari 26.6.2 (local dev, `/sa` and `/sa/ar`):
- The window margins are equal: 92 / 115 / 130 / 370 px at 1024 / 1280 / 1440 / 1920. At rest the cards sit 160 px from
  each side at 1440.
- No horizontal page scroll.
- Autoscroll moves (220 px in 5 s) in EN, AR and the filtered view.
- The loop restart (`10562 → 30`, and `−10562 → −30` in RTL) is seamless, with the same post at the window edge.
- The hover pause is kept (user decision).
