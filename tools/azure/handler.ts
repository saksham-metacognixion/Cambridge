/*
 * Azure App Service: the whole site as one web-standard handler, Request -> Response. App Service runs a Node program
 * (tools/azure/server.ts) and has no equivalent of Cloudflare Pages' functions/, _redirects and _headers, so this does
 * what those hosts do, from the same sources:
 *   POST /api/forms/<form>  -> the shared form handler (functions/api/forms/[form].ts), unchanged
 *   dist/_redirects         -> 301s (the old live-site URLs, src/pages/[redirects].ts), first match wins, splats last
 *   page URL without slash  -> 301 to /<path>/ (Astro trailingSlash 'always', the rule tools/vercel-json.mjs gives Vercel)
 *   dist/<path>             -> the file; /<path>/ -> dist/<path>/index.html; dist/_headers rules applied
 *   unknown URL             -> the nearest <prefix>/404.html up the path (one per edition), status 404
 *   every response          -> the country middleware (functions/_middleware.ts), unchanged
 * Nothing is stored and nothing is logged per request, same as the other hosts.
 */
import { createReadStream, readFileSync, statSync, type Stats } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { Readable } from "node:stream";
import { onRequestPost, onRequest as formNotAllowed } from "../../functions/api/forms/[form]";
import { onRequest as middleware } from "../../functions/_middleware";
import type { Env } from "../../functions/_lib/types";

type Redirect = { from: string; to: string; status: number; line: number };
type HeaderRule = { pattern: string; headers: [string, string][] };

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
};

/** Files in dist/ that configure a host and are not part of the site. */
const HOST_FILES = new Set(["_redirects", "_headers", "_redirects.nginx-map"]);

/**
 * dist/_redirects: "from to [status]" per line, first match wins (Cloudflare / Vercel order). A source ending in "/*" matches
 * any rest (Vercel ":splat(.*)"). Exact sources go in a map (1,700 of them), each rule keeps its line for the order.
 */
export function parseRedirects(text: string): { exact: Map<string, Redirect>; splats: Redirect[] } {
  const exact = new Map<string, Redirect>();
  const splats: Redirect[] = [];
  for (const [line, content] of text.split("\n").entries()) {
    const [from, to, code] = content.trim().split(/\s+/);
    if (!from || !to || from.startsWith("#")) continue;
    const rule = { from, to, status: Number(code) || 301, line };
    if (from.endsWith("/*")) splats.push({ ...rule, from: from.slice(0, -1) });
    else if (!exact.has(from)) exact.set(from, rule);
  }
  return { exact, splats };
}

/** dist/_headers (Cloudflare format): a path line, then indented "Name: value" lines. A trailing "*" matches any rest. */
export function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), headers: [] });
    else {
      const i = line.indexOf(":");
      if (i > 0 && rules.length) rules.at(-1)!.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    }
  }
  return rules;
}

const readOptional = (path: string) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
};

const statFile = (path: string): Stats | undefined => {
  try {
    const s = statSync(path);
    return s.isFile() ? s : undefined;
  } catch {
    return undefined;
  }
};

/**
 * root = the Astro build (dist/). The redirect and header files are read once: they only change with a new build,
 * and a new build means a new deployment, which restarts the process.
 */
export function createHandler(root: string, env: Env): (request: Request) => Promise<Response> {
  const base = normalize(root);
  const redirects = parseRedirects(readOptional(join(base, "_redirects")));
  const headerRules = parseHeaders(readOptional(join(base, "_headers")));

  const redirectFor = (pathname: string): Redirect | undefined => {
    const exact = redirects.exact.get(pathname);
    const splat = redirects.splats.find((r) => pathname.startsWith(r.from) && (!exact || r.line < exact.line));
    return splat ?? exact;
  };

  /** Absolute path of a decoded site path under root, or undefined when it escapes root or names a host file. */
  const under = (decoded: string): string | undefined => {
    if (decoded.includes("\0")) return undefined;
    const path = normalize(join(base, decoded));
    if (path !== base && !path.startsWith(base + sep)) return undefined;
    return HOST_FILES.has(path.slice(base.length + 1).split(sep)[0]) ? undefined : path;
  };

  const decode = (pathname: string): string | undefined => {
    try {
      return decodeURIComponent(pathname);
    } catch {
      return undefined;
    }
  };

  /** The file a URL path is served from: /<path>/ -> <path>/index.html. */
  const fileFor = (pathname: string): string | undefined => {
    const decoded = decode(pathname);
    const path = decoded === undefined ? undefined : under(decoded);
    return path && decoded!.endsWith("/") ? join(path, "index.html") : path;
  };

  const fileResponse = (request: Request, path: string, stats: Stats, status: number, pathname: string): Response => {
    const headers = new Headers({
      "Content-Type": TYPES[extname(path).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": String(stats.size),
      "Last-Modified": stats.mtime.toUTCString(),
      // Weak: the adapter may compress the body (tools/azure/node-adapter.ts), which changes the bytes, not the content.
      ETag: `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`,
      // Revalidate by default (Vercel's default for static files); dist/_headers overrides it for hashed URLs.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    });
    for (const rule of headerRules) {
      const match = rule.pattern.endsWith("*") ? pathname.startsWith(rule.pattern.slice(0, -1)) : pathname === rule.pattern;
      if (match) for (const [name, value] of rule.headers) headers.set(name, value);
    }
    if (status === 200 && request.headers.get("If-None-Match") === headers.get("ETag")) {
      headers.delete("Content-Length");
      return new Response(null, { status: 304, headers });
    }
    const body = request.method === "HEAD" ? null : (Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>);
    return new Response(body, { status, headers });
  };

  const notFound = (request: Request, pathname: string): Response => {
    const segments = (decode(pathname) ?? "").split("/").filter(Boolean);
    for (let i = segments.length; i >= 0; i--) {
      const path = under(join("/", ...segments.slice(0, i), "404.html"));
      const stats = path && statFile(path);
      if (path && stats) return fileResponse(request, path, stats, 404, pathname);
    }
    return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  };

  const site = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const { pathname } = url;

    // Forms: one path segment after /api/forms/, the same route as functions/api/forms/[form].ts.
    const form = /^\/api\/forms\/([^/]+)$/.exec(pathname)?.[1];
    if (form !== undefined) {
      if (request.method !== "POST") return formNotAllowed();
      return onRequestPost({ request, env, params: { form: decode(form) ?? form }, next: () => Promise.resolve(new Response(null, { status: 404 })) });
    }

    const redirect = redirectFor(pathname);
    if (redirect) {
      // The request's query string is kept unless the target sets its own.
      const to = redirect.to.includes("?") || !url.search ? redirect.to : redirect.to + url.search;
      return new Response(null, { status: redirect.status, headers: { Location: to } });
    }

    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });

    // Page URLs end in a slash: /contact-us -> /contact-us/ in one hop. Files (a dot in the last segment), /api and /_astro are left alone.
    const last = pathname.split("/").pop() ?? "";
    if (!pathname.endsWith("/") && !last.includes(".") && !/^\/(api|_astro)\//.test(pathname))
      return new Response(null, { status: 301, headers: { Location: pathname + "/" + url.search } });

    const path = fileFor(pathname);
    const stats = path && statFile(path);
    return path && stats ? fileResponse(request, path, stats, 200, pathname) : notFound(request, pathname);
  };

  return (request) => middleware({ request, env, params: {}, next: () => site(request) });
}
