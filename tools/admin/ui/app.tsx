// Dashboard shell: login, top bar (Posts / Authors, Publish site, sign out), path routing under /admin.
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { api, errorText } from "./api";
import { PostsList, PostEditor, type Author } from "./posts";
import { AuthorsList, AuthorEditor } from "./authors";
import { Settings } from "./settings";
import { Toast } from "./ui";
import { answerLeave, confirmLeave, hasUnsaved, useLeaveDialog, useUnsaved } from "./unsaved";

export type Nav = (path: string, o?: { force?: boolean }) => void;
type Me = { email: string; siteUrl: string; categories: { key: string; label: string }[] };
type Publish = { state: "idle" | "running" | "ok" | "failed"; startedAt?: string; finishedAt?: string; output: string[] };

function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [path, setPath] = useState(location.pathname);
  const [toast, setToast] = useState({ text: "", n: 0 });
  const say = (text: string) => setToast((t) => ({ text, n: t.n + 1 })); // the same message twice shows twice
  const [authors, setAuthors] = useState<Author[]>([]);
  // Leaving a page with unsaved changes asks first (bug 256). Every dashboard history entry carries its position (idx), so a
  // browser Back / Forward inside the dashboard can be undone while the person decides, and redone on "Leave".
  const at = useRef<number>(typeof history.state?.idx === "number" ? history.state.idx : 0);
  const skip = useRef(0); // history moves made here, not by the person: their popstate only follows the address
  const go = (p: string) => { at.current += 1; history.pushState({ idx: at.current }, "", p); setPath(p); window.scrollTo(0, 0); };
  /** In-dashboard navigation. `force`: the page's changes were just saved or its record no longer exists (create, delete). */
  const nav: Nav = (p, o) => { if (o?.force || !hasUnsaved()) go(p); else confirmLeave().then((leave) => leave && go(p)); };
  useEffect(() => {
    if (typeof history.state?.idx !== "number") history.replaceState({ ...(history.state ?? {}), idx: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      const to: number | null = typeof e.state?.idx === "number" ? e.state.idx : null;
      if (skip.current > 0 || to === null || to === at.current || !hasUnsaved()) {
        if (skip.current > 0) skip.current--;
        if (to !== null) at.current = to;
        setPath(location.pathname);
        return;
      }
      const delta = to - at.current;
      skip.current++; history.go(-delta); // back to the page being edited while the dialog is open
      confirmLeave().then((leave) => { if (leave) { skip.current++; history.go(delta); } });
    };
    addEventListener("popstate", onPop);
    api<Me>("GET", "/me").then((r) => setMe(r.ok ? (r as unknown as Me) : null));
    return () => removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => { if (me) api<{ items: Author[] }>("GET", "/authors").then((r) => setAuthors((r.items ?? []).filter((a) => a.active !== false))); }, [me, path]);

  if (me === undefined) return <p class="empty">Loading…</p>;
  if (!me) return <Login onDone={(m) => setMe(m)} />;
  const m = /^\/admin(?:\/(posts|authors|settings)(?:\/([^/]+))?)?\/?$/.exec(path);
  const section = m?.[1] ?? "posts";
  const id = m?.[2];
  return (
    <div>
      <header class="topbar">
        <div class="topbar-in">
          <a class="brand" href="/admin/posts" onClick={(e) => { e.preventDefault(); nav("/admin/posts"); }}><img src="/admin/logo.svg" alt="Cambridge Hospital" /><span class="tag">Admin</span></a>
          <nav class="nav" aria-label="Sections">
            <a href="/admin/posts" class={section === "posts" ? "active" : ""} onClick={(e) => { e.preventDefault(); nav("/admin/posts"); }}>Blog &amp; PR</a>
            <a href="/admin/authors" class={section === "authors" ? "active" : ""} onClick={(e) => { e.preventDefault(); nav("/admin/authors"); }}>Authors</a>
            <a href="/admin/settings" class={section === "settings" ? "active" : ""} onClick={(e) => { e.preventDefault(); nav("/admin/settings"); }}>Settings</a>
          </nav>
          <span class="spacer" />
          <PublishButton toast={say} />
          <a class="btn btn-sm" href={me.siteUrl} target="_blank" rel="noopener">View website</a>
          <span class="who">{me.email}</span>
          <button class="btn btn-sm" onClick={async () => { if (!(await confirmLeave())) return; await api("POST", "/logout"); setMe(null); }}>Sign out</button>
        </div>
      </header>
      <main class="main">
        {section === "posts" && !id && <PostsList nav={nav} siteUrl={me.siteUrl} />}
        {section === "posts" && id && <PostEditor key={id} slug={id} nav={nav} siteUrl={me.siteUrl} categories={me.categories} authors={authors} toast={say} />}
        {section === "authors" && !id && <AuthorsList nav={nav} />}
        {section === "authors" && id && <AuthorEditor key={id} slug={id} nav={nav} toast={say} />}
        {section === "settings" && <Settings toast={say} siteUrl={me.siteUrl} />}
      </main>
      <Toast key={toast.n} text={toast.text} />
      <LeaveDialog />
    </div>
  );
}

/** "You have unsaved changes. Leave without saving?" (bug 256), opened by confirmLeave() in unsaved.ts. Esc = Stay. */
function LeaveDialog() {
  const open = useLeaveDialog();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); else if (!open && d.open) d.close(); }, [open]);
  return (
    <dialog ref={ref} class="confirm" aria-labelledby="leave-q" onCancel={(e) => { e.preventDefault(); answerLeave(false); }}>
      <p id="leave-q">You have unsaved changes. Leave without saving?</p>
      <div class="row">
        <button type="button" class="btn btn-sm btn-primary" autoFocus onClick={() => answerLeave(false)}>Stay</button>
        <button type="button" class="btn btn-sm btn-danger" onClick={() => answerLeave(true)}>Leave</button>
      </div>
    </dialog>
  );
}

