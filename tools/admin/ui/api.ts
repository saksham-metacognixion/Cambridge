// Calls to the admin service (tools/admin/server.ts), same origin. Every write carries X-Requested-With: admin (the server
// refuses writes without it: CSRF guard on top of the SameSite cookie).
export type ApiResult<T = Record<string, unknown>> = { status: number; ok: boolean; error?: string; details?: { field: string; message: string }[] } & Partial<T>;

export async function api<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "admin" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, ok: res.ok, ...data } as ApiResult<T>;
}

/** Message for an error code of the service. */
export function errorText(r: { error?: string; details?: { field: string; message: string }[]; posts?: string[] }) {
  switch (r.error) {
    case "wrong_login": return "Email or password is wrong.";
    case "too_many_attempts": return "Too many attempts. Wait 15 minutes and try again.";
    case "not_signed_in": return "Your session ended. Sign in again.";
    case "invalid": return "Some fields need attention.";
    case "exists": return "That web address is already used by another item.";
    case "bad_slug": return "The web address may only contain letters, numbers and hyphens.";
    case "not_found": return "This item no longer exists.";
    case "in_use": return `This author is used by ${r.posts?.length ?? "some"} post(s). Change those first.`;
    case "publish_running": return "A publish is already running.";
    case "confirm_slug": return "Type the web address to confirm.";
    default: return r.error ? `Something went wrong (${r.error}).` : "Something went wrong.";
  }
}
