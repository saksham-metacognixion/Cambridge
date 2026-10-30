// Posts: the list (search, status tabs, score) and the editor (English / Arabic text, SEO, GEO, publish settings).
import { useEffect, useMemo, useState } from "preact/hooks";
import { api, errorText } from "./api";
import { DESC, TITLE, runChecks, seoDescription, seoTitle, stripHtml, type Locale } from "./checks";
import { Counter, Field, Pairs, StringList, Text, scoreClass, today } from "./ui";
import { ImageUpload } from "./upload";

export type Summary = { slug: string; date: string; updated?: string; category: string; type: "blog" | "pr"; status: string; editions: string[]; title: string; hasArabic: boolean; seo: boolean; imageAlt: boolean; keyword: boolean; keywords: string[]; author: string; reviewer: string; image: string };
export type Post = { slug: string; date: string; updated?: string; category: string; type: "blog" | "pr"; status: "draft" | "scheduled" | "published" | "archived"; publish_at?: string; editions: string[]; image: string; image_source?: string; hero_photo?: "full"; previous_slugs?: string[]; author?: string; reviewer?: string; noindex?: boolean; en: Locale & { old_url?: string; hero_button?: boolean; canonical?: string }; ar?: Post["en"]; [k: string]: unknown };
export type Author = { slug: string; name: { en: string; ar?: string }; role?: { en: string; ar?: string }; active?: boolean };
type Category = { key: string; label: string };
type Nav = (path: string) => void;

const STATUS: Record<string, string> = { published: "Published", scheduled: "Scheduled", draft: "Draft", archived: "Archived" };
const EDITIONS: [string, string][] = [["global", "Global"], ["ae", "UAE"], ["sa", "KSA"]];
export const blank = (): Post => ({ slug: "", date: today(), category: "health-articles", type: "blog", status: "draft", editions: ["global", "ae", "sa"], image: "", en: { title: "" } });

