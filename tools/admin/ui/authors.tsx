// Authors and medical reviewers: list + editor (src/content/authors/<slug>.json, src/lib/authors-schema.ts).
import { useEffect, useState } from "preact/hooks";
import { api, errorText } from "./api";
import { Field, StringList, Text } from "./ui";
import { slugify } from "./posts";
import { ImageUpload } from "./upload";

type Author = { slug: string; name: { en: string; ar?: string }; role?: { en: string; ar?: string }; credentials?: string; bio?: { en: string; ar?: string }; photo?: string; linkedin?: string; same_as?: string[]; active?: boolean };
type Nav = (path: string) => void;
const blank = (): Author => ({ slug: "", name: { en: "" }, active: true });

export function AuthorsList({ nav }: { nav: Nav }) {
  const [items, setItems] = useState<Author[] | null>(null);
  useEffect(() => { api<{ items: Author[] }>("GET", "/authors").then((r) => setItems(r.items ?? [])); }, []);
  if (!items) return <p class="empty">Loading…</p>;
  return (
    <div>
      <div class="page-head">
        <div><h1>Authors &amp; reviewers</h1><p class="sub">Writers and the clinicians who review articles. A photo, credentials and a short bio help Google and AI tools trust the article.</p></div>
        <span class="spacer" />
        <button class="btn btn-primary" onClick={() => nav("/admin/authors/new")}>+ New author</button>
      </div>
      <div class="list">
        {items.map((a) => (
          <div class="item" key={a.slug} style="grid-template-columns: minmax(0,1fr) auto">
            <div><a class="title" href={`/admin/authors/${a.slug}`} onClick={(e) => { e.preventDefault(); nav(`/admin/authors/${a.slug}`); }}>{a.name.en}</a><div class="meta"><span>{a.role?.en}</span>{a.credentials && <span>· {a.credentials}</span>}{a.active === false && <span class="chip archived">Hidden</span>}</div></div>
            <button class="btn btn-sm btn-navy" onClick={() => nav(`/admin/authors/${a.slug}`)}>Edit</button>
          </div>
        ))}
        {items.length === 0 && <p class="empty">No authors yet. Add the first one.</p>}
      </div>
    </div>
  );
}

