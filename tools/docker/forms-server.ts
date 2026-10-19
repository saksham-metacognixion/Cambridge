/*
 * Self-hosted (Docker) entry for POST /api/forms/<form>, bundled by tools/docker/bundle.mjs into dist-server/forms-server.mjs
 * (19 Oct 2026, "option 3": the site runs in Docker on any host). The pages stay static files served by nginx
 * (deploy/docker/nginx.conf); nginx proxies only /api/forms/* to this small Node server, so no page request ever reaches Node.
 * Same handler as Cloudflare and Vercel (functions/api/forms/[form].ts, cf. tools/vercel/api-forms.ts): validation, Turnstile
 * and email stay in ONE place. Env vars are the ones in .env.example. Nothing is stored, same as on Cloudflare.
 * Only nginx can reach this server (compose.yaml publishes no port for it), so its X-Forwarded-* / X-Real-IP headers are trusted.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable, Transform } from "node:stream";
import { pathToFileURL } from "node:url";
import formsConfig from "../../src/data/forms.json";
import { onRequestPost } from "../../functions/api/forms/[form]";
import type { Env } from "../../functions/_lib/types";

const ROUTE = /^\/api\/forms\/([^/]+)\/?$/;
// The handler rejects a larger Content-Length itself (413); this cap also covers a chunked body that announces none.
const MAX_BODY = formsConfig.attachments.maxBytes + 64 * 1024;

export async function handle(req: IncomingMessage, env: Env): Promise<Response> {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  if (path === "/healthz") return new Response("ok");
  const m = ROUTE.exec(path);
  if (!m) return new Response("Not Found", { status: 404 });
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers))
    if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  // Public URL of the request as the visitor sent it (the handler's same-origin check and its 303 back to the page use it).
  const first = (h: string) => headers.get(h)?.split(",")[0].trim() || undefined;
  const proto = first("x-forwarded-proto") ?? "http";
  const host = first("x-forwarded-host") ?? headers.get("host") ?? "localhost";
  // Turnstile's remoteip: Cloudflare in front sends CF-Connecting-IP; otherwise nginx's X-Real-IP.
  const ip = first("x-real-ip") ?? first("x-forwarded-for");
  if (ip && !headers.has("CF-Connecting-IP")) headers.set("CF-Connecting-IP", ip);

  let seen = 0;
  const capped = req.pipe(
    new Transform({
      transform(chunk: Buffer, _enc, done) {
        seen += chunk.length;
        done(seen > MAX_BODY ? new Error("body too large") : null, chunk);
      },
    }),
  );
  const request = new Request(`${proto}://${host}${req.url}`, {
    method: "POST",
    headers,
    body: Readable.toWeb(capped) as ReadableStream,
    duplex: "half",
  } as RequestInit);
  return onRequestPost({
    request,
    env,
    params: { form: decodeURIComponent(m[1]) },
    next: () => Promise.resolve(new Response(null, { status: 404 })),
  });
}

async function listener(req: IncomingMessage, res: ServerResponse) {
  try {
    const r = await handle(req, process.env as unknown as Env);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    console.error(`forms server: ${e instanceof Error ? e.message : "unknown error"}`);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end('{"ok":false,"error":"server"}');
  }
}

export function start(port: number) {
  const server = createServer(listener);
  server.requestTimeout = 60_000; // a 4 MB upload + Turnstile + SMTP (20 s timeout) fit well inside
  return server.listen(port);
}

// `node forms-server.mjs` starts it; the test imports it without starting.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 8787);
  const server = start(port).on("listening", () => console.log(`forms server listening on :${port}`));
  // PID 1 in the container: stop cleanly on `docker stop`.
  for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
}