/* ---------- list ---------- */
export function PostsList({ nav, siteUrl }: { nav: Nav; siteUrl: string }) {
  const [items, setItems] = useState<Summary[] | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [type, setType] = useState("all");
  useEffect(() => { api<{ items: Summary[] }>("GET", "/posts").then((r) => setItems(r.items ?? [])); }, []);
  if (!items) return <p class="empty">Loading posts…</p>;
  const count = (s: string) => items.filter((i) => s === "all" || i.status === s).length;
  const shown = items.filter((i) => (tab === "all" || i.status === tab) && (type === "all" || i.type === type) && (!q || `${i.title} ${i.slug} ${i.category}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div class="page-head">
        <div><h1>Blog &amp; PR posts</h1><p class="sub">{items.length} posts. Each one gets a score for Google (SEO) and AI assistants (GEO).</p></div>
        <span class="spacer" />
        <button class="btn btn-primary" onClick={() => nav("/admin/posts/new")}>+ New post</button>
      </div>
      <div class="toolbar">
        <label class="sr-only" for="q">Search posts</label>
        <input id="q" class="input" placeholder="Search title, address or category…" value={q} onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)} />
        <select class="input" style="max-width:160px" aria-label="Type" value={type} onChange={(e) => setType((e.currentTarget as HTMLSelectElement).value)}>
          <option value="all">Blog + PR</option><option value="blog">Blog</option><option value="pr">PR / News</option>
        </select>
      </div>
      <div class="tabs" role="tablist">
        {["all", "published", "scheduled", "draft", "archived"].map((s) => (
          <button key={s} role="tab" class="tab" aria-selected={tab === s} onClick={() => setTab(s)}>{s === "all" ? "All" : STATUS[s]} ({count(s)})</button>
        ))}
      </div>
      <div class="list">
        {shown.map((i) => <Row key={i.slug} item={i} nav={nav} siteUrl={siteUrl} />)}
        {shown.length === 0 && <p class="empty">No posts match.</p>}
      </div>
    </div>
  );
}

function Row({ item: i, nav, siteUrl }: { item: Summary; nav: Nav; siteUrl: string }) {
  const todo = [!i.seo && "no SEO text", !i.imageAlt && "no alt text", !i.keyword && "no keyword", !i.hasArabic && "no Arabic"].filter(Boolean) as string[];
  const live = i.status === "published";
  return (
    <div class="item">
      <ScoreChip slug={i.slug} />
      <div style="min-width:0">
        <a class="title" href={`/admin/posts/${i.slug}`} onClick={(e) => { e.preventDefault(); nav(`/admin/posts/${i.slug}`); }}>{i.title}</a>
        <div class="meta">
          <span class={`chip ${i.type}`}>{i.type === "blog" ? "Blog" : "PR"}</span>
          <span>{i.category}</span><span>·</span><span>{i.date}</span>
          <span class={`chip ${live ? "live" : i.status}`}>{STATUS[i.status]}</span>
          {todo.map((t) => <span key={t} class="chip warn">{t}</span>)}
        </div>
      </div>
      <div class="row">
        {live && <a class="btn btn-sm" href={`${siteUrl}/media-hub/${i.slug}/`} target="_blank" rel="noopener">View</a>}
        <button class="btn btn-sm btn-navy" onClick={() => nav(`/admin/posts/${i.slug}`)}>Edit</button>
      </div>
    </div>
  );
}

// The list only has summaries; the score needs the text, so it is computed lazily per row from a cached full record.
const scoreCache = new Map<string, number>();
function ScoreChip({ slug }: { slug: string }) {
  const [n, setN] = useState<number | undefined>(scoreCache.get(slug));
  useEffect(() => {
    if (n !== undefined) return;
    api<{ item: Post }>("GET", `/posts/${slug}`).then((r) => {
      if (!r.item) return;
      const s = runChecks(r.item.en, slug, { otherKeywords: [], author: r.item.author, reviewer: r.item.reviewer, updated: r.item.updated, date: r.item.date }).score;
      scoreCache.set(slug, s); setN(s);
    });
  }, [slug]);
  return <div class={`score ${n === undefined ? "" : scoreClass(n)}`} title="SEO + GEO score">{n ?? "…"}<small>score</small></div>;
}

/* ---------- editor ---------- */
export function PostEditor({ slug, nav, siteUrl, categories, authors, toast }: { slug: string; nav: Nav; siteUrl: string; categories: Category[]; authors: Author[]; toast: (t: string) => void }) {
  const isNew = slug === "new";
  const [orig, setOrig] = useState<Post | null>(isNew ? blank() : null);
  const [p, setP] = useState<Post | null>(isNew ? blank() : null);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [others, setOthers] = useState<string[]>([]);
  const [err, setErr] = useState<{ text: string; fields?: { field: string; message: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<{ id: string; bytes: number }[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    if (!isNew) api<{ item: Post }>("GET", `/posts/${slug}`).then((r) => { if (r.item) { setOrig(r.item); setP(r.item); } else setErr({ text: "Post not found." }); });
    api<{ items: Summary[] }>("GET", "/posts").then((r) => setOthers((r.items ?? []).filter((i) => i.slug !== slug && i.status === "published").flatMap((i) => i.keywords ?? [])));
  }, [slug]);

  const loc = p?.[lang];
  const result = useMemo(() => (p && loc ? runChecks(loc, p.slug, { otherKeywords: others, author: p.author, reviewer: p.reviewer, updated: p.updated, date: p.date }) : null), [p, lang, others]);
  if (!p || !orig) return <p class="empty">{err?.text ?? "Loading…"}</p>;
  const dirty = JSON.stringify(p) !== JSON.stringify(orig);
  const set = (patch: Partial<Post>) => setP({ ...p, ...patch });
  const setLoc = (patch: Partial<Locale>) => setP({ ...p, [lang]: { ...(p[lang] as Locale), ...patch } });
  const dir = lang === "ar" ? "rtl" : undefined;

  const save = async (status?: Post["status"]) => {
    setBusy(true); setErr(null);
    const clean = (l?: Post["en"]) => l && { ...l, key_takeaways: l.key_takeaways?.map((t) => t.trim()).filter(Boolean), faqs: l.faqs?.filter((f) => f.q.trim() || f.a.trim()), sources: l.sources?.filter((s) => s.url.trim() || (s.title ?? "").trim()) };
    const data: Post = { ...p, slug: p.slug || slugify(p.en.title), status: status ?? p.status, updated: !isNew && dirty ? today() : p.updated, en: clean(p.en)!, ...(p.ar ? { ar: clean(p.ar) } : {}) };
    for (const l of ["en", "ar"] as const) { const x = data[l] as Record<string, unknown> | undefined; if (x) for (const k of Object.keys(x)) if (x[k] === undefined || x[k] === "" || (Array.isArray(x[k]) && (x[k] as unknown[]).length === 0)) delete x[k]; }
    if (data.updated === undefined) delete data.updated;
    if (data.status !== "scheduled") delete data.publish_at;
    if (!data.en.title?.trim()) { setErr({ text: "Add a title first." }); setBusy(false); return; }
    if ((data.status === "published" || data.status === "scheduled") && !(data.en.image_alt || "").trim() && data.image) { setErr({ text: "Describe the featured image (alt text) before publishing." }); setBusy(false); return; }
    const r = isNew ? await api("POST", "/posts", data) : await api("PUT", `/posts/${p.slug}`, data);
    setBusy(false);
    if (!r.ok) { setErr({ text: errorText(r), fields: r.details }); return; }
    toast(data.status === "published" ? "Saved. Press Publish to put it on the website." : "Saved");
    if (isNew) nav(`/admin/posts/${data.slug}`); else { setOrig(data); setP(data); }
  };
  const rename = async () => {
    const r = await api("POST", `/posts/${p.slug}/rename`, { slug: newSlug });
    if (!r.ok) { setErr({ text: errorText(r) }); return; }
    toast(`Address changed. The old one redirects to the new one.`); nav(`/admin/posts/${newSlug}`);
  };
  const remove = async () => {
    const r = await api("DELETE", `/posts/${p.slug}?confirm=${encodeURIComponent(confirmDelete)}`);
    if (!r.ok) { setErr({ text: errorText(r) }); return; }
    toast("Post deleted (a copy is kept)"); nav("/admin/posts");
  };
  const loadVersions = async () => { const r = await api<{ versions: { id: string; bytes: number }[] }>("GET", `/posts/${p.slug}/versions`); setVersions(r.versions ?? []); };
  const restore = async (id: string) => {
    const r = await api("POST", `/posts/${p.slug}/restore`, { version: id });
    if (!r.ok) { setErr({ text: errorText(r) }); return; }
    const fresh = await api<{ item: Post }>("GET", `/posts/${p.slug}`); if (fresh.item) { setOrig(fresh.item); setP(fresh.item); } toast("Earlier version restored");
  };
  const title = seoTitle(loc!), desc = seoDescription(loc!);
  const takeaways = loc!.key_takeaways ?? [];

  return (
    <div>
      <button class="link" onClick={() => nav("/admin/posts")}>← All posts</button>
      <div class="page-head" style="margin-top:8px">
        <h1>{isNew ? "New post" : p.en.title}</h1>
        <span class="spacer" />
        <span class={`chip ${p.status === "published" ? "live" : p.status}`}>{STATUS[p.status]}</span>
        {!isNew && p.status === "published" && <a class="btn btn-sm" href={`${siteUrl}/media-hub/${p.slug}/`} target="_blank" rel="noopener">View on site</a>}
      </div>
      {err && <div class="error-box" role="alert">{err.text}{err.fields && <ul>{err.fields.map((f) => <li key={f.field}><b>{f.field}</b>: {f.message}</li>)}</ul>}</div>}

      <div class="editor" style="margin-top:14px">
        <div>
          <div class="card">
            <div class="lang-tabs" role="tablist">
              <button role="tab" class="tab" aria-selected={lang === "en"} onClick={() => setLang("en")}>English</button>
              <button role="tab" class="tab" aria-selected={lang === "ar"} onClick={() => { if (!p.ar) set({ ar: { title: "" } }); setLang("ar"); }}>{p.ar ? "العربية" : "+ Add Arabic"}</button>
              {lang === "ar" && p.ar && <button class="link" style="margin-inline-start:auto" onClick={() => { const { ar, ...rest } = p; setP(rest as Post); setLang("en"); }}>Remove Arabic version</button>}
            </div>
            <Field id="title" label="Title (the page heading)"><Text id="title" value={loc!.title} dir={dir} onInput={(v) => setLoc({ title: v })} /></Field>
            {isNew && <Field id="slug" label="Web address" hint="Lowercase letters, numbers and hyphens. Leave empty to make it from the title.">
              <input id="slug" class="input" value={p.slug} placeholder={slugify(p.en.title)} onInput={(e) => set({ slug: slugify((e.currentTarget as HTMLInputElement).value) })} onBlur={() => !p.slug && set({ slug: slugify(p.en.title) })} />
            </Field>}
            <Field id="excerpt" label="Short summary (listing cards)"><Text id="excerpt" rows={3} dir={dir} value={loc!.excerpt ?? ""} onInput={(v) => setLoc({ excerpt: v })} /></Field>
            <Field id="body" label="Article (HTML: p, h2, h3, ul, ol, a, strong, em, table, figure)" hint={`${stripHtml(loc!.body ?? "").split(" ").filter(Boolean).length} words`}>
              <Text id="body" rows={18} mono dir={dir} value={loc!.body ?? ""} onInput={(v) => setLoc({ body: v })} />
            </Field>
            <Field id="alt" label="Featured image description (alt text)" hint="Required before publishing."><Text id="alt" dir={dir} value={loc!.image_alt ?? ""} onInput={(v) => setLoc({ image_alt: v })} /></Field>
          </div>

          <div class="card">
            <h2>Key takeaways <span class="badge">GEO</span></h2>
            <p class="help">2–3 short sentences shown in a box at the top. AI assistants quote these most.</p>
            <StringList value={takeaways.length ? takeaways : ["", ""]} onChange={(v) => setLoc({ key_takeaways: v })} dir={dir} placeholder="e.g. Most shoulder pain improves within 2–6 weeks of guided exercises." add="Add a takeaway" />
          </div>
          <div class="card">
            <h2>Frequently asked questions <span class="badge">GEO</span></h2>
            <p class="help">Shown as an accordion and sent to Google as FAQ structured data.</p>
            <Pairs value={(loc!.faqs ?? []).map((f) => [f.q, f.a])} onChange={(v) => setLoc({ faqs: v.map(([q, a]) => ({ q, a })) })} labels={["Question", "Answer (2–4 sentences)"]} add="Add a question" dir={dir} />
          </div>
          <div class="card">
            <h2>Sources <span class="badge">GEO</span></h2>
            <p class="help">Studies, guidelines or official pages the facts come from. Shown as a references list.</p>
            <Pairs value={(loc!.sources ?? []).map((s) => [s.title ?? "", s.url])} onChange={(v) => setLoc({ sources: v.map(([title, url]) => ({ title, url })) })} labels={["Source name", "Link (https://…)"]} add="Add a source" long={false} />
          </div>
        </div>

        <div class="side">
          <div class="card">
            <h2>Publish</h2>
            <div class="grid-2">
              <Field id="status" label="Status">
                <select id="status" class="input" value={p.status} onChange={(e) => set({ status: (e.currentTarget as HTMLSelectElement).value as Post["status"] })}>
                  {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </Field>
              <Field id="date" label="Publish date"><Text id="date" type="date" value={p.date} onInput={(v) => set({ date: v })} /></Field>
            </div>
            {p.status === "scheduled" && <Field id="at" label="Goes live at (your local time)"><Text id="at" type="datetime-local" value={(p.publish_at ?? "").slice(0, 16)} onInput={(v) => set({ publish_at: v ? new Date(v).toISOString() : undefined })} /></Field>}
            <Field id="upd" label="Last updated" hint={<button class="link" onClick={() => set({ updated: today() })}>Mark as updated today</button>}><Text id="upd" type="date" value={p.updated ?? ""} onInput={(v) => set({ updated: v || undefined })} /></Field>
            <div class="field"><span style="font-weight:500;font-size:14px">Shown on</span>
              <div class="row">{EDITIONS.map(([k, l]) => <label key={k} class="check"><input type="checkbox" checked={p.editions.includes(k)} onChange={(e) => set({ editions: (e.currentTarget as HTMLInputElement).checked ? [...p.editions, k] : p.editions.filter((x) => x !== k) })} />{l}</label>)}</div>
            </div>
            <div class="row">
              <button class="btn btn-primary" disabled={busy} onClick={() => save()}>{busy ? "Saving…" : "Save"}</button>
              {p.status !== "published" && <button class="btn btn-navy" disabled={busy} onClick={() => save("published")}>Save &amp; mark published</button>}
            </div>
            <p class="counter" style="margin-top:8px">{dirty ? "Unsaved changes." : "All changes saved."} Changes reach the website when you press <b>Publish site</b> at the top.</p>
          </div>

          {result && <ScoreCard score={result.score} checks={result.checks} />}

          <div class="card">
            <h2>Google search <span class="badge">SEO</span></h2>
            <div class="serp" dir={dir}><div class="site">cambridgehospital.com › media-hub › {p.slug || "…"}</div><div class="t">{title.length > 62 ? title.slice(0, 60) + "…" : title}</div><div class="d">{desc || "The description appears here."}</div></div>
            <div style="height:12px" />
            <Field id="kw" label="Focus keyword" hint="Used only for the checks below; never shown on the page."><Text id="kw" dir={dir} value={loc!.focus_keyword ?? ""} onInput={(v) => setLoc({ focus_keyword: v })} /></Field>
            <Field id="st" label="Meta title" hint={<Counter n={title.length} min={TITLE.min} max={TITLE.max} />}><Text id="st" dir={dir} value={loc!.seo?.title ?? ""} placeholder={`${loc!.title} | Cambridge Hospital`} onInput={(v) => setLoc({ seo: { ...loc!.seo, title: v } })} /></Field>
            <Field id="sd" label="Meta description" hint={<Counter n={desc.length} min={DESC.min} max={DESC.max} />}><Text id="sd" rows={3} dir={dir} value={loc!.seo?.description ?? ""} onInput={(v) => setLoc({ seo: { ...loc!.seo, description: v } })} /></Field>
            {!isNew && <Field id="rn" label="Web address" hint="Changing it keeps the old address working (it redirects to the new one).">
              <div class="row"><input id="rn" class="input" value={newSlug || p.slug} onInput={(e) => setNewSlug(slugify((e.currentTarget as HTMLInputElement).value))} />{newSlug && newSlug !== p.slug && <button class="btn btn-sm" onClick={rename}>Change</button>}</div>
            </Field>}
            <label class="check"><input type="checkbox" checked={!!p.noindex} onChange={(e) => set({ noindex: (e.currentTarget as HTMLInputElement).checked || undefined })} />Hide from Google (noindex)</label>
            <Field id="can" label="Canonical link (only if this article first appeared elsewhere)"><Text id="can" value={loc!.canonical ?? ""} onInput={(v) => setLoc({ canonical: v })} /></Field>
          </div>

          <div class="card">
            <h2>Details</h2>
            <div class="grid-2">
              <Field id="type" label="Type"><select id="type" class="input" value={p.type} onChange={(e) => set({ type: (e.currentTarget as HTMLSelectElement).value as Post["type"] })}><option value="blog">Blog (Article)</option><option value="pr">PR / News (NewsArticle)</option></select></Field>
              <Field id="cat" label="Category"><select id="cat" class="input" value={p.category} onChange={(e) => set({ category: (e.currentTarget as HTMLSelectElement).value })}>{[...categories, { key: "interviews", label: "Interviews" }].map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field>
            </div>
            <ImageUpload kind="posts" slug={isNew ? "" : p.slug} value={p.image} onChange={(key) => set({ image: key })} label="Featured image" hint="JPG, PNG, WebP or HEIC; saved as WebP under 200 KB. Describe it in the alt text field." />
            <div class="grid-2">
              <Field id="au" label="Written by"><select id="au" class="input" value={p.author ?? ""} onChange={(e) => set({ author: (e.currentTarget as HTMLSelectElement).value || undefined })}><option value="">Cambridge Hospital</option>{authors.map((a) => <option key={a.slug} value={a.slug}>{a.name.en}</option>)}</select></Field>
              <Field id="rv" label="Reviewed by"><select id="rv" class="input" value={p.reviewer ?? ""} onChange={(e) => set({ reviewer: (e.currentTarget as HTMLSelectElement).value || undefined })}><option value="">No reviewer</option>{authors.map((a) => <option key={a.slug} value={a.slug}>{a.name.en}</option>)}</select></Field>
            </div>
            <label class="check"><input type="checkbox" checked={p.hero_photo === "full"} onChange={(e) => set({ hero_photo: (e.currentTarget as HTMLInputElement).checked ? "full" : undefined })} />Show the whole photo in the hero (desktop)</label>
            <label class="check"><input type="checkbox" checked={loc!.hero_button !== false} onChange={(e) => setLoc({ hero_button: (e.currentTarget as HTMLInputElement).checked ? undefined : false } as Partial<Locale>)} />Show the "Consult for a Care Plan" button</label>
          </div>

          {!isNew && <div class="card">
            <h2>History</h2>
            {versions === null ? <button class="link" onClick={loadVersions}>Show earlier versions</button> : versions.length === 0 ? <p class="help">No earlier versions yet.</p> : (
              <ul class="checks">{versions.map((v) => <li key={v.id}><span>{v.id.replace(/T(\d\d)-(\d\d)-(\d\d)-\d+Z?/, " $1:$2:$3").replace(/-(deleted|before-\w+)$/, " ($1)")}</span><span class="spacer" /><button class="link" onClick={() => restore(v.id)}>Restore</button></li>)}</ul>
            )}
            <div style="height:14px" />
            <h3>Delete</h3>
            <p class="help">A copy is kept under History, but the page disappears from the website at the next publish.</p>
            <div class="row"><input class="input" placeholder={`Type ${p.slug} to confirm`} value={confirmDelete} onInput={(e) => setConfirmDelete((e.currentTarget as HTMLInputElement).value)} /><button class="btn btn-sm btn-danger" disabled={confirmDelete !== p.slug} onClick={remove}>Delete</button></div>
          </div>}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ score, checks }: { score: number; checks: ReturnType<typeof runChecks>["checks"] }) {
  const [tab, setTab] = useState<"SEO" | "GEO">("SEO");
  const ring = score >= 80 ? "#21b573" : score >= 50 ? "#c77d00" : "#d6453d";
  const groups = (["SEO", "GEO"] as const).map((g) => ({ g, done: checks.filter((c) => c.group === g && c.ok).length, total: checks.filter((c) => c.group === g).length }));
  return (
    <div class="card">
      <div class="row" style="margin-bottom:12px">
        <div class="ring" style={`background:conic-gradient(${ring} ${score * 3.6}deg, #e7e7e7 0)`} role="img" aria-label={`Score ${score} of 100`}><div>{score}</div></div>
        <div><h2 style="margin:0">Search &amp; AI score</h2><span class="counter">{score >= 80 ? "Ready to rank." : score >= 50 ? "Good start. Fix the red items." : "Needs work before publishing."}</span></div>
      </div>
      <div class="tabs" role="tablist">{groups.map(({ g, done, total }) => <button key={g} role="tab" class="tab" aria-selected={tab === g} onClick={() => setTab(g)}>{g} {done}/{total}</button>)}</div>
      <ul class="checks">
        {checks.filter((c) => c.group === tab).sort((a, b) => Number(a.ok) - Number(b.ok)).map((c) => (
          <li key={c.label}><span class={`dot ${c.ok ? "ok" : ""}`} aria-hidden="true">{c.ok ? "✓" : "!"}</span><span>{c.label}{!c.ok && <span class="tip">{c.tip}</span>}</span></li>
        ))}
      </ul>
    </div>
  );
}

export const slugify = (s: string) => (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 100);
