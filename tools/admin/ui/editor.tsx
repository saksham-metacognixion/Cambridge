// Rich-text editor for the article body (spec section 5: the editor stores clean HTML, never Word / Docs clutter).
// A contenteditable area with a small toolbar (paragraph, H2, H3, bold, italic, link, lists, quote, photo, video) and an
// "HTML" switch for people who prefer the raw text. Whatever the browser or a paste produces is rewritten by `serialize`
// into the few tags the build's sanitizer keeps (src/lib/sanitize.ts): p, h2–h4, ul, ol, li, a[href], strong, em, br,
// blockquote, table, sup, sub, and the two markers ArticleBody renders itself: <figure data-image="key"><img alt></figure>
// (a photo from src/assets, uploaded here) and <figure data-youtube="id"><a href>title</a></figure> (a click-to-play video).
// Inside the editor those markers are shown as previews that cannot be typed into (contenteditable="false"), with an
// editable caption that becomes the alt text / video title.
import { useEffect, useRef, useState } from "preact/hooks";
import { errorText } from "./api";

type Props = { id: string; value: string; onChange: (html: string) => void; dir?: string; slug: string; otherBody?: string; otherLabel?: string };

/* ---------- HTML in: the stored body -> what the editor shows ---------- */
const MARK = /<figure data-image="([^"]+)">\s*<img alt="([^"]*)"[^>]*>\s*<\/figure>|<figure data-youtube="([A-Za-z0-9_-]{11})">\s*<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/figure>/g;
const focus = (i: HTMLElement | null) => { if (i && !i.dataset.focused) { i.dataset.focused = "1"; setTimeout(() => i.focus(), 0); } };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const photoFigure = (key: string, alt: string) =>
  `<figure data-image="${esc(key)}" contenteditable="false"><img src="/api/admin/image/${esc(key)}" alt=""><figcaption contenteditable="true">${alt}</figcaption><button type="button" class="rte-x" data-remove aria-label="Remove">×</button></figure>`;
const videoFigure = (id: string, href: string, title: string) =>
  `<figure data-youtube="${id}" data-href="${esc(href)}" contenteditable="false"><img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt=""><figcaption contenteditable="true">${title}</figcaption><button type="button" class="rte-x" data-remove aria-label="Remove">×</button></figure>`;
const decorate = (html: string) => html.replace(MARK, (_m, key, alt, id, href, title) => (key ? photoFigure(key, alt) : videoFigure(id, href, title)));

/* ---------- HTML out: the editor's DOM -> clean body HTML ---------- */
const TEXT_BLOCKS = new Set(["p", "h2", "h3", "h4"]);
const CONTAINERS = new Set(["div", "section", "article", "header", "footer", "main", "aside", "nav", "body", "center", "details", "summary"]);
const RENAME: Record<string, string> = { b: "strong", i: "em", h1: "h2", h5: "h4", h6: "h4" };
const INLINE = new Set(["strong", "em", "a", "br", "sup", "sub"]);
const UNWRAP = new Set(["span", "u", "s", "strike", "font", "mark", "small", "code", "label", "abbr", "cite", "q", "time", "big", "tt", "kbd", "var", "samp", "ins", "del", "wbr", "o:p"]); // inline tags the sanitizer drops: their text stays
const safeHref = (h: string | null) => (h && /^(https?:|mailto:|tel:|\/|#)/i.test(h.trim()) ? h.trim() : "");
const tagOf = (el: Element) => { const t = el.tagName.toLowerCase(); return RENAME[t] ?? t; };
const text = (n: Node) => (n.nodeValue ?? "").replace(/ /g, " ");
const trimBlock = (s: string) => s.replace(/^(\s|<br>)+/, "").replace(/(\s|<br>)+$/, "");
const hasText = (root: Element) => /\S/.test(root.textContent ?? "") || !!root.querySelector("figure, img");
const hasContent = (s: string) => /[^\s]/.test(s.replace(/<[^>]+>/g, "")) || /<img /.test(s);

/** Inline content of a node: text and the inline tags; block children are flattened with a line break between them. */
function inline(parent: Node): string {
  let out = "";
  for (const n of Array.from(parent.childNodes)) {
    if (n.nodeType === 3) { out += esc(text(n)); continue; }
    if (n.nodeType !== 1) continue;
    const el = n as Element; const tag = tagOf(el);
    if (tag === "br") { out += "<br>"; continue; }
    if (tag === "img") { const src = safeHref(el.getAttribute("src")); if (src && !src.startsWith("/api/")) out += `<img src="${esc(src)}" alt="${esc(el.getAttribute("alt") ?? "")}">`; continue; }
    if (tag === "a") { const href = safeHref(el.getAttribute("href")); out += href ? `<a href="${esc(href)}">${inline(el)}</a>` : inline(el); continue; }
    if (INLINE.has(tag)) { out += `<${tag}>${inline(el)}</${tag}>`; continue; }
    if (UNWRAP.has(tag)) { out += inline(el); continue; }
    if (tag === "button" || tag === "script" || tag === "style") continue;
    // a block inside an inline context (a <div> the browser nested in a <p>, a <p> in a table cell): its text, on its own line
    const inner = trimBlock(inline(el));
    if (inner) out += (out && !out.endsWith("<br>") ? "<br>" : "") + inner;
  }
  return out;
}

function figure(el: Element): string {
  const key = el.getAttribute("data-image"), id = el.getAttribute("data-youtube");
  const caption = (el.querySelector("figcaption")?.textContent ?? "").replace(/\s+/g, " ").trim();
  if (key) return `<figure data-image="${esc(key)}"><img alt="${esc(caption || el.querySelector("img")?.getAttribute("alt") || "")}"></figure>`;
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
    const href = safeHref(el.getAttribute("data-href") || el.querySelector("a")?.getAttribute("href") || "") || `https://www.youtube.com/watch?v=${id}`;
    return `<figure data-youtube="${id}"><a href="${esc(href)}">${esc(caption || el.querySelector("a")?.textContent?.trim() || "")}</a></figure>`;
  }
  const inner = blocks(el).join("\n"); // an imported figure (a table, an external image)
  return inner ? `<figure>${inner}</figure>` : "";
}

function list(el: Element, tag: "ul" | "ol"): string {
  const items: string[] = [];
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === 3) { const t = text(n).trim(); if (t) items.push(`<li>${esc(t)}</li>`); continue; }
    if (n.nodeType !== 1) continue;
    const c = n as Element, ct = tagOf(c);
    if (ct === "ul" || ct === "ol") { const nested = list(c, ct); if (nested && items.length) items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, `\n${nested}\n</li>`); else if (nested) items.push(`<li>${nested}</li>`); continue; }
    let body = "";
    for (const k of Array.from(c.childNodes)) {
      if (k.nodeType === 1 && (tagOf(k as Element) === "ul" || tagOf(k as Element) === "ol")) { const nested = list(k as Element, tagOf(k as Element) as "ul" | "ol"); if (nested) body = trimBlock(body) + `\n${nested}\n`; }
      else body += inline({ childNodes: [k] } as unknown as Node);
    }
    body = trimBlock(body);
    if (hasContent(body)) items.push(`<li>${body}</li>`);
  }
  if (!items.length) return "";
  const start = tag === "ol" && Number(el.getAttribute("start")) > 1 ? ` start="${Number(el.getAttribute("start"))}"` : "";
  return `<${tag}${start}>\n${items.join("\n")}\n</${tag}>`;
}

