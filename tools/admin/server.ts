/*
 * Admin service of the SEO & GEO dashboard (30 Oct 2026): a small Node server, bundled by tools/admin/bundle.mjs into
 * dist-admin/admin-server.mjs, run next to the site (on the Azure VM as its own systemd unit; Caddy sends /admin* and
 * /api/admin* here, everything else keeps going to the site). It edits the content files of the repo checkout it runs in
 * (CONTENT_ROOT): src/content/news/<slug>.json and src/content/authors/<slug>.json, validated with the same schemas the
 * build uses, and runs the site build on "Publish". No database: the files are the content; every change first copies the
 * previous file to .admin/versions/ (restore), a deleted post goes there too.
 *
 * One superadmin (ADMIN_EMAIL + ADMIN_PASSWORD_HASH from tools/admin/hash-password.mjs). Session = signed cookie
 * (ADMIN_SESSION_SECRET, 12 h, HttpOnly, SameSite=Strict, Secure unless LOCAL_DEV). Writes also need the header
 * X-Requested-With: admin (no cross-site form can send it). Login is rate limited per IP. Request bodies are never logged.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { postSchema } from "../../src/lib/news-schema";
import { authorSchema } from "../../src/lib/authors-schema";
import { bare, manualRedirectSchema, normalizeRedirect, type ManualRedirect } from "../../src/lib/redirects-schema";
import { SITE_URL } from "../../site.config.mjs";
import mediaHub from "../../src/data/content/media-hub/page.en.json";

type Kind = "posts" | "authors";
const KINDS: Record<Kind, { dir: string; schema: typeof postSchema | typeof authorSchema }> = {
  posts: { dir: "src/content/news", schema: postSchema },
  authors: { dir: "src/content/authors", schema: authorSchema },
};
// Letters, digits, hyphens; up to 200 characters (the longest imported slug is ~150; file names allow 255).
const SLUG = /^[\p{L}\p{N}-]{1,200}$/u;
// The UI (tools/admin/ui, bundled next to this file: index.html, app.js, app.css, logo.svg, favicon.svg) is served from
// UI_DIR; only the fonts come from the repo checkout (public/fonts). The logo and favicon used to be read from the checkout
// too and 404ed wherever CONTENT_ROOT holds only content (bug 258); they are copies of src/assets/header/logo.svg and
// public/favicon.svg, kept in tools/admin/ui/.
const UI_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "ui");
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const MAX_BODY = 2 * 1024 * 1024; // a post with both languages is ~10 KB; 2 MB leaves room for long articles
const SESSION_HOURS = 12;

// ---------- config ----------
const env = process.env;
const root = () => path.resolve(env.CONTENT_ROOT || process.cwd());
const localDev = () => env.LOCAL_DEV === "true";
function requireConfig() {
  const missing = ["ADMIN_EMAIL", "ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"].filter((k) => !env[k]);
  if (missing.length) throw new Error(`admin server: set ${missing.join(", ")} (see .env.example)`);
}

// ---------- passwords + sessions ----------
/** "scrypt$<salt>$<hash>", as tools/admin/hash-password.mjs prints it. */
export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}
function checkPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (payload: string) => createHmac("sha256", env.ADMIN_SESSION_SECRET!).update(payload).digest("base64url");
function sessionCookie(email: string) {
  const payload = b64(JSON.stringify({ u: email, e: Date.now() + SESSION_HOURS * 3600e3 }));
  return `${payload}.${sign(payload)}`;
}
function sessionFrom(req: IncomingMessage): string | null {
  const m = /(?:^|;\s*)ch_admin=([^;]+)/.exec(req.headers.cookie ?? "");
  if (!m) return null;
  const [payload, sig] = m[1].split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { u, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof u === "string" && typeof e === "number" && e > Date.now() && u === env.ADMIN_EMAIL!.toLowerCase() ? u : null;
  } catch {
    return null;
  }
}
const cookieHeader = (value: string, maxAge: number) =>
  `ch_admin=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${localDev() ? "" : "; Secure"}`;

// Login attempts per IP: 5 per 15 minutes, then 429.
const attempts = new Map<string, number[]>();
function tooManyLogins(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 15 * 60e3);
  attempts.set(ip, recent);
  return recent.length >= 5;
}

