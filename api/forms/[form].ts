/*
 * Vercel staging entry for POST /api/forms/<form>. Vercel does not run Cloudflare Pages Functions (functions/), so this
 * edge function wraps the same handler: validation, Turnstile and email stay in ONE place
 * (functions/api/forms/[form].ts). Env vars are the ones in .env.example, set in the Vercel project settings.
 * Nothing is stored, same as on Cloudflare.
 */
import { onRequestPost } from "../../functions/api/forms/[form]";
import type { Env } from "../../functions/_lib/types";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  const form = decodeURIComponent(
    new URL(request.url).pathname.split("/").pop() ?? "",
  );
  // Turnstile's remoteip: Cloudflare sends CF-Connecting-IP; on Vercel the client IP is x-real-ip.
  const headers = new Headers(request.headers);
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip && !headers.has("CF-Connecting-IP"))
    headers.set("CF-Connecting-IP", ip);
  return onRequestPost({
    request: new Request(request, { headers }),
    env: process.env as unknown as Env,
    params: { form },
    next: () => Promise.resolve(new Response(null, { status: 404 })),
  });
}