function table(el: Element): string {
  const rows = (rowsOf: Element) => Array.from(rowsOf.children).filter((r) => r.tagName === "TR").map((r) =>
    `<tr>${Array.from(r.children).filter((c) => c.tagName === "TD" || c.tagName === "TH").map((c) => {
      const t = c.tagName.toLowerCase(); const span = ["colspan", "rowspan"].map((a) => (c.getAttribute(a) ? ` ${a}="${Number(c.getAttribute(a))}"` : "")).join("");
      return `<${t}${span}>${trimBlock(inline(c))}</${t}>`;
    }).join("")}</tr>`).join("\n");
  const parts: string[] = [];
  for (const sec of Array.from(el.children)) {
    const t = sec.tagName.toLowerCase();
    if (t === "thead" || t === "tbody") { const r = rows(sec); if (r) parts.push(`<${t}>\n${r}\n</${t}>`); }
    else if (t === "tr") { const r = rows(el); if (r) parts.push(`<tbody>\n${r}\n</tbody>`); break; }
  }
  return parts.length ? `<table>\n${parts.join("\n")}\n</table>` : "";
}

const NESTED = ":scope > ul, :scope > ol, :scope > blockquote, :scope > table, :scope > figure, :scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > div";

/** The block-level pieces of a node, in order; stray inline content becomes a paragraph (or `wrap`, the tag of a text block
 *  the browser nested other blocks into: Chrome puts a new list or quote inside the <p> the caret was in). */