// ---------- files ----------
const fileOf = (kind: Kind, slug: string) => path.join(root(), KINDS[kind].dir, `${slug}.json`);
const versionsDir = (kind: Kind, slug: string) => path.join(root(), ".admin", "versions", kind, slug);
function readJson(file: string): unknown | undefined {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw e;
  }
}
function listKind(kind: Kind): Record<string, unknown>[] {
  const dir = path.join(root(), KINDS[kind].dir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)) as Record<string, unknown>);
}
/** Copies the current file (if any) to .admin/versions/<kind>/<slug>/<time>.json before it changes; returns the version id. */
function snapshot(kind: Kind, slug: string, label = "") {
  const file = fileOf(kind, slug);
  if (!fs.existsSync(file)) return null;
  const dir = versionsDir(kind, slug);
  fs.mkdirSync(dir, { recursive: true });
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}${label ? `-${label}` : ""}`;
  fs.copyFileSync(file, path.join(dir, `${id}.json`));
  return id;
}
function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file); // atomic: a crash mid-write never leaves a half file
}
/**
 * Validates a record with the kind's schema; a failure lists the fields (the dashboard shows them next to the inputs).
 * Returns the record AS SENT (not the parsed copy): the files stay minimal, without every defaulted empty field, exactly as
 * the migration wrote them and as the build reads them (the schema fills the defaults at build time).
 */
function validate(kind: Kind, slug: string, raw: unknown): Record<string, unknown> {
  const parsed = KINDS[kind].schema.safeParse(raw);
  if (!parsed.success)
    throw new HttpError(400, "invalid", parsed.error.issues.map((i) => ({ field: i.path.join(".") || "(root)", message: i.message })));
  if (parsed.data.slug !== slug) throw new HttpError(400, "invalid", [{ field: "slug", message: `must be "${slug}"` }]);
  // A post's reviewer is a second person: the author cannot review their own article (bug 259; the GEO check counts it as no review).
  const post = parsed.data as { author?: string; reviewer?: string };
  if (kind === "posts" && post.author && post.author === post.reviewer)
    throw new HttpError(400, "invalid", [{ field: "reviewer", message: "The reviewer must be a different person from the author." }]);
  return raw as Record<string, unknown>;
}
/** Post summaries for the list page (no bodies). */
function postSummary(p: Record<string, any>) {
  const en = p.en ?? {};
  return {
    slug: p.slug, date: p.date, updated: p.updated, category: p.category, type: p.type, status: p.status, editions: p.editions,
    image: p.image, author: p.author ?? "", reviewer: p.reviewer ?? "", title: en.title, hasArabic: !!p.ar,
    seo: !!(en.seo?.title && en.seo?.description), imageAlt: !!en.image_alt, keyword: !!en.focus_keyword,
    keywords: [en.focus_keyword, p.ar?.focus_keyword].filter(Boolean),
  };
}
/** Spec section 2: an image without alt text blocks publishing (drafts can be saved without it). */
function checkPublishable(kind: Kind, raw: Record<string, any>) {
  if (kind !== "posts") return;
  const live = raw.status === "published" || raw.status === "scheduled";
  if (live && raw.image && !String(raw.en?.image_alt ?? "").trim())
    throw new HttpError(400, "invalid", [{ field: "en.image_alt", message: "Describe the featured image (alt text) before publishing" }]);
}
/** A file of the UI bundle or one of the site files it uses; null when the path is not one of them. */
function staticFile(p: string): Response | null {
  let file = "", type = "";
  if (p === "/admin" || (p.startsWith("/admin/") && !path.extname(p))) { file = path.join(UI_DIR, "index.html"); type = TYPES[".html"]; }
  else if (/^\/(admin|fonts)\/[\w.-]+$/.test(p)) { file = p.startsWith("/fonts/") ? path.join(root(), "public", p) : path.join(UI_DIR, path.basename(p)); type = TYPES[path.extname(p)] ?? ""; }
  if (!file || !type || !fs.existsSync(file)) return null;
  return new Response(fs.readFileSync(file), { status: 200, headers: { "Content-Type": type, "Cache-Control": type.startsWith("font") ? "public, max-age=31536000" : "no-cache", "X-Robots-Tag": "noindex", ...UI_SECURITY_HEADERS } });
}
/** Security headers for the dashboard pages (client security review, 30 Oct 2026; the site's own are in tools/security-headers.mjs).
 *  The UI has no inline script; style="" attributes need 'unsafe-inline' for styles; img.youtube.com = video thumbnails in the editor. */
const UI_SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://img.youtube.com; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};
function authorsInUse(slug: string) {
  return listKind("posts").filter((p: any) => p.author === slug || p.reviewer === slug).map((p: any) => p.slug);
}

// ---------- images (spec section 5: upload compresses to WebP under 200 KB) ----------
const IMAGE_DIRS: Record<Kind, { dir: string; maxWidth: number }> = {
  posts: { dir: "news", maxWidth: 1600 }, // the article hero shows at most ~1440 px wide
  authors: { dir: "authors", maxWidth: 800 },
};
const MAX_UPLOAD = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 200 * 1024;
const IMAGE_TYPES: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".svg": "image/svg+xml" };
// sharp is a native module (Astro's own image library): not bundled, loaded from the checkout's node_modules at run time.
let sharpMod: any;
function sharp() {
  if (!sharpMod) {
    const req = createRequire(path.join(root(), "package.json"));
    try { sharpMod = req("sharp"); } catch { sharpMod = createRequire(path.join(process.cwd(), "package.json"))("sharp"); }
  }
  return sharpMod;
}
function readRaw(req: IncomingMessage, max: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => { size += c.length; if (size > max) { reject(new HttpError(413, "too_large")); req.destroy(); return; } chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
/**
 * Converts an upload to WebP under 200 KB (resized to the kind's width, EXIF rotation applied, quality stepped down until it
 * fits) and saves it as src/assets/<dir>/<name>.webp. Any other file with the same name (an imported .jpg / .avif) moves to
 * .admin/versions/images/ first, because the site resolves an image by its key without extension (src/lib/images.ts).
 */
async function saveImage(kind: Kind, name: string, data: Buffer) {
  const { dir, maxWidth } = IMAGE_DIRS[kind];
  const folder = path.join(root(), "src", "assets", dir);
  let out: Buffer | null = null, info: { width: number; height: number } | null = null;
  const src = sharp()(data, { failOn: "error" }).rotate();
  // Quality first (a photo at 1600 px fits at ~70), then the width, so even a very noisy image lands under the limit.
  outer: for (const width of [maxWidth, 1280, 1024, 800, 640, 480].filter((w, i, a) => w <= maxWidth && a.indexOf(w) === i)) {
    const base = src.clone().resize({ width, withoutEnlargement: true });
    for (let quality = 82; quality >= 42; quality -= 8) {
      const r = await base.clone().webp({ quality }).toBuffer({ resolveWithObject: true });
      out = r.data; info = r.info;
      if (out.length <= MAX_IMAGE_BYTES) break outer;
    }
  }
  if (!out || !info) throw new HttpError(400, "bad_image");
  fs.mkdirSync(folder, { recursive: true });
  const old = fs.existsSync(folder) ? fs.readdirSync(folder).filter((f) => f.replace(/\.[a-z0-9]+$/i, "") === name) : [];
  const keep = path.join(root(), ".admin", "versions", "images", dir);
  for (const f of old) { fs.mkdirSync(keep, { recursive: true }); fs.renameSync(path.join(folder, f), path.join(keep, `${new Date().toISOString().replace(/[:.]/g, "-")}-${f}`)); }
  const file = path.join(folder, `${name}.webp`);
  fs.writeFileSync(`${file}.tmp`, out);
  fs.renameSync(`${file}.tmp`, file);
  return { key: `${dir}/${name}`, bytes: out.length, width: info.width, height: info.height, replaced: old };
}
/** The file behind an image key (src/assets/<key>.<ext>), for the dashboard's previews. */
function imageFile(key: string): Response | null {
  if (!/^[a-z0-9-]+\/[\p{L}\p{N}-]+$/u.test(key)) return null;
  const folder = path.join(root(), "src", "assets", path.dirname(key));
  if (!fs.existsSync(folder)) return null;
  const f = fs.readdirSync(folder).find((x) => x.replace(/\.[a-z0-9]+$/i, "") === path.basename(key) && IMAGE_TYPES[path.extname(x).toLowerCase()]);
  if (!f) return null;
  return new Response(fs.readFileSync(path.join(folder, f)), { status: 200, headers: { "Content-Type": IMAGE_TYPES[path.extname(f).toLowerCase()], "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" } });
}

// ---------- publish (site build) ----------
type Publish = { state: "idle" | "running" | "ok" | "failed"; startedAt?: string; finishedAt?: string; output: string[] };
const publish: Publish = { state: "idle", output: [] };
// What the dashboard tells people a build takes (PUBLISH_MINUTES; the VM's build + upload is about 25 minutes, bug 255).
const publishMinutes = () => Math.max(1, Math.round(Number(env.PUBLISH_MINUTES)) || 25);
function startPublish() {
  if (publish.state === "running") throw new HttpError(409, "publish_running");
  const command = env.PUBLISH_COMMAND || "npm run build";
  Object.assign(publish, { state: "running", startedAt: new Date().toISOString(), finishedAt: undefined, output: [] });
  const child = spawn("sh", ["-c", command], { cwd: root(), env: { ...env, FORCE_COLOR: "0" } });
  const keep = (chunk: Buffer) => {
    publish.output.push(...chunk.toString().split("\n").filter(Boolean));
    if (publish.output.length > 200) publish.output.splice(0, publish.output.length - 200); // the tail is what matters
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  // The result goes to the service log as well (journalctl on the VM): the panel's copy lives in memory only, until the next
  // publish or restart, and a failure must be findable without the dashboard open.
  const done = (state: "ok" | "failed", why?: string) => {
    Object.assign(publish, { state, finishedAt: new Date().toISOString() });
    console.log(`admin server: publish ${state}${why ? ` (${why})` : ""}, started ${publish.startedAt}`);
    if (state === "failed") for (const line of publish.output.slice(-15)) console.log(`admin server: publish | ${line}`);
  };
  child.on("close", (code, signal) => done(code === 0 ? "ok" : "failed", code === 0 ? undefined : `exit ${code ?? signal}`));
  child.on("error", (e) => { keep(Buffer.from(e.message)); done("failed", e.message); });
}

// ---------- scheduled posts: go live on time without anyone pressing Publish ----------
// Every SCHEDULE_CHECK_SECONDS (default 60; 0 = off) the service looks for posts with status "scheduled" whose time has
// passed, marks them "published" (a version copy is kept) and starts one build. The build itself already treats a
// scheduled post whose time has passed as live (src/lib/news.ts isLive), so the file change only keeps the dashboard
// and the file honest; the build is what puts the post on the website.
type Due = { slug: string; title: string; at: string };
type Schedule = { next: Due[]; lastCheck?: string; lastRun?: string; pending: boolean };
const schedule: Schedule = { next: [], pending: false };
const dueAt = (p: Record<string, any>) => (p.publish_at as string) || `${p.date}T00:00:00Z`;
export function checkSchedule(now = Date.now()) {
  const scheduled = listKind("posts").filter((p) => p.status === "scheduled" && typeof p.slug === "string");
  schedule.next = scheduled
    .map((p) => ({ slug: p.slug as string, title: (p.en as any)?.title ?? "", at: dueAt(p) }))
    .filter((d) => Date.parse(d.at) > now)
    .sort((a, b) => a.at.localeCompare(b.at));
  for (const p of scheduled) {
    const at = Date.parse(dueAt(p));
    if (Number.isNaN(at) || at > now) continue;
    const slug = p.slug as string;
    snapshot("posts", slug, "scheduled");
    delete p.publish_at;
    writeJson(fileOf("posts", slug), { ...p, status: "published" });
    schedule.pending = true;
    console.log(`admin server: scheduled post "${slug}" is due, publishing`);
  }
  if (schedule.pending && publish.state !== "running") {
    try { startPublish(); schedule.pending = false; schedule.lastRun = new Date(now).toISOString(); } catch (e) { console.error(`admin server: scheduled publish: ${e instanceof Error ? e.message : e}`); }
  }
  schedule.lastCheck = new Date(now).toISOString();
}

// ---------- manual redirects (Settings > Redirects: src/data/redirects.json, merged first into dist/_redirects by src/lib/redirects.ts) ----------
const redirectsFile = () => path.join(root(), "src", "data", "redirects.json");
const siteHost = () => { try { return new URL(env.ADMIN_SITE_URL || SITE_URL).hostname.toLowerCase(); } catch { return ""; } };
/** The post whose article page lives at a site path (/ae/ar/media-hub/<slug>), if any; the path comes in without its trailing slash. */
function postAtPath(p: string): Record<string, any> | undefined {
  const m = /^(?:\/(?:ae|sa))?(?:\/ar)?\/media-hub\/([^/]+)$/.exec(p);
  if (!m) return undefined;
  let slug = m[1];
  try { slug = decodeURIComponent(slug); } catch { return undefined; }
  return SLUG.test(slug) ? (readJson(fileOf("posts", slug)) as Record<string, any> | undefined) : undefined;
}
/**
 * Validates the whole list as the dashboard sends it: each rule normalised (redirects-schema.ts) and checked with the build's
 * schema, then the rules against each other. Errors name the row and field (`redirects.<i>.from`). A rule may not take over
 * the address of a published / scheduled post (the page would vanish behind it; the post's own "Web address" field renames
 * it and keeps the old address working), may not point at a page that is itself redirected (no chains: hosts follow one
 * rule and Google counts each hop), and an old address is listed once.
 */
function validateRedirects(raw: unknown): ManualRedirect[] {
  if (!Array.isArray(raw)) throw new HttpError(400, "invalid", [{ field: "redirects", message: "a list of rules" }]);
  const details: { field: string; message: string }[] = [];
  const field = (r: unknown, k: string) => (r && typeof r === "object" ? String((r as Record<string, unknown>)[k] ?? "") : "").trim();
  const rows = raw.filter((r) => field(r, "from") || field(r, "to")); // a row with nothing in it is dropped, not an error
  const rules: ManualRedirect[] = rows.map((r, i) => {
    const input = r && typeof r === "object" ? (r as Record<string, unknown>) : {};
    const n = normalizeRedirect({ from: String(input.from ?? ""), to: String(input.to ?? ""), note: typeof input.note === "string" ? input.note : "", added: typeof input.added === "string" ? input.added : undefined }, siteHost());
    const parsed = manualRedirectSchema.safeParse(n);
    if (!parsed.success) {
      // One message per field (the pattern and the refinement can both fail on the same value).
      for (const x of parsed.error.issues) { const f = `redirects.${i}.${x.path.join(".") || "from"}`; if (!details.some((d) => d.field === f)) details.push({ field: f, message: x.message }); }
      return n as ManualRedirect;
    }
    return parsed.data;
  });
  const froms = rules.map((r) => r.from);
  rules.forEach((r, i) => {
    const toPath = r.to.startsWith("/") ? bare(r.to.split(/[?#]/)[0]) : "";
    if (froms.indexOf(r.from) !== i) details.push({ field: `redirects.${i}.from`, message: "This old address is already listed above" });
    if (toPath && toPath === r.from) details.push({ field: `redirects.${i}.to`, message: "The old and new address are the same page" });
    else if (toPath && froms.includes(toPath)) details.push({ field: `redirects.${i}.to`, message: `The new address is itself redirected (rule ${froms.indexOf(toPath) + 1}): point this rule straight at the final page` });
    const post = postAtPath(r.from);
    if (post && (post.status === "published" || post.status === "scheduled"))
      details.push({ field: `redirects.${i}.from`, message: `This is the address of the ${post.status} post "${post.en?.title ?? post.slug}". To move that post, change its web address in the editor: the old address then redirects by itself` });
  });
  if (details.length) throw new HttpError(400, "invalid", details);
  return rules;
}
/** Redirects the build makes by itself for renamed posts (`previous_slugs`), listed read-only next to the manual ones. */
function automaticRedirects() {
  return listKind("posts")
    .filter((p: any) => Array.isArray(p.previous_slugs) && p.previous_slugs.length && (p.status === "published" || p.status === "scheduled"))
    .flatMap((p: any) => p.previous_slugs.map((prev: string) => ({ from: `/media-hub/${prev}/`, to: `/media-hub/${p.slug}/`, post: p.slug, title: p.en?.title ?? "" })));
}

// ---------- preview: `astro dev` on demand, behind the login (spec: see a post before it is published) ----------
// A build takes PUBLISH_MINUTES; `astro dev` renders a page from the files on disk in a second or two. The service starts
// it the first time someone opens /admin/preview/..., with ASTRO_BASE=/admin/preview (astro.config.mjs: pages and /_image
// under that base, the only path Caddy sends here) and NEWS_PREVIEW=true (src/lib/news.ts: drafts, scheduled and archived
// posts render too), proxies that path to it and stops it after PREVIEW_IDLE_MINUTES without a request. Astro reads the
// SET of content files (posts, authors, images) only when it starts, so the server is stopped whenever one is added,
// renamed or removed (previewInvalidate) and starts again at the next request; a change inside a saved file shows at once.
// Vite's own URLs (/@vite, /@fs, /src, /@id, /node_modules) are not under the base: the proxy prefixes them in HTML / CSS /
// JS bodies and strips the prefix again on the way in. Nothing is written by the preview except Astro's own caches.
const PREVIEW_BASE = "/admin/preview";
const VITE_PATHS = ["@vite", "@fs", "@id", "src", "node_modules"];
const VITE_URL = new RegExp(`(["'(=])/(${VITE_PATHS.join("|")})/`, "g");
const PREVIEW_START_WAIT = 20_000; // longest a request waits for the dev server before it shows the "starting" page
type Preview = { child?: ChildProcess; state: "off" | "starting" | "ready"; startedAt?: string; lastUsed: number; output: string[] };
const preview: Preview = { state: "off", lastUsed: 0, output: [] };
const previewPort = () => Number(env.PREVIEW_PORT) || 4330;
const previewIdleMinutes = () => Math.max(1, Number(env.PREVIEW_IDLE_MINUTES) || 20);
const previewCommand = () => env.PREVIEW_COMMAND || `npx --no-install astro dev --host 127.0.0.1 --port ${previewPort()} --ignore-lock`;
function startPreview() {
  if (preview.child) return;
  // Its own process group (detached), so stopping it also stops what npx / sh started underneath.
  const child = spawn("sh", ["-c", previewCommand()], { cwd: root(), detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...env, ASTRO_BASE: PREVIEW_BASE, NEWS_PREVIEW: "true", PREVIEW_PORT: String(previewPort()), FORCE_COLOR: "0" } });
  Object.assign(preview, { child, state: "starting", startedAt: new Date().toISOString(), lastUsed: Date.now(), output: [] });
  const keep = (chunk: Buffer) => { preview.output.push(...chunk.toString().split("\n").filter(Boolean)); if (preview.output.length > 40) preview.output.splice(0, preview.output.length - 40); };
  child.stdout!.on("data", keep);
  child.stderr!.on("data", keep);
  const gone = () => { if (preview.child === child) { preview.child = undefined; preview.state = "off"; } };
  child.on("exit", gone);
  child.on("error", (e) => { keep(Buffer.from(e.message)); gone(); });
  console.log(`admin server: preview starting on 127.0.0.1:${previewPort()}`);
}
export function stopPreview(reason: string) {
  const child = preview.child;
  if (!child) return;
  preview.child = undefined; preview.state = "off";
  try { process.kill(-child.pid!, "SIGTERM"); } catch { child.kill(); }
  console.log(`admin server: preview stopped (${reason})`);
}
/** Content files added, renamed or removed: the preview restarts at its next request (see above). */
const previewInvalidate = () => stopPreview("content files changed");
const previewUrl = (p: string) => `http://127.0.0.1:${previewPort()}${p}`;
/** Starts the dev server if needed and waits (up to `waitMs`) until it answers. */
async function previewReady(waitMs: number): Promise<boolean> {
  startPreview();
  preview.lastUsed = Date.now();
  if (preview.state === "ready") return true;
  const until = Date.now() + waitMs;
  for (;;) {
    try {
      const r = await fetch(previewUrl(`${PREVIEW_BASE}/`), { method: "HEAD", signal: AbortSignal.timeout(5000) });
      if (r.status < 500) { preview.state = "ready"; return true; }
    } catch { /* not listening yet */ }
    if (preview.state === "off" || Date.now() > until) return false;
    await new Promise((r) => setTimeout(r, 400));
  }
}
const PREVIEW_HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff" };
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** The page shown while the dev server starts (reloads itself) or when it could not start (its last output). */
function previewWaitPage(): Response {
  const failed = preview.state === "off";
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${failed ? "Preview could not start" : "Starting the preview…"}</title>${failed ? "" : '<meta http-equiv="refresh" content="4">'}<style>body{font:16px/1.5 system-ui,sans-serif;color:#004059;background:#f4f6f8;margin:0;display:grid;place-items:center;min-height:100vh}main{max-width:560px;padding:32px}pre{font-size:12px;white-space:pre-wrap;background:#0b2a36;color:#d6f0f7;padding:12px;border-radius:8px}</style></head><body><main>${failed
    ? `<h1>The preview could not start</h1><p>The preview server (<code>astro dev</code>) stopped. Its last lines:</p><pre>${escapeHtml(preview.output.join("\n") || "(no output)")}</pre><p><a href="javascript:location.reload()">Try again</a></p>`
    : `<h1>Starting the preview…</h1><p>This takes a few seconds the first time (the page reloads by itself).</p>`}</main></body></html>`;
  return new Response(body, { status: 503, headers: { "Content-Type": TYPES[".html"], "Retry-After": "4", ...PREVIEW_HEADERS } });
}
const PREVIEW_BADGE = '<div style="position:fixed;left:12px;bottom:12px;z-index:2147483647;font:500 12px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#004059;padding:8px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none">Preview · not published</div>';
/** GET/HEAD /admin/preview[/...] -> the dev server; text bodies come back with Vite's URLs under the base. */
async function previewProxy(req: IncomingMessage, url: URL): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD") return json(405, { ok: false, error: "method" });
  if (!(await previewReady(PREVIEW_START_WAIT))) return previewWaitPage();
  const rest = url.pathname.slice(PREVIEW_BASE.length); // "", "/media-hub/x/", "/src/scripts/a.ts"
  const vite = VITE_PATHS.some((v) => rest.startsWith(`/${v}/`));
  const upstream = previewUrl((vite ? rest : `${PREVIEW_BASE}${rest || "/"}`) + url.search);
  let r: globalThis.Response;
  try {
    r = await fetch(upstream, { method: req.method, redirect: "manual", signal: AbortSignal.timeout(60_000), headers: { accept: req.headers.accept ?? "*/*", "accept-encoding": "identity", "accept-language": req.headers["accept-language"] ?? "", "user-agent": req.headers["user-agent"] ?? "" } });
  } catch {
    preview.state = preview.child ? "starting" : "off";
    return previewWaitPage();
  }
  const type = r.headers.get("content-type") ?? "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, ...PREVIEW_HEADERS };
  const location = r.headers.get("location");
  if (location) headers.Location = location;
  const text = /^(text\/(html|css|javascript)|application\/javascript)/.test(type);
  if (!text || req.method === "HEAD") return new Response(req.method === "HEAD" ? null : await r.arrayBuffer(), { status: r.status, headers });
  let body = (await r.text()).replace(VITE_URL, `$1${PREVIEW_BASE}/$2/`);
  if (type.startsWith("text/html") && r.status === 200) body = body.replace(/<\/body>/i, `${PREVIEW_BADGE}</body>`);
  return new Response(body, { status: r.status, headers });
}

// ---------- HTTP ----------
class HttpError extends Error {
  constructor(public status: number, public code: string, public details?: unknown) { super(code); }
}
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new HttpError(413, "too_large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString();
      if (!text) return resolve({});
      try { resolve(JSON.parse(text)); } catch { reject(new HttpError(400, "bad_json")); }
    });
    req.on("error", reject);
  });
}

export async function handle(req: IncomingMessage): Promise<Response> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const p = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method ?? "GET";
  if (p === "/healthz") return new Response("ok");
  // The preview is a site page: without a session the browser goes to the sign-in page instead of getting JSON.
  if (p === PREVIEW_BASE || p.startsWith(`${PREVIEW_BASE}/`)) return sessionFrom(req) ? previewProxy(req, url) : new Response(null, { status: 302, headers: { Location: "/admin", "Cache-Control": "no-store" } });
  if (method === "GET" && !p.startsWith("/api/")) return staticFile(p) ?? json(404, { ok: false, error: "not_found" });
  if (!p.startsWith("/api/admin/") && p !== "/api/admin") return json(404, { ok: false, error: "not_found" });
  const route = p.slice("/api/admin".length);
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "?";

  // --- auth ---
  if (route === "/login" && method === "POST") {
    if (tooManyLogins(ip)) return json(429, { ok: false, error: "too_many_attempts" });
    const body = (await readBody(req)) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const ok = email === env.ADMIN_EMAIL!.toLowerCase() && checkPassword(password, env.ADMIN_PASSWORD_HASH!);
    if (!ok) {
      attempts.get(ip)!.push(Date.now());
      return json(401, { ok: false, error: "wrong_login" });
    }
    return json(200, { ok: true, email }, { "Set-Cookie": cookieHeader(sessionCookie(email), SESSION_HOURS * 3600) });
  }
  const user = sessionFrom(req);
  if (!user) return json(401, { ok: false, error: "not_signed_in" });
  if (route === "/logout" && method === "POST") return json(200, { ok: true }, { "Set-Cookie": cookieHeader("", 0) });
  if (route === "/me" && method === "GET")
    return json(200, { ok: true, email: user, siteUrl: env.ADMIN_SITE_URL || SITE_URL, categories: (mediaHub.explore.categories as { key: string; label: string }[]).map(({ key, label }) => ({ key, label })) });
  // Every write needs the custom header: a cross-site form or image tag cannot add it (CSRF, on top of SameSite=Strict).
  if (method !== "GET" && req.headers["x-requested-with"] !== "admin") return json(403, { ok: false, error: "missing_header" });

  // --- settings: robots.txt AI crawler access (spec section 6; src/data/robots.json, read by src/pages/robots.txt.ts) ---
  if (route === "/settings/robots") {
    const file = path.join(root(), "src", "data", "robots.json");
    if (method === "GET") return json(200, { ok: true, aiCrawlers: (readJson(file) as any)?.aiCrawlers ?? {} });
    if (method === "PUT") {
      const body = (await readBody(req)) as { aiCrawlers?: Record<string, unknown> };
      const entries = Object.entries(body?.aiCrawlers ?? {});
      const bad = entries.find(([k, v]) => !/^[A-Za-z0-9_.-]{1,60}$/.test(k) || typeof v !== "boolean");
      if (!body?.aiCrawlers || bad) return json(400, { ok: false, error: "invalid", details: [{ field: bad ? bad[0] : "aiCrawlers", message: "crawler names: letters, digits, - _ .; value true (allow) or false (block)" }] });
      const current = (readJson(file) as Record<string, unknown>) ?? {};
      const dir = path.join(root(), ".admin", "versions", "settings");
      fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dir, `robots-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
      writeJson(file, { ...current, aiCrawlers: Object.fromEntries(entries) });
      return json(200, { ok: true, aiCrawlers: Object.fromEntries(entries) });
    }
  }
  // --- settings: Google Analytics 4 measurement id (src/data/analytics.json `measurementId`, read at build time by
  // src/components/Analytics.astro; empty = the build's PUBLIC_GA_MEASUREMENT_ID fallback, both empty = no Google tag) ---
  if (route === "/settings/analytics") {
    const file = path.join(root(), "src", "data", "analytics.json");
    const current = (readJson(file) as Record<string, unknown>) ?? {};
    const fallback = (env.PUBLIC_GA_MEASUREMENT_ID ?? "").trim();
    if (method === "GET") return json(200, { ok: true, measurementId: typeof current.measurementId === "string" ? current.measurementId : "", fallback });
    if (method === "PUT") {
      const body = (await readBody(req)) as { measurementId?: unknown };
      const id = typeof body?.measurementId === "string" ? body.measurementId.trim().toUpperCase() : null;
      if (id === null || (id && !/^(G|GT|AW|DC)-[A-Z0-9]{4,20}$/.test(id)))
        return json(400, { ok: false, error: "invalid", details: [{ field: "measurementId", message: "A Google Analytics measurement id looks like G-XXXXXXXXXX (GA Admin > Data streams > your web stream). Leave it empty to send nothing to Google" }] });
      const dir = path.join(root(), ".admin", "versions", "settings");
      fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dir, `analytics-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
      writeJson(file, { ...current, measurementId: id });
      return json(200, { ok: true, measurementId: id, fallback });
    }
  }
  // --- settings: manual 301 redirects (src/data/redirects.json; the whole list is read and written at once, like robots) ---
  if (route === "/settings/redirects") {
    const current = (readJson(redirectsFile()) as { redirects?: ManualRedirect[] } | undefined) ?? {};
    if (method === "GET") return json(200, { ok: true, redirects: current.redirects ?? [], automatic: automaticRedirects(), siteUrl: env.ADMIN_SITE_URL || SITE_URL });
    if (method === "PUT") {
      const body = (await readBody(req)) as { redirects?: unknown };
      const was = new Map((current.redirects ?? []).map((r) => [`${r.from} ${r.to}`, r.added]));
      const today = new Date().toISOString().slice(0, 10);
      const rules = validateRedirects(body?.redirects).map((r) => ({ ...r, added: was.get(`${r.from} ${r.to}`) ?? r.added ?? today }));
      const dir = path.join(root(), ".admin", "versions", "settings");
      fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(redirectsFile())) fs.copyFileSync(redirectsFile(), path.join(dir, `redirects-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
      writeJson(redirectsFile(), { ...current, redirects: rules });
      return json(200, { ok: true, redirects: rules, automatic: automaticRedirects() });
    }
  }

  // --- images: GET /image/<key> (preview), POST /upload/<posts|authors>/<slug>[?suffix=2] (raw image body) ---
  if (route.startsWith("/image/") && method === "GET") return imageFile(decodeURIComponent(route.slice("/image/".length))) ?? json(404, { ok: false, error: "not_found" });
  const up = /^\/upload\/(posts|authors)\/([^/]+)$/.exec(route);
  if (up && method === "POST") {
    const kind = up[1] as Kind;
    const s = decodeURIComponent(up[2]);
    const suffix = url.searchParams.get("suffix") ?? "";
    if (!SLUG.test(s) || !/^[a-z0-9]{0,10}$/.test(suffix)) return json(400, { ok: false, error: "bad_slug" });
    if (!fs.existsSync(fileOf(kind, s))) return json(404, { ok: false, error: "not_found" });
    const data = await readRaw(req, MAX_UPLOAD);
    if (!data.length) return json(400, { ok: false, error: "bad_image" });
    try {
      const saved = await saveImage(kind, suffix ? `${s}-${suffix}` : s, data);
      previewInvalidate(); // a new image file (or a new extension for an old key)
      return json(200, { ok: true, ...saved });
    } catch (e) {
      if (e instanceof HttpError) throw e;
      return json(400, { ok: false, error: "bad_image" });
    }
  }

  // --- publish ---
  if (route === "/publish") {
    if (method === "POST") startPublish();
    return json(method === "POST" ? 202 : 200, { ok: true, publish, schedule, minutes: publishMinutes() });
  }

  // --- content: /posts, /posts/<slug>, /posts/<slug>/versions, /posts/<slug>/restore, /posts/<slug>/rename; same for /authors ---
  const m = /^\/(posts|authors)(?:\/([^/]+)(?:\/(versions|restore|rename))?)?$/.exec(route);
  if (!m) return json(404, { ok: false, error: "not_found" });
  const kind = m[1] as Kind;
  const slug = m[2] ? decodeURIComponent(m[2]) : "";
  const action = m[3];
  if (slug && !SLUG.test(slug)) return json(400, { ok: false, error: "bad_slug" });
  const file = slug ? fileOf(kind, slug) : "";

  if (!slug) {
    if (method === "GET") {
      const items = listKind(kind);
      return json(200, { ok: true, items: kind === "posts" ? items.map(postSummary).sort((a, b) => String(b.date).localeCompare(String(a.date))) : items });
    }
    if (method === "POST") {
      const body = (await readBody(req)) as { slug?: string };
      const s = typeof body.slug === "string" ? body.slug : "";
      if (!SLUG.test(s)) return json(400, { ok: false, error: "bad_slug" });
      if (fs.existsSync(fileOf(kind, s))) return json(409, { ok: false, error: "exists" });
      const data = validate(kind, s, body);
      checkPublishable(kind, data);
      writeJson(fileOf(kind, s), data);
      previewInvalidate();
      return json(201, { ok: true, slug: s });
    }
    return json(405, { ok: false, error: "method" });
  }

  if (action === "versions" && method === "GET") {
    const dir = versionsDir(kind, slug);
    const versions = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse().map((f) => ({ id: f.slice(0, -5), bytes: fs.statSync(path.join(dir, f)).size })) : [];
    return json(200, { ok: true, versions });
  }
  if (action === "restore" && method === "POST") {
    const { version } = (await readBody(req)) as { version?: string };
    const src = typeof version === "string" && /^[A-Za-z0-9-]+$/.test(version) ? path.join(versionsDir(kind, slug), `${version}.json`) : "";
    const data = src && readJson(src);
    if (!data) return json(404, { ok: false, error: "no_such_version" });
    snapshot(kind, slug, "before-restore");
    writeJson(file, validate(kind, slug, data));
    return json(200, { ok: true });
  }
  if (action === "rename" && method === "POST") {
    const { slug: next } = (await readBody(req)) as { slug?: string };
    const current = readJson(file) as Record<string, any> | undefined;
    if (!current) return json(404, { ok: false, error: "not_found" });
    if (typeof next !== "string" || !SLUG.test(next)) return json(400, { ok: false, error: "bad_slug" });
    if (fs.existsSync(fileOf(kind, next))) return json(409, { ok: false, error: "exists" });
    const renamed = { ...current, slug: next };
    // A renamed post keeps its old URL alive: previous_slugs -> 301 (src/lib/redirects.ts).
    if (kind === "posts") renamed.previous_slugs = [...new Set([...(current.previous_slugs ?? []), slug])];
    snapshot(kind, slug, "before-rename");
    writeJson(fileOf(kind, next), validate(kind, next, renamed));
    fs.unlinkSync(file);
    // The version history follows the record to its new address.
    const oldVersions = versionsDir(kind, slug), newVersions = versionsDir(kind, next);
    if (fs.existsSync(oldVersions) && !fs.existsSync(newVersions)) { fs.mkdirSync(path.dirname(newVersions), { recursive: true }); fs.renameSync(oldVersions, newVersions); }
    previewInvalidate();
    return json(200, { ok: true, slug: next });
  }
  if (action) return json(405, { ok: false, error: "method" });

  if (method === "GET") {
    const data = readJson(file);
    return data ? json(200, { ok: true, item: data }) : json(404, { ok: false, error: "not_found" });
  }
  if (method === "PUT") {
    const data = validate(kind, slug, await readBody(req));
    checkPublishable(kind, data);
    const existed = snapshot(kind, slug);
    writeJson(file, data);
    if (!existed) previewInvalidate(); // a new file; a changed one shows in the preview at once
    return json(200, { ok: true, created: !existed });
  }
  if (method === "DELETE") {
    if (!fs.existsSync(file)) return json(404, { ok: false, error: "not_found" });
    if (url.searchParams.get("confirm") !== slug) return json(400, { ok: false, error: "confirm_slug" });
    if (kind === "authors") {
      const used = authorsInUse(slug);
      if (used.length) return json(409, { ok: false, error: "in_use", posts: used });
    }
    snapshot(kind, slug, "deleted"); // the file is kept there: a deleted post can be restored by hand
    fs.unlinkSync(file);
    previewInvalidate();
    return json(200, { ok: true });
  }
  return json(405, { ok: false, error: "method" });
}

