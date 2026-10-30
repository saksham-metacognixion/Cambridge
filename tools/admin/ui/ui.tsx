// Small building blocks of the dashboard UI (preact).
import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: ComponentChildren; children: ComponentChildren }) {
  return (
    <div class="field">
      <label for={id}>{label}</label>
      {children}
      {hint && <span class="counter">{hint}</span>}
    </div>
  );
}

export function Text({ id, value, onInput, rows, dir, mono, placeholder, type = "text" }: { id: string; value: string; onInput: (v: string) => void; rows?: number; dir?: string; mono?: boolean; placeholder?: string; type?: string }) {
  const props = { id, value, dir, placeholder, onInput: (e: Event) => onInput((e.currentTarget as HTMLInputElement).value) };
  return rows ? <textarea class={`input${mono ? " mono" : ""}`} rows={rows} {...props} /> : <input class="input" type={type} {...props} />;
}

/** "52 / 60" style counter: green inside the range, amber outside, grey when empty. */
export function Counter({ n, min, max, unit = "characters" }: { n: number; min: number; max: number; unit?: string }) {
  const cls = n === 0 ? "" : n >= min && n <= max ? "ok" : "warn";
  return <span class={`counter ${cls}`}>{n} {unit} · aim for {min}–{max}</span>;
}

export function StringList({ value, onChange, placeholder, add, dir }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; add: string; dir?: string }) {
  return (
    <div class="pairs">
      {value.map((v, i) => (
        <div class="row" key={i}>
          <input class="input" dir={dir} value={v} placeholder={i === 0 ? placeholder : ""} aria-label={`Item ${i + 1}`} onInput={(e) => { const n = [...value]; n[i] = (e.currentTarget as HTMLInputElement).value; onChange(n); }} />
          <button type="button" class="x" aria-label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button>
        </div>
      ))}
      <button type="button" class="add" onClick={() => onChange([...value, ""])}>+ {add}</button>
    </div>
  );
}

export function Pairs({ value, onChange, labels, add, dir, long = true }: { value: [string, string][]; onChange: (v: [string, string][]) => void; labels: [string, string]; add: string; dir?: string; long?: boolean }) {
  const upd = (i: number, k: 0 | 1, v: string) => { const n = value.map((x) => [...x] as [string, string]); n[i][k] = v; onChange(n); };
  return (
    <div class="pairs">
      {value.map(([a, b], i) => (
        <div class="pair" key={i}>
          <div class="row">
            <input class="input" dir={dir} value={a} placeholder={labels[0]} aria-label={labels[0]} onInput={(e) => upd(i, 0, (e.currentTarget as HTMLInputElement).value)} />
            <button type="button" class="x" aria-label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button>
          </div>
          {long ? <textarea class="input" rows={3} dir={dir} value={b} placeholder={labels[1]} aria-label={labels[1]} onInput={(e) => upd(i, 1, (e.currentTarget as HTMLTextAreaElement).value)} />
            : <input class="input" dir={dir} value={b} placeholder={labels[1]} aria-label={labels[1]} onInput={(e) => upd(i, 1, (e.currentTarget as HTMLInputElement).value)} />}
        </div>
      ))}
      <button type="button" class="add" onClick={() => onChange([...value, ["", ""]])}>+ {add}</button>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  useEffect(() => { setShown(text); if (!text) return; const t = setTimeout(() => setShown(""), 3500); return () => clearTimeout(t); }, [text]);
  return shown ? <div class="toast" role="status">{shown}</div> : null;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const scoreClass = (n: number) => (n >= 80 ? "good" : n >= 50 ? "mid" : "low");
