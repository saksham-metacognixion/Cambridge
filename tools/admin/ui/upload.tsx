// Image upload field: shows the current image (by its key) and sends a chosen file to the service, which converts it to WebP
// under 200 KB and returns the key to store on the record.
import { useState } from "preact/hooks";
import { errorText } from "./api";

export function ImageUpload({ kind, slug, value, onChange, label, hint, suffix }: { kind: "posts" | "authors"; slug: string; value: string; onChange: (key: string) => void; label: string; hint?: string; suffix?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [stamp, setStamp] = useState(0);
  const pick = async (file?: File) => {
    if (!file) return;
    if (!slug) { setMsg({ ok: false, text: "Save first, then upload the image." }); return; }
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/admin/upload/${kind}/${encodeURIComponent(slug)}${suffix ? `?suffix=${suffix}` : ""}`, {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type || "application/octet-stream", "X-Requested-With": "admin" }, body: file,
    });
    const r = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; key?: string; bytes?: number; width?: number; height?: number };
    setBusy(false);
    if (!res.ok || !r.key) { setMsg({ ok: false, text: r.error === "bad_image" ? "That file is not an image we can read (JPG, PNG, WebP, AVIF, HEIC)." : r.error === "too_large" ? "The file is over 15 MB." : r.error === "not_found" ? "Save first, then upload the image." : errorText(r) }); return; }
    onChange(r.key); setStamp(Date.now());
    setMsg({ ok: true, text: `Saved as WebP, ${Math.round((r.bytes ?? 0) / 1024)} KB, ${r.width}×${r.height}.` });
  };
  return (
    <div class="field">
      <span style="font-weight:500;font-size:14px">{label}</span>
      <div class="row" style="align-items:flex-start">
        {value ? <img src={`/api/admin/image/${value}?t=${stamp}`} alt="" style="width:160px;height:110px;object-fit:cover;border-radius:8px;background:#e7e7e7" /> : <div style="width:160px;height:110px;border-radius:8px;background:#e7e7e7;display:grid;place-items:center;color:#6b6b6b;font-size:13px">No image</div>}
        <div style="flex:1;min-width:200px">
          <label class="btn btn-sm" style="cursor:pointer">
            {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" style="display:none" disabled={busy} onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ""; pick(f); }} />
          </label>
          {value && <span class="counter" style="display:block;margin-top:6px">{value}</span>}
          {hint && <span class="counter" style="display:block;margin-top:6px">{hint}</span>}
          {msg && <span class={`counter ${msg.ok ? "ok" : "bad"}`} style="display:block;margin-top:6px">{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}