async function listener(req: IncomingMessage, res: ServerResponse) {
  try {
    const r = await handle(req);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    const he = e instanceof HttpError ? e : null;
    if (!he) console.error(`admin server: ${e instanceof Error ? e.message : "unknown error"}`);
    if (!res.headersSent) res.writeHead(he?.status ?? 500, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ok: false, error: he?.code ?? "server", ...(he?.details ? { details: he.details } : {}) }));
  }
}

export function start(port: number, host?: string) {
  requireConfig();
  const server = createServer(listener);
  server.requestTimeout = 30_000;
  const every = Number(env.SCHEDULE_CHECK_SECONDS ?? 60);
  if (every > 0) {
    const tick = () => { try { checkSchedule(); } catch (e) { console.error(`admin server: schedule check: ${e instanceof Error ? e.message : e}`); } };
    const timer = setInterval(tick, every * 1000);
    timer.unref();
    server.once("listening", tick).once("close", () => clearInterval(timer));
  }
  // The preview dev server is stopped after PREVIEW_IDLE_MINUTES without a request, and with this server.
  const idle = setInterval(() => { if (preview.child && Date.now() - preview.lastUsed > previewIdleMinutes() * 60e3) stopPreview("idle"); }, 30e3);
  idle.unref();
  server.once("close", () => { clearInterval(idle); stopPreview("shutdown"); });
  return server.listen(port, host);
}
process.on("exit", () => stopPreview("exit"));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(env.PORT ?? 8788);
  const server = start(port, env.HOST || undefined).on("listening", () => console.log(`admin server: content ${root()}, listening on ${env.HOST ?? "*"}:${port}`));
  for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
}
