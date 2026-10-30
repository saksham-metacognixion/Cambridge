// Settings: which AI crawlers may read the site (spec section 6). Writes src/data/robots.json; the build turns it into one
// robots.txt group per crawler (src/pages/robots.txt.ts). Everything not listed falls under "User-agent: *" = allowed.
import { useEffect, useState } from "preact/hooks";
import { api, errorText } from "./api";

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
  "Bytespider": "ByteDance / TikTok",
};

export function Settings({ toast, siteUrl }: { toast: (t: string) => void; siteUrl: string }) {
  const [crawlers, setCrawlers] = useState<Crawlers | null>(null);
  const [orig, setOrig] = useState<Crawlers | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { api<{ aiCrawlers: Crawlers }>("GET", "/settings/robots").then((r) => { setCrawlers(r.aiCrawlers ?? {}); setOrig(r.aiCrawlers ?? {}); }); }, []);
  if (!crawlers || !orig) return <p class="empty">Loading…</p>;
  const dirty = JSON.stringify(crawlers) !== JSON.stringify(orig);
  const save = async () => {
    setErr("");
    const r = await api<{ aiCrawlers: Crawlers }>("PUT", "/settings/robots", { aiCrawlers: crawlers });
    if (!r.ok) { setErr(errorText(r)); return; }
    setOrig(r.aiCrawlers!); setCrawlers(r.aiCrawlers!); toast("Saved. Press Publish site to update robots.txt.");
  };
  const add = () => { const n = name.trim(); if (!n) return; if (!/^[A-Za-z0-9_.-]{1,60}$/.test(n)) { setErr("A crawler name is letters, digits, - _ . only."); return; } setCrawlers({ ...crawlers, [n]: true }); setName(""); };
  const preview = `User-agent: *\nAllow: /\n\n${Object.entries(crawlers).map(([a, ok]) => `User-agent: ${a}\n${ok ? "Allow" : "Disallow"}: /\n`).join("\n")}\nSitemap: ${siteUrl}/sitemap-index.xml`;
  return (
    <div>
      <div class="page-head"><div><h1>Settings</h1><p class="sub">AI crawlers and robots.txt.</p></div></div>
      {err && <div class="error-box" role="alert">{err}</div>}
      <div class="editor" style="margin-top:14px">
        <div class="card">
          <h2>AI crawlers <span class="badge">GEO</span></h2>
          <p class="help">Who may read the site for AI search and AI answers. Google, Bing and every crawler not listed here are always allowed. "Block" writes a Disallow group for that crawler in robots.txt; it does not stop a crawler that ignores robots.txt.</p>
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
        </div>
        <div class="side">
          <div class="card">
            <h2>robots.txt preview</h2>
            <p class="help">What the website will serve after Publish (staging serves "Disallow: /" until the site is set to indexable).</p>
            <pre style="background:#0b2a36;color:#d6f0f7;font-size:12px;padding:10px;border-radius:8px;white-space:pre-wrap">{preview}</pre>
            <p class="help">Cloudflare can block AI crawlers before they reach the site ("Block AI bots", "Managed robots.txt"). Those switches are in the Cloudflare dashboard, not here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
