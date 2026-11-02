// Settings: which AI crawlers may read the site (spec section 6), the manual 301 redirects (the spec's redirect manager) and
// the Google Analytics measurement id (user, 2 Nov 2026).
// AI crawlers write src/data/robots.json; the build turns it into one robots.txt group per crawler (src/pages/robots.txt.ts).
// Everything not listed falls under "User-agent: *" = allowed. Redirects write src/data/redirects.json; the build puts them
// first in dist/_redirects (src/lib/redirects.ts), ahead of the automatic ones (old live-site URLs, renamed posts). Analytics
// writes `measurementId` in src/data/analytics.json, read at build time by src/components/Analytics.astro.
import { useEffect, useState } from "preact/hooks";
import { api, errorText } from "./api";
import { setUnsaved } from "./unsaved";

type Crawlers = Record<string, boolean>;
// Known crawlers, so the list explains itself; any other name can be added.
const KNOWN: Record<string, string> = {
  "OAI-SearchBot": "ChatGPT search (shows the site in ChatGPT answers with a link)",
  "ChatGPT-User": "ChatGPT browsing on a user's request",
  "GPTBot": "OpenAI: training data",
  "PerplexityBot": "Perplexity search index",
  "Perplexity-User": "Perplexity browsing on a user's request",
  "Claude-SearchBot": "Claude search",
  "Claude-User": "Claude browsing on a user's request",
  "ClaudeBot": "Anthropic: training data",
  "Google-Extended": "Google: Gemini training (Google Search and AI Overviews are NOT affected by this)",
  "Applebot": "Apple: Siri and Spotlight search",
  "Applebot-Extended": "Apple: training data",
  "Bingbot": "Microsoft Bing and Copilot search",
  "Meta-ExternalAgent": "Meta: training data",
  "Amazonbot": "Amazon Alexa answers",
  "CCBot": "Common Crawl (open dataset used for AI training)",
  "DuckAssistBot": "DuckDuckGo AI answers",
  "MistralAI-User": "Mistral Le Chat browsing on a user's request",
  "Bytespider": "ByteDance / TikTok",
};

export function Settings({ toast, siteUrl }: { toast: (t: string) => void; siteUrl: string }) {
  return (
    <div>
      <div class="page-head"><div><h1>Settings</h1><p class="sub">AI crawlers, robots.txt, redirects and Google Analytics.</p></div></div>
      <div class="editor" style="margin-top:14px">
        <div>
          <Crawlers toast={toast} siteUrl={siteUrl} />
          <Redirects toast={toast} />
          <Analytics toast={toast} />
        </div>
        <div class="side">
          <div class="card">
            <h2>What reaches the website</h2>
            <p class="help">Each setting is saved here and reaches the website on the next <b>Publish site</b>.</p>
            <p class="help">Cloudflare can block AI crawlers before they reach the site ("Block AI bots", "Managed robots.txt"). Those switches are in the Cloudflare dashboard, not here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Crawlers({ toast, siteUrl }: { toast: (t: string) => void; siteUrl: string }) {
  const [crawlers, setCrawlers] = useState<Crawlers | null>(null);
  const [orig, setOrig] = useState<Crawlers | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { api<{ aiCrawlers: Crawlers }>("GET", "/settings/robots").then((r) => { setCrawlers(r.aiCrawlers ?? {}); setOrig(r.aiCrawlers ?? {}); }); }, []);
  const dirty = !!crawlers && !!orig && JSON.stringify(crawlers) !== JSON.stringify(orig);
  useEffect(() => { setUnsaved("settings:robots", dirty); return () => setUnsaved("settings:robots", false); }, [dirty]); // "Publish site" waits for a save
  if (!crawlers || !orig) return <div class="card"><p class="empty">Loading…</p></div>;
  const save = async () => {
    setErr("");
    const r = await api<{ aiCrawlers: Crawlers }>("PUT", "/settings/robots", { aiCrawlers: crawlers });
    if (!r.ok) { setErr(errorText(r)); return; }
    setOrig(r.aiCrawlers!); setCrawlers(r.aiCrawlers!); toast("Saved. Press Publish site to update robots.txt.");
  };
  const add = () => { const n = name.trim(); if (!n) return; if (!/^[A-Za-z0-9_.-]{1,60}$/.test(n)) { setErr("A crawler name is letters, digits, - _ . only."); return; } setCrawlers({ ...crawlers, [n]: true }); setName(""); };
  const preview = `User-agent: *\nAllow: /\n\n${Object.entries(crawlers).map(([a, ok]) => `User-agent: ${a}\n${ok ? "Allow" : "Disallow"}: /\n`).join("\n")}\nSitemap: ${siteUrl}/sitemap-index.xml`;
  return (
    <div class="card">
      <h2>AI crawlers <span class="badge">GEO</span></h2>
      <p class="help">Who may read the site for AI search and AI answers. Google, Bing and every crawler not listed here are always allowed. "Block" writes a Disallow group for that crawler in robots.txt; it does not stop a crawler that ignores robots.txt.</p>
      {err && <div class="error-box" role="alert" style="margin-bottom:12px">{err}</div>}
      <div class="pairs">
        {Object.entries(crawlers).map(([agent, ok]) => (
          <div class="row" key={agent} style="padding:8px 0;border-bottom:1px solid var(--mist)">
            <div style="flex:1 1 260px"><b>{agent}</b><span class="counter" style="display:block">{KNOWN[agent] ?? "Custom crawler"}</span></div>
            <label class="check"><input type="radio" name={agent} checked={ok} onChange={() => setCrawlers({ ...crawlers, [agent]: true })} /> Allow</label>
            <label class="check"><input type="radio" name={agent} checked={!ok} onChange={() => setCrawlers({ ...crawlers, [agent]: false })} /> Block</label>
            <button type="button" class="x" aria-label={`Remove ${agent}`} title="Remove (falls back to allowed)" onClick={() => { const n = { ...crawlers }; delete n[agent]; setCrawlers(n); }}>×</button>
          </div>
        ))}
      </div>
      <div class="row" style="margin-top:12px">
        <input class="input" placeholder="Add a crawler by its user-agent name, e.g. Bytespider" value={name} aria-label="Crawler name" onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => e.key === "Enter" && add()} list="known-crawlers" />
        <datalist id="known-crawlers">{Object.keys(KNOWN).filter((k) => !(k in crawlers)).map((k) => <option key={k} value={k} />)}</datalist>
        <button type="button" class="btn btn-sm" onClick={add}>Add</button>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn btn-primary" disabled={!dirty} onClick={save}>Save</button>
        <span class="counter">{dirty ? "Unsaved changes." : "Saved."} robots.txt changes reach the website on the next <b>Publish site</b>.</span>
      </div>
      <details style="margin-top:16px">
        <summary class="counter" style="cursor:pointer">robots.txt preview (staging serves "Disallow: /" until the site is set to indexable)</summary>
        <pre style="background:#0b2a36;color:#d6f0f7;font-size:12px;padding:10px;border-radius:8px;white-space:pre-wrap;margin:8px 0 0">{preview}</pre>
      </details>
    </div>
  );
}

