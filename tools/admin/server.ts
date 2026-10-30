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
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { postSchema } from "../../src/lib/news-schema";
import { authorSchema } from "../../src/lib/authors-schema";

type Kind = "posts" | "authors";
const KINDS: Record<Kind, { dir: string; schema: typeof postSchema | typeof authorSchema }> = {
  posts: { dir: "src/content/news", schema: postSchema },
  authors: { dir: "src/content/authors", schema: authorSchema },
};
const SLUG = /^[\p{L}\p{N}-]{1,120}$/u;
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
  return raw as Record<string, unknown>;
}
/** Post summaries for the list page (no bodies). */
function postSummary(p: Record<string, any>) {
  const en = p.en ?? {};
  return {
    slug: p.slug, date: p.date, updated: p.updated, category: p.category, type: p.type, status: p.status, editions: p.editions,
    image: p.image, author: p.author ?? "", reviewer: p.reviewer ?? "", title: en.title, hasArabic: !!p.ar,
    seo: !!(en.seo?.title && en.seo?.description), imageAlt: !!en.image_alt, keyword: !!en.focus_keyword,
  };
}
function authorsInUse(slug: string) {
  return listKind("posts").filter((p: any) => p.author === slug || p.reviewer === slug).map((p: any) => p.slug);
}

// ---------- publish (site build) ----------
type Publish = { state: "idle" | "running" | "ok" | "failed"; startedAt?: string; finishedAt?: string; output: string[] };
const publish: Publish = { state: "idle", output: [] };
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
  child.on("close", (code) => Object.assign(publish, { state: code === 0 ? "ok" : "failed", finishedAt: new Date().toISOString() }));
  child.on("error", (e) => { keep(Buffer.from(e.message)); Object.assign(publish, { state: "failed", finishedAt: new Date().toISOString() }); });
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
  if (route === "/me" && method === "GET") return json(200, { ok: true, email: user });
  // Every write needs the custom header: a cross-site form or image tag cannot add it (CSRF, on top of SameSite=Strict).
  if (method !== "GET" && req.headers["x-requested-with"] !== "admin") return json(403, { ok: false, error: "missing_header" });

  // --- publish ---
  if (route === "/publish") {
    if (method === "POST") startPublish();
    return json(method === "POST" ? 202 : 200, { ok: true, publish });
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
      writeJson(fileOf(kind, s), validate(kind, s, body));
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
    return json(200, { ok: true, slug: next });
  }
  if (action) return json(405, { ok: false, error: "method" });

  if (method === "GET") {
    const data = readJson(file);
    return data ? json(200, { ok: true, item: data }) : json(404, { ok: false, error: "not_found" });
  }
  if (method === "PUT") {
    const data = validate(kind, slug, await readBody(req));
    const existed = snapshot(kind, slug);
    writeJson(file, data);
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
  return server.listen(port, host);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(env.PORT ?? 8788);
  const server = start(port, env.HOST || undefined).on("listening", () => console.log(`admin server: content ${root()}, listening on ${env.HOST ?? "*"}:${port}`));
  for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
}
