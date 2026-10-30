/*
 * Node HTTP <-> web-standard Request/Response for the Azure App Service handler (tools/azure/handler.ts), plus response
 * compression: App Service hands the request straight to this process and does not compress, so text responses are sent
 * Brotli (or gzip) encoded here. A CDN in front (Azure Front Door) can still compress or cache on top.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable, type Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { constants, createBrotliCompress, createGzip } from "node:zlib";

const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript|manifest\+json)|image\/svg\+xml)/;

/**
 * The URL's origin is the Host header as App Service received it (scheme from X-Forwarded-Proto: App Service ends TLS
 * in front of the process). The form handler compares it with the browser's Origin and builds its no-JS redirect from it,
 * so a CDN in front must forward the visitor's host name unchanged (deploy/azure/README.md).
 */
export function toRequest(req: IncomingMessage): Request {
  const proto = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0].trim();
  const url = new URL(req.url ?? "/", `${proto === "https" ? "https" : "http"}://${req.headers.host ?? "localhost"}`);
  const headers = new Headers();
  for (let i = 0; i < req.rawHeaders.length; i += 2) headers.append(req.rawHeaders[i], req.rawHeaders[i + 1]);
  // The form handler passes the visitor's IP to Turnstile from CF-Connecting-IP (its Cloudflare name). Here it is the first
  // X-Forwarded-For entry, which App Service writes as "ip:port"; a client-sent CF-Connecting-IP is never trusted.
  headers.delete("CF-Connecting-IP");
  const ip = clientIp(req.headers["x-forwarded-for"]) ?? req.socket.remoteAddress;
  if (ip) headers.set("CF-Connecting-IP", ip);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
    // Required by Node's fetch for a streamed request body.
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit);
}

/** "203.0.113.7:51234, 10.0.0.1" -> "203.0.113.7"; "[2001:db8::1]:443" -> "2001:db8::1". */
export function clientIp(value: string | string[] | undefined): string | undefined {
  const first = (Array.isArray(value) ? value[0] : value)?.split(",")[0].trim();
  if (!first) return undefined;
  const v6 = /^\[([^\]]+)\](?::\d+)?$/.exec(first);
  if (v6) return v6[1];
  return /^[\d.]+:\d+$/.test(first) ? first.slice(0, first.lastIndexOf(":")) : first;
}

export async function sendResponse(req: IncomingMessage, res: ServerResponse, response: Response): Promise<void> {
  const headers: Record<string, string | string[]> = {};
  response.headers.forEach((value, name) => {
    if (name !== "set-cookie") headers[name] = value;
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers["set-cookie"] = cookies;

  const encoder = response.body ? compressor(req, response) : undefined;
  if (encoder) {
    headers["content-encoding"] = encoder.name;
    delete headers["content-length"];
    headers["vary"] = headers["vary"] ? `${headers["vary"]}, Accept-Encoding` : "Accept-Encoding";
  }
  res.writeHead(response.status, headers);
  if (!response.body) {
    res.end();
    return;
  }
  const body = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream);
  await (encoder ? pipeline(body, encoder.stream, res) : pipeline(body, res));
}

function compressor(req: IncomingMessage, response: Response): { name: string; stream: Transform } | undefined {
  if (response.headers.has("Content-Encoding") || !COMPRESSIBLE.test(response.headers.get("Content-Type") ?? "")) return;
  const accepted = String(req.headers["accept-encoding"] ?? "");
  // Quality 5: a fraction of q11's time per response, for most of its gain on HTML.
  if (/\bbr\b/.test(accepted))
    return { name: "br", stream: createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }) };
  if (/\bgzip\b/.test(accepted)) return { name: "gzip", stream: createGzip() };
}