/* ---------- redirects ---------- */
type Rule = { from: string; to: string; note: string; added?: string };
type Auto = { from: string; to: string; post: string; title: string };
const blankRule = (): Rule => ({ from: "", to: "", note: "" });
/** "redirects.3.to" -> "Rule 4, new address" (the server names the row and field). */
const where = (field: string) => { const m = /^redirects\.(\d+)\.(from|to|note)$/.exec(field); return m ? `Rule ${Number(m[1]) + 1}, ${{ from: "old address", to: "new address", note: "note" }[m[2]]}` : field; };

function Redirects({ toast }: { toast: (t: string) => void }) {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [orig, setOrig] = useState<Rule[] | null>(null);
  const [auto, setAuto] = useState<Auto[]>([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [err, setErr] = useState<{ text: string; fields?: { field: string; message: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ redirects: Rule[]; automatic: Auto[]; siteUrl: string }>("GET", "/settings/redirects").then((r) => { setRules(r.redirects ?? []); setOrig(r.redirects ?? []); setAuto(r.automatic ?? []); setSiteUrl(r.siteUrl ?? ""); }); }, []);
  const dirty = !!rules && !!orig && JSON.stringify(rules) !== JSON.stringify(orig);
  useEffect(() => { setUnsaved("settings:redirects", dirty); return () => setUnsaved("settings:redirects", false); }, [dirty]);
  if (!rules || !orig) return <div class="card"><p class="empty">Loading…</p></div>;
  const upd = (i: number, patch: Partial<Rule>) => setRules(rules.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const bad = (i: number, f: "from" | "to") => err?.fields?.some((x) => x.field === `redirects.${i}.${f}`);
  const save = async () => {
    setBusy(true); setErr(null);
    const kept = rules.filter((r) => r.from.trim() || r.to.trim()); // an empty row is dropped, not an error
    const r = await api<{ redirects: Rule[]; automatic: Auto[] }>("PUT", "/settings/redirects", { redirects: kept });
    setBusy(false);
    if (!r.ok) { setErr({ text: errorText(r), fields: r.details }); return; }
    setRules(r.redirects!); setOrig(r.redirects!); setAuto(r.automatic ?? auto);
    toast("Saved. Press Publish site to put the redirects on the website.");
  };
  return (
    <div class="card">
      <h2>Redirects <span class="badge">SEO</span></h2>
      <p class="help">Send an old address to a new one with a permanent (301) redirect: a page that was renamed or removed, a leaflet link that must keep working, a campaign address. Old address = a path on this website (<code>/old-page/</code>; a full address of this site pastes fine). New address = a page of this website or a full <code>https://</code> link elsewhere. Point every rule straight at the final page; the server refuses a rule that goes to another redirected address or that would hide a published post.</p>
      {err && <div class="error-box" role="alert" style="margin-bottom:12px">{err.text}{err.fields && <ul>{err.fields.map((f) => <li key={f.field + f.message}>{where(f.field)}: {f.message}.</li>)}</ul>}</div>}
      <div class="pairs">
        {rules.map((r, i) => (
          <div class="pair" key={i}>
            <div class="row">
              <input class="input" value={r.from} placeholder="Old address, e.g. /old-page/" aria-label={`Rule ${i + 1}: old address`} aria-invalid={bad(i, "from") || undefined} style={bad(i, "from") ? "border-color:var(--error)" : ""} onInput={(e) => upd(i, { from: (e.currentTarget as HTMLInputElement).value })} />
              <span class="counter" aria-hidden="true">→</span>
              <input class="input" value={r.to} placeholder="New address, e.g. /media-hub/new-post/" aria-label={`Rule ${i + 1}: new address`} aria-invalid={bad(i, "to") || undefined} style={bad(i, "to") ? "border-color:var(--error)" : ""} onInput={(e) => upd(i, { to: (e.currentTarget as HTMLInputElement).value })} />
              <button type="button" class="x" aria-label={`Remove rule ${i + 1}`} onClick={() => setRules(rules.filter((_, k) => k !== i))}>×</button>
            </div>
            <div class="row">
              <input class="input" value={r.note} placeholder="Why (optional, shown here only)" aria-label={`Rule ${i + 1}: note`} onInput={(e) => upd(i, { note: (e.currentTarget as HTMLInputElement).value })} />
              {r.added && <span class="counter" style="flex:0 0 auto">Added {r.added}</span>}
            </div>
          </div>
        ))}
        {rules.length === 0 && <p class="help" style="margin:0 0 8px">No manual redirects yet.</p>}
        <button type="button" class="add" onClick={() => setRules([...rules, blankRule()])}>+ Add a redirect</button>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn btn-primary" disabled={!dirty || busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        <span class="counter">{dirty ? "Unsaved changes." : "Saved."} Redirects reach the website on the next <b>Publish site</b>.</span>
      </div>
      {auto.length > 0 && (
        <details style="margin-top:16px">
          <summary class="counter" style="cursor:pointer">{auto.length} automatic redirect{auto.length === 1 ? "" : "s"} from renamed posts (made by the website itself, in every edition and language)</summary>
          <ul class="checks" style="margin-top:8px">{auto.map((a) => <li key={a.from}><span style="font-size:13px"><code>{a.from}</code> → <code>{a.to}</code>{a.title && <span class="counter" style="display:block">{a.title}</span>}</span></li>)}</ul>
        </details>
      )}
      {siteUrl && <p class="counter" style="margin-top:12px">A redirect can be checked after publishing by opening the old address on {siteUrl.replace(/^https?:\/\//, "")}.</p>}
    </div>
  );
}

/* ---------- Google Analytics ---------- */
function Analytics({ toast }: { toast: (t: string) => void }) {
  const [id, setId] = useState<string | null>(null);
  const [orig, setOrig] = useState<string | null>(null);
  const [fallback, setFallback] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { api<{ measurementId: string; fallback: string }>("GET", "/settings/analytics").then((r) => { setId(r.measurementId ?? ""); setOrig(r.measurementId ?? ""); setFallback(r.fallback ?? ""); }); }, []);
  const dirty = id !== null && orig !== null && id.trim().toUpperCase() !== orig;
  useEffect(() => { setUnsaved("settings:analytics", dirty); return () => setUnsaved("settings:analytics", false); }, [dirty]);
  if (id === null || orig === null) return <div class="card"><p class="empty">Loading…</p></div>;
  const save = async () => {
    setErr("");
    const r = await api<{ measurementId: string }>("PUT", "/settings/analytics", { measurementId: id });
    if (!r.ok) { setErr(errorText(r)); return; }
    setId(r.measurementId!); setOrig(r.measurementId!);
    toast(r.measurementId ? "Saved. Press Publish site to put the tag on the website." : "Saved. Press Publish site to remove the tag from the website.");
  };
  const effective = orig || fallback;
  return (
    <div class="card">
      <h2>Google Analytics <span class="badge">GA4</span></h2>
      <p class="help">The measurement id of this website's GA4 web stream (GA Admin &gt; Data streams &gt; your stream), like <code>G-XXXXXXXXXX</code>. With an id the Google tag is on every page; leave it empty and nothing is sent to Google.</p>
      {err && <div class="error-box" role="alert" style="margin-bottom:12px">{err}</div>}
      <div class="row">
        <input class="input" value={id} placeholder="G-XXXXXXXXXX" aria-label="Google Analytics measurement id" aria-invalid={!!err || undefined} style={`max-width:260px;font-family:ui-monospace,monospace${err ? ";border-color:var(--error)" : ""}`} spellcheck={false} onInput={(e) => setId((e.currentTarget as HTMLInputElement).value)} onKeyDown={(e) => e.key === "Enter" && dirty && save()} />
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn btn-primary" disabled={!dirty} onClick={save}>Save</button>
        <span class="counter">{dirty ? "Unsaved changes." : "Saved."} The id reaches the website on the next <b>Publish site</b>.</span>
      </div>
      <p class="counter" style="margin-top:12px">{effective ? <span>The website is built with <code>{effective}</code>{!orig && fallback ? " (from the server's settings, used while this field is empty)" : ""}.</span> : "No Google tag on the website."}</p>
    </div>
  );
}
