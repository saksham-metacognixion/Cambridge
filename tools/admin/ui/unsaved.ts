// Which editors hold unsaved changes (the post editor, the author editor, Settings). "Publish site" (app.tsx) refuses to start
// a build while any does, because a build only sees saved files: the person would wait 25 minutes for a website without their
// change (bug 255). Leaving a page with unsaved changes asks first (bug 256): in-dashboard navigation (nav() and the browser's
// Back / Forward inside the dashboard, app.tsx) shows the "Stay / Leave" dialog through confirmLeave(); a reload, a tab close or
// a page outside the dashboard gets the browser's own warning through a beforeunload listener that exists only while something
// is unsaved.
import { useEffect, useState } from "preact/hooks";

const dirty = new Set<string>();
const subs = new Set<() => void>();
export const hasUnsaved = () => dirty.size > 0;

const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; // returnValue: older Chrome / Safari
export function setUnsaved(id: string, isDirty: boolean) {
  const before = hasUnsaved();
  if (isDirty) dirty.add(id); else dirty.delete(id);
  const now = hasUnsaved();
  if (before === now) return;
  if (now) addEventListener("beforeunload", onBeforeUnload); else removeEventListener("beforeunload", onBeforeUnload);
  subs.forEach((f) => f());
}
/** True while any editor on the page has unsaved changes; re-renders when that changes. */
export function useUnsaved() {
  const [v, set] = useState(hasUnsaved());
  useEffect(() => { const f = () => set(hasUnsaved()); subs.add(f); f(); return () => { subs.delete(f); }; }, []);
  return v;
}

// ---------- "You have unsaved changes. Leave without saving?" ----------
let pending: Promise<boolean> | null = null;
let answer: ((leave: boolean) => void) | null = null;
const dialogSubs = new Set<(open: boolean) => void>();
/** Resolves true when the page may be left: nothing is unsaved, or the person chose Leave. One dialog at a time: a second
 *  request while it is open gets the same answer. */
export function confirmLeave(): Promise<boolean> {
  if (!hasUnsaved()) return Promise.resolve(true);
  if (pending) return pending;
  if (!dialogSubs.size) return Promise.resolve(confirm("You have unsaved changes. Leave without saving?")); // no dialog mounted
  pending = new Promise<boolean>((resolve) => { answer = resolve; });
  dialogSubs.forEach((f) => f(true));
  return pending;
}
/** Called by the dialog's buttons (Stay = false, Leave = true). */
export function answerLeave(leave: boolean) {
  const done = answer;
  pending = null; answer = null;
  dialogSubs.forEach((f) => f(false));
  done?.(leave);
}
/** True while the dialog should be shown (the dialog component in app.tsx). */
export function useLeaveDialog() {
  const [open, setOpen] = useState(!!pending);
  useEffect(() => { dialogSubs.add(setOpen); return () => { dialogSubs.delete(setOpen); }; }, []);
  return open;
}