function Login({ onDone }: { onDone: (m: Me) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: Event) => {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await api("POST", "/login", { email, password });
    if (!r.ok) { setErr(errorText(r)); setBusy(false); return; }
    const m = await api<Me>("GET", "/me");
    onDone(m as unknown as Me);
  };
  return (
    <div class="login">
      <form class="card" onSubmit={submit}>
        <img src="/admin/logo.svg" alt="Cambridge Hospital" style="height:40px;margin-bottom:18px" />
        <h1>Admin sign in</h1>
        <p class="help" style="margin:0 0 18px">Blog, PR and author management for cambridgehospital.com.</p>
        <div class="field"><label for="email">Email</label><input id="email" class="input" type="email" autocomplete="username" required value={email} onInput={(e) => setEmail((e.currentTarget as HTMLInputElement).value)} /></div>
        <div class="field"><label for="password">Password</label><input id="password" class="input" type="password" autocomplete="current-password" required value={password} onInput={(e) => setPassword((e.currentTarget as HTMLInputElement).value)} /></div>
        {err && <div class="error-box" role="alert">{err}</div>}
        <div style="height:12px" />
        <button class="btn btn-primary" style="width:100%;justify-content:center" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</button>
      </form>
    </div>
  );
}

/** "Publish site" in the top bar: starts the build and shows its progress. The state is polled for as long as the dashboard
 *  is open (every 5 s, 2 s during a build; not while the tab is hidden), so a build started in another tab or by the
 *  scheduler shows as "Publishing…" without a reload, and a second press while one runs (409) says so. A build only sees
 *  saved files, so it is refused while an editor has unsaved changes (bug 255). */
type Due = { slug: string; title: string; at: string };
const SAVE_FIRST = "Save your changes first: publishing uses the saved posts only.";
function PublishButton({ toast }: { toast: (t: string) => void }) {
  const [pub, setPub] = useState<Publish>({ state: "idle", output: [] });
  const [minutes, setMinutes] = useState(25);
  const [next, setNext] = useState<Due[]>([]);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(""); // why the last press did not start a build (cleared when the running build ends)
  const unsaved = useUnsaved();
  const was = useRef(pub.state);
  const refresh = async () => {
    const r = await api<{ publish: Publish; schedule?: { next: Due[] }; minutes?: number }>("GET", "/publish");
    if (r.publish) setPub(r.publish); if (r.schedule) setNext(r.schedule.next); if (r.minutes) setMinutes(r.minutes);
    return r.publish;
  };
  useEffect(() => {
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, pub.state === "running" ? 2000 : 5000);
    const onShow = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onShow);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onShow); };
  }, [pub.state]);
  useEffect(() => {
    if (was.current === "running" && pub.state !== "running") { toast(pub.state === "ok" ? "Website updated" : "Publish failed, see the log"); setNote(""); }
    was.current = pub.state;
  }, [pub.state]);
  const start = async () => {
    setOpen(true);
    if (hasUnsaved()) { toast("Save your changes first"); return; } // the panel shows the warning for as long as that is so
    const r = await api<{ publish: Publish }>("POST", "/publish");
    if (r.publish) { setPub(r.publish); setNote(""); return; }
    setNote(errorText(r)); toast(errorText(r));
    if (r.error === "publish_running") refresh(); // the button turns into "Publishing…" right away, not at the next poll
  };
  const running = pub.state === "running";
  const at = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
  return (
    <div class="publish">
      <div class="row" style="gap:6px">
        <button class="btn btn-sm btn-primary" disabled={running} aria-busy={running} onClick={start} title={running ? `Building the website, started ${at(pub.startedAt)}` : unsaved ? SAVE_FIRST : "Rebuild the website with every saved post"}>{running ? "Publishing…" : "Publish site"}</button>
        <button class="btn btn-sm" aria-expanded={open} onClick={() => setOpen(!open)} title="Publish log">{running ? "⏳" : pub.state === "ok" ? "✓" : pub.state === "failed" ? "!" : "…"}</button>
      </div>
      {open && (
        <div class="publish-panel">
          <div class="row"><b>{pub.state === "idle" ? "Nothing published yet in this session" : running ? "Building and uploading the website…" : pub.state === "ok" ? "Website updated" : "Publish failed"}</b><span class="spacer" /><button class="link" onClick={() => setOpen(false)}>Close</button></div>
          {running && <p class="counter">Started {at(pub.startedAt)}. A build takes about {minutes} minutes; the website changes only at the end.</p>}
          {!running && pub.finishedAt && <p class="counter">Finished {new Date(pub.finishedAt).toLocaleString()}</p>}
          {note && <div class="error-box" role="alert" style="margin-top:8px">{note}</div>}
          {unsaved && <div class="error-box" role="alert" style="margin-top:8px">{SAVE_FIRST}</div>}
          <p class="help" style="margin-top:8px">Publishing rebuilds the website with every saved post and uploads it. It takes about {minutes} minutes on the current setup; one build runs at a time.</p>
          {pub.output.length > 0 && <pre>{pub.output.slice(-40).join("\n")}</pre>}
          {next.length > 0 && <div style="margin-top:10px"><b style="font-size:14px">Goes live by itself</b>
            <ul style="margin:6px 0 0;padding-inline-start:18px;font-size:13px">{next.map((d) => <li key={d.slug}>{d.title || d.slug} · {new Date(d.at).toLocaleString()}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById("app")!);
