// Dashboard shell: login, top bar (Posts / Authors, Publish site, sign out), path routing under /admin.
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { api, errorText } from "./api";
import { PostsList, PostEditor, type Author } from "./posts";
import { AuthorsList, AuthorEditor } from "./authors";
import { Toast } from "./ui";

type Me = { email: string; siteUrl: string; categories: { key: string; label: string }[] };
type Publish = { state: "idle" | "running" | "ok" | "failed"; startedAt?: string; finishedAt?: string; output: string[] };

function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [path, setPath] = useState(location.pathname);
  const [toast, setToast] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const nav = (p: string) => { history.pushState(null, "", p); setPath(p); window.scrollTo(0, 0); };
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener("popstate", onPop);
    api<Me>("GET", "/me").then((r) => setMe(r.ok ? (r as unknown as Me) : null));
    return () => removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => { if (me) api<{ items: Author[] }>("GET", "/authors").then((r) => setAuthors((r.items ?? []).filter((a) => a.active !== false))); }, [me, path]);

  if (me === undefined) return <p class="empty">Loading…</p>;
  if (!me) return <Login onDone={(m) => setMe(m)} />;
  const m = /^\/admin(?:\/(posts|authors)(?:\/([^/]+))?)?\/?$/.exec(path);
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
          </nav>
          <span class="spacer" />
          <PublishButton toast={setToast} />
          <a class="btn btn-sm" href={me.siteUrl} target="_blank" rel="noopener">View website</a>
          <span class="who">{me.email}</span>
          <button class="btn btn-sm" onClick={async () => { await api("POST", "/logout"); setMe(null); }}>Sign out</button>
        </div>
      </header>
      <main class="main">
        {section === "posts" && !id && <PostsList nav={nav} siteUrl={me.siteUrl} />}
        {section === "posts" && id && <PostEditor key={id} slug={id} nav={nav} siteUrl={me.siteUrl} categories={me.categories} authors={authors} toast={setToast} />}
        {section === "authors" && !id && <AuthorsList nav={nav} />}
        {section === "authors" && id && <AuthorEditor key={id} slug={id} nav={nav} toast={setToast} />}
      </main>
      <Toast text={toast} />
    </div>
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

/** "Publish site" in the top bar: starts the build and shows its progress; polls while it runs. */
function PublishButton({ toast }: { toast: (t: string) => void }) {
  const [pub, setPub] = useState<Publish>({ state: "idle", output: [] });
  const [open, setOpen] = useState(false);
  const refresh = async () => { const r = await api<{ publish: Publish }>("GET", "/publish"); if (r.publish) setPub(r.publish); return r.publish; };
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (pub.state !== "running") return;
    const t = setInterval(async () => { const p = await refresh(); if (p && p.state !== "running") { toast(p.state === "ok" ? "Website updated" : "Publish failed, see the log"); clearInterval(t); } }, 2000);
    return () => clearInterval(t);
  }, [pub.state]);
  const start = async () => { const r = await api<{ publish: Publish }>("POST", "/publish"); if (r.publish) setPub(r.publish); else toast(errorText(r)); setOpen(true); };
  const label = pub.state === "running" ? "Publishing…" : "Publish site";
  return (
    <div class="publish">
      <div class="row" style="gap:6px">
        <button class="btn btn-sm btn-primary" disabled={pub.state === "running"} onClick={start}>{label}</button>
        <button class="btn btn-sm" aria-expanded={open} onClick={() => setOpen(!open)} title="Publish log">{pub.state === "ok" ? "✓" : pub.state === "failed" ? "!" : "…"}</button>
      </div>
      {open && (
        <div class="publish-panel">
          <div class="row"><b>{pub.state === "idle" ? "Nothing published yet in this session" : pub.state === "running" ? "Building the website…" : pub.state === "ok" ? "Website updated" : "Publish failed"}</b><span class="spacer" /><button class="link" onClick={() => setOpen(false)}>Close</button></div>
          {pub.finishedAt && <p class="counter">Finished {new Date(pub.finishedAt).toLocaleString()}</p>}
          <p class="help" style="margin-top:8px">Publishing rebuilds the website with every saved post. It takes about a minute.</p>
          {pub.output.length > 0 && <pre>{pub.output.slice(-40).join("\n")}</pre>}
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById("app")!);