export function AuthorEditor({ slug, nav, toast }: { slug: string; nav: Nav; toast: (t: string) => void }) {
  const isNew = slug === "new";
  const [a, setA] = useState<Author | null>(isNew ? blank() : null);
  const [err, setErr] = useState<{ text: string; fields?: { field: string; message: string }[] } | null>(null);
  const [confirm, setConfirm] = useState("");
  useEffect(() => { if (!isNew) api<{ item: Author }>("GET", `/authors/${slug}`).then((r) => (r.item ? setA(r.item) : setErr({ text: "Author not found." }))); }, [slug]);
  if (!a) return <p class="empty">{err?.text ?? "Loading…"}</p>;
  const set = (patch: Partial<Author>) => setA({ ...a, ...patch });
  const loc = (k: "name" | "role" | "bio", l: "en" | "ar", v: string) => set({ [k]: { ...(a[k] ?? { en: "" }), [l]: v || undefined } } as Partial<Author>);

  const save = async () => {
    setErr(null);
    const data: Author = { ...a, slug: a.slug || slugify(a.name.en) };
    for (const k of ["role", "bio"] as const) if (data[k] && !data[k]!.en && !data[k]!.ar) delete data[k];
    for (const k of ["credentials", "photo", "linkedin"] as const) if (!data[k]) delete data[k];
    if (!data.same_as?.filter(Boolean).length) delete data.same_as; else data.same_as = data.same_as.filter(Boolean);
    if (!data.name.en.trim()) { setErr({ text: "Add the name first." }); return; }
    const r = isNew ? await api("POST", "/authors", data) : await api("PUT", `/authors/${a.slug}`, data);
    if (!r.ok) { setErr({ text: errorText(r), fields: r.details }); return; }
    toast("Author saved"); if (isNew) nav(`/admin/authors/${data.slug}`); else setA(data);
  };
  const remove = async () => {
    const r = await api("DELETE", `/authors/${a.slug}?confirm=${encodeURIComponent(confirm)}`);
    if (!r.ok) { setErr({ text: errorText(r) }); return; }
    toast("Author deleted"); nav("/admin/authors");
  };
  return (
    <div>
      <button class="link" onClick={() => nav("/admin/authors")}>← All authors</button>
      <div class="page-head" style="margin-top:8px"><h1>{isNew ? "New author" : a.name.en}</h1></div>
      {err && <div class="error-box" role="alert">{err.text}{err.fields && <ul>{err.fields.map((f) => <li key={f.field}><b>{f.field}</b>: {f.message}</li>)}</ul>}</div>}
      <div class="editor" style="margin-top:14px">
        <div class="card">
          <div class="grid-2">
            <Field id="n-en" label="Name (English)"><Text id="n-en" value={a.name.en} onInput={(v) => loc("name", "en", v)} /></Field>
            <Field id="n-ar" label="Name (Arabic)"><Text id="n-ar" dir="rtl" value={a.name.ar ?? ""} onInput={(v) => loc("name", "ar", v)} /></Field>
            <Field id="r-en" label="Role (English)"><Text id="r-en" value={a.role?.en ?? ""} placeholder="e.g. Consultant Neurologist" onInput={(v) => loc("role", "en", v)} /></Field>
            <Field id="r-ar" label="Role (Arabic)"><Text id="r-ar" dir="rtl" value={a.role?.ar ?? ""} onInput={(v) => loc("role", "ar", v)} /></Field>
          </div>
          <Field id="cred" label="Credentials" hint="e.g. MD, FRCP. Shown after the name and sent to Google as a credential."><Text id="cred" value={a.credentials ?? ""} onInput={(v) => set({ credentials: v })} /></Field>
          <Field id="b-en" label="Short bio (English)"><Text id="b-en" rows={4} value={a.bio?.en ?? ""} onInput={(v) => loc("bio", "en", v)} /></Field>
          <Field id="b-ar" label="Short bio (Arabic)"><Text id="b-ar" rows={4} dir="rtl" value={a.bio?.ar ?? ""} onInput={(v) => loc("bio", "ar", v)} /></Field>
        </div>
        <div class="side">
          <div class="card">
            <h2>Profile</h2>
            {isNew && <Field id="slug" label="Web address" hint="Leave empty to make it from the name."><input id="slug" class="input" value={a.slug} placeholder={slugify(a.name.en)} onInput={(e) => set({ slug: slugify((e.currentTarget as HTMLInputElement).value) })} /></Field>}
            <ImageUpload kind="authors" slug={isNew ? "" : a.slug} value={a.photo ?? ""} onChange={(key) => set({ photo: key })} label="Photo" hint="A square portrait works best." />
            <Field id="li" label="LinkedIn"><Text id="li" value={a.linkedin ?? ""} placeholder="https://www.linkedin.com/in/…" onInput={(v) => set({ linkedin: v })} /></Field>
            <div class="field"><span style="font-weight:500;font-size:14px">Other profiles (schema sameAs)</span><StringList value={a.same_as?.length ? a.same_as : []} onChange={(v) => set({ same_as: v })} placeholder="https://…" add="Add a profile link" /></div>
            <label class="check"><input type="checkbox" checked={a.active !== false} onChange={(e) => set({ active: (e.currentTarget as HTMLInputElement).checked ? undefined : false })} />Shown on the website</label>
            <div style="height:12px" />
            <button class="btn btn-primary" onClick={save}>Save</button>
          </div>
          {!isNew && <div class="card">
            <h3>Delete</h3>
            <p class="help">Not possible while a post names this person as author or reviewer.</p>
            <div class="row"><input class="input" placeholder={`Type ${a.slug} to confirm`} value={confirm} onInput={(e) => setConfirm((e.currentTarget as HTMLInputElement).value)} /><button class="btn btn-sm btn-danger" disabled={confirm !== a.slug} onClick={remove}>Delete</button></div>
          </div>}
        </div>
      </div>
    </div>
  );
}