function blocks(parent: Node, wrap = "p"): string[] {
  const out: string[] = []; let run = "";
  const flush = () => { const t = trimBlock(run); if (hasContent(t)) out.push(`<${wrap}>${t}</${wrap}>`); run = ""; };
  for (const n of Array.from(parent.childNodes)) {
    if (n.nodeType === 3) { run += esc(text(n)); continue; }
    if (n.nodeType !== 1) continue;
    const el = n as Element, tag = tagOf(el);
    if (tag === "br" || INLINE.has(tag) || tag === "img" || UNWRAP.has(tag)) { run += UNWRAP.has(tag) ? inline(el) : inline({ childNodes: [el] } as unknown as Node); continue; }
    flush();
    if (TEXT_BLOCKS.has(tag)) { if (el.querySelector(NESTED)) out.push(...blocks(el, tag)); else { const t = trimBlock(inline(el)); if (hasContent(t)) out.push(`<${tag}>${t}</${tag}>`); } }
    else if (tag === "ul" || tag === "ol") { const l = list(el, tag); if (l) out.push(l); }
    else if (tag === "blockquote") { const b = blocks(el).join("\n"); if (b) out.push(`<blockquote>\n${b}\n</blockquote>`); }
    else if (tag === "figure") { const f = figure(el); if (f) out.push(f); }
    else if (tag === "table") { const t = table(el); if (t) out.push(t); }
    else if (tag === "li") { const t = trimBlock(inline(el)); if (hasContent(t)) out.push(`<ul>\n<li>${t}</li>\n</ul>`); }
    else if (CONTAINERS.has(tag)) {
      // a <div> the browser made for a new line = a paragraph; a div that holds blocks = just a wrapper
      if (Array.from(el.children).some((c) => !INLINE.has(tagOf(c)) && tagOf(c) !== "img" && !UNWRAP.has(tagOf(c)))) out.push(...blocks(el));
      else { const t = trimBlock(inline(el)); if (hasContent(t)) out.push(`<p>${t}</p>`); }
    }
    else if (tag === "button" || tag === "script" || tag === "style" || tag === "iframe" || tag === "svg" || tag === "template") { /* dropped */ }
    else { run += inline(el); }
  }
  flush();
  return out;
}

export const serialize = (root: Node) => blocks(root).join("\n\n");
export const normalizeHtml = (html: string) => { const d = document.createElement("div"); d.innerHTML = html; return serialize(d); };
const photoKeys = (html: string) => Array.from((html || "").matchAll(/<figure data-image="([^"]+)">\s*<img alt="([^"]*)"/g)).map((m) => ({ key: m[1], alt: m[2] }));
const youtubeId = (url: string) => /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(url)?.[1] ?? (/^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : "");

/* ---------- the component ---------- */
type BProps = { cmd?: string; arg?: string; label: string; on?: boolean; title: string; onClick?: () => void; exec: (cmd: string, arg?: string) => void };
// mousedown is cancelled so the text selection in the editor survives the click
function ToolButton({ cmd, arg, label, on, title, onClick, exec }: BProps) {
  return <button type="button" class={`rte-b${on ? " on" : ""}`} title={title} aria-label={title} aria-pressed={on} onMouseDown={(e) => e.preventDefault()} onClick={() => (onClick ? onClick() : exec(cmd!, arg))}>{label}</button>;
}
type Panel = { kind: "link"; url: string; hasLink: boolean } | { kind: "video"; url: string; title: string } | { kind: "alt"; key: string; alt: string } | { kind: "photo" };

export function RichText({ id, value, onChange, dir, slug, otherBody, otherLabel }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const last = useRef<string | null>(null);
  const emitted = useRef(new Set<string>()); // values we sent up: a render that carries one of them is ours, not an outside change
  const saved = useRef<Range | null>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [state, setState] = useState({ bold: false, italic: false, block: "p", link: false, ul: false, ol: false });
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // load the value into the editor only when it changed outside (language switch, restore), never after our own input:
  // renders arrive one state at a time, so a render may still carry an older value of ours while the text has moved on
  useEffect(() => {
    const root = el.current;
    if (mode !== "visual" || !root) return;
    if (emitted.current.has(value)) { if (value === last.current) emitted.current.clear(); return; }
    root.innerHTML = decorate(value || "") || "<p><br></p>";
    root.dataset.empty = hasText(root) ? "" : "1";
    last.current = value; emitted.current.clear();
  }, [value, mode]);
  useEffect(() => { try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* old browsers */ } }, []);
  useEffect(() => {
    const onSel = () => {
      const root = el.current; const sel = document.getSelection();
      if (!root || !sel || !sel.anchorNode || !root.contains(sel.anchorNode)) return;
      let n: Node | null = sel.anchorNode; let block = "p", link = false;
      while (n && n !== root) { if (n.nodeType === 1) { const t = (n as Element).tagName.toLowerCase(); if (t === "a") link = true; if (["h2", "h3", "h4", "blockquote", "li"].includes(t) && block === "p") block = t; } n = n.parentNode; }
      setState({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), ul: document.queryCommandState("insertUnorderedList"), ol: document.queryCommandState("insertOrderedList"), block, link });
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const emit = () => {
    const root = el.current; if (!root) return;
    if (!root.firstElementChild && root.textContent) { document.execCommand("formatBlock", false, "p"); return; } // typing into an empty editor: wrap the line (fires input again)
    if (!root.firstChild) root.innerHTML = "<p><br></p>";
    root.dataset.empty = hasText(root) ? "" : "1";
    const html = serialize(root); last.current = html; emitted.current.add(html); onChange(html);
  };
  const exec = (cmd: string, arg?: string) => { el.current?.focus(); document.execCommand(cmd, false, arg); emit(); };
  const saveSel = () => { const s = document.getSelection(); saved.current = s && s.rangeCount && el.current?.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null; };
  const restoreSel = () => {
    const root = el.current; if (!root) return; root.focus();
    const s = document.getSelection(); if (!s) return;
    s.removeAllRanges();
    if (saved.current) s.addRange(saved.current);
    else { const r = document.createRange(); r.selectNodeContents(root); r.collapse(false); s.addRange(r); }
  };
  const insertBlock = (html: string) => { restoreSel(); document.execCommand("insertHTML", false, `${html}<p><br></p>`); emit(); };
  const open = (p: Panel) => { saveSel(); setMsg(null); setPanel(p); };

  const openLink = () => {
    const s = document.getSelection(); let n: Node | null = s?.anchorNode ?? null; let a: HTMLAnchorElement | null = null;
    while (n && n !== el.current) { if ((n as Element).tagName === "A") { a = n as HTMLAnchorElement; break; } n = n.parentNode; }
    open({ kind: "link", url: a?.getAttribute("href") ?? "", hasLink: !!a });
  };
  const applyLink = (url: string) => {
    const href = safeHref(url.startsWith("www.") ? `https://${url}` : url);
    restoreSel();
    if (!href) { setMsg({ ok: false, text: "Use a full address starting with https://, mailto: or tel:." }); return; }
    const s = document.getSelection();
    if (s && s.isCollapsed && !state.link) document.execCommand("insertHTML", false, `<a href="${esc(href)}">${esc(href)}</a>`);
    else document.execCommand("createLink", false, href);
    emit(); setPanel(null);
  };
  const nextSuffix = () => { let n = 1; for (const { key } of [...photoKeys(value), ...photoKeys(otherBody ?? "")]) { const m = new RegExp(`^news/${slug}-(\\d+)$`).exec(key); if (m) n = Math.max(n, Number(m[1])); } return String(n + 1); };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/admin/upload/posts/${encodeURIComponent(slug)}?suffix=${nextSuffix()}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type || "application/octet-stream", "X-Requested-With": "admin" }, body: file });
    const r = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; key?: string; bytes?: number };
    setBusy(false);
    if (!res.ok || !r.key) { setMsg({ ok: false, text: r.error === "bad_image" ? "That file is not an image we can read (JPG, PNG, WebP, AVIF, HEIC)." : r.error === "too_large" ? "The file is over 15 MB." : errorText(r) }); return; }
    setPanel({ kind: "alt", key: r.key, alt: "" });
  };
  const onPaste = (e: ClipboardEvent) => {
    const html = e.clipboardData?.getData("text/html"), plain = e.clipboardData?.getData("text/plain") ?? "";
    if (!html && !plain) return;
    e.preventDefault();
    const clean = html ? normalizeHtml(html.replace(/<!--[\s\S]*?-->/g, "")) : plain.split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).filter((p) => p !== "<p></p>").join("\n\n");
    document.execCommand("insertHTML", false, clean);
    emit();
  };
  const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); } };
  const onClick = (e: MouseEvent) => { const t = e.target as HTMLElement; if (t.closest("[data-remove]")) { t.closest("figure")?.remove(); emit(); } };

  const B = (p: Omit<BProps, "exec">) => <ToolButton {...p} exec={exec} />;
  const others = photoKeys(otherBody ?? "");

  return (
    <div class="rte">
      <div class="rte-bar" role="toolbar" aria-label="Formatting">
        {mode === "visual" && <>
          <B cmd="formatBlock" arg="p" label="¶" title="Paragraph" on={state.block === "p"} />
          <B cmd="formatBlock" arg="h2" label="H2" title="Heading" on={state.block === "h2"} />
          <B cmd="formatBlock" arg="h3" label="H3" title="Sub-heading" on={state.block === "h3"} />
          <span class="rte-sep" />
          <B cmd="bold" label="B" title="Bold (Ctrl+B)" on={state.bold} />
          <B cmd="italic" label="I" title="Italic (Ctrl+I)" on={state.italic} />
          <B label="Link" title="Link (Ctrl+K)" on={state.link} onClick={openLink} />
          <span class="rte-sep" />
          <B cmd="insertUnorderedList" label="• List" title="Bullet list" on={state.ul} />
          <B cmd="insertOrderedList" label="1. List" title="Numbered list" on={state.ol} />
          <B cmd="formatBlock" arg="blockquote" label="Quote" title="Quote" on={state.block === "blockquote"} />
          <span class="rte-sep" />
          <B label="Photo" title="Photo in the text" onClick={() => (slug ? open({ kind: "photo" }) : setMsg({ ok: false, text: "Save the post first, then add photos." }))} />
          <B label="Video" title="YouTube video" onClick={() => open({ kind: "video", url: "", title: "" })} />
          <span class="rte-sep" />
          <B cmd="undo" label="↶" title="Undo" />
          <B cmd="redo" label="↷" title="Redo" />
        </>}
        <span class="spacer" />
        <button type="button" class={`rte-b${mode === "html" ? " on" : ""}`} aria-pressed={mode === "html"} onClick={() => { setPanel(null); setMode(mode === "html" ? "visual" : "html"); }}>HTML</button>
      </div>

      {panel?.kind === "link" && <form class="rte-panel" onSubmit={(e) => { e.preventDefault(); applyLink(panel.url); }}>
        <input class="input" type="url" placeholder="https://…" value={panel.url} ref={focus} aria-label="Link address" onInput={(e) => setPanel({ ...panel, url: (e.currentTarget as HTMLInputElement).value })} />
        <button type="submit" class="btn btn-sm btn-navy">{panel.hasLink ? "Update link" : "Add link"}</button>
        {panel.hasLink && <button type="button" class="btn btn-sm" onClick={() => { restoreSel(); document.execCommand("unlink"); emit(); setPanel(null); }}>Remove link</button>}
        <button type="button" class="link" onClick={() => setPanel(null)}>Cancel</button>
      </form>}
      {panel?.kind === "photo" && <div class="rte-panel">
        <label class="btn btn-sm btn-navy" style="cursor:pointer">{busy ? "Uploading…" : "Upload a photo"}
          <input type="file" accept="image/*" style="display:none" disabled={busy} onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ""; upload(f); }} />
        </label>
        {others.length > 0 && <select class="input" style="max-width:360px" aria-label={`Photos in the ${otherLabel ?? "other"} text`} onChange={(e) => { const k = (e.currentTarget as HTMLSelectElement).value; if (k) setPanel({ kind: "alt", key: k, alt: "" }); }}>
          <option value="">…or reuse a photo from the {otherLabel ?? "other"} text</option>
          {others.map((o) => <option key={o.key} value={o.key}>{o.alt || o.key}</option>)}
        </select>}
        <span class="counter">Converted to WebP under 200 KB. Shown at the width of the text.</span>
        <button type="button" class="link" onClick={() => setPanel(null)}>Cancel</button>
      </div>}
      {panel?.kind === "alt" && <form class="rte-panel" onSubmit={(e) => { e.preventDefault(); if (!panel.alt.trim()) { setMsg({ ok: false, text: "Describe the photo: this text is read by screen readers and search engines." }); return; } insertBlock(photoFigure(panel.key, esc(panel.alt.trim()))); setPanel(null); }}>
        <img src={`/api/admin/image/${panel.key}`} alt="" style="width:72px;height:50px;object-fit:cover;border-radius:6px" />
        <input class="input" placeholder="Describe the photo (alt text)" value={panel.alt} ref={focus} aria-label="Photo description" dir={dir} onInput={(e) => setPanel({ ...panel, alt: (e.currentTarget as HTMLInputElement).value })} />
        <button type="submit" class="btn btn-sm btn-navy">Insert photo</button>
        <button type="button" class="link" onClick={() => setPanel(null)}>Cancel</button>
      </form>}
      {panel?.kind === "video" && <form class="rte-panel" onSubmit={(e) => { e.preventDefault(); const vid = youtubeId(panel.url); if (!vid) { setMsg({ ok: false, text: "Paste a YouTube link, e.g. https://www.youtube.com/watch?v=…" }); return; } insertBlock(videoFigure(vid, `https://www.youtube.com/watch?v=${vid}`, esc(panel.title.trim()))); setPanel(null); }}>
        <input class="input" type="url" placeholder="YouTube link" value={panel.url} ref={focus} aria-label="YouTube link" onInput={(e) => setPanel({ ...panel, url: (e.currentTarget as HTMLInputElement).value })} />
        <input class="input" placeholder="Video title (shown on the play button)" value={panel.title} aria-label="Video title" dir={dir} onInput={(e) => setPanel({ ...panel, title: (e.currentTarget as HTMLInputElement).value })} />
        <button type="submit" class="btn btn-sm btn-navy">Insert video</button>
        <button type="button" class="link" onClick={() => setPanel(null)}>Cancel</button>
      </form>}
      {msg && <div class={`counter ${msg.ok ? "ok" : "bad"}`} style="padding:6px 12px">{msg.text}</div>}

      {mode === "visual"
        ? <div id={id} ref={el} class="rte-body" contentEditable dir={dir} role="textbox" aria-multiline="true" aria-label="Article text" spellcheck onInput={emit} onPaste={onPaste} onKeyDown={onKey} onClick={onClick} />
        : <textarea id={id} class="input mono rte-html" rows={22} dir={dir} value={value} aria-label="Article HTML" onInput={(e) => { const v = (e.currentTarget as HTMLTextAreaElement).value; last.current = null; onChange(v); }} />}
    </div>
  );
}
