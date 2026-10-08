/*
 * Click-to-play videos (About intro, hospital "Environment of Care", news articles): the page ships only a poster + play
 * button. On click the player (iframe or <video>) opens in a lightbox (user decision, 6 Oct 2026, screen recording of the
 * live site): dark overlay fades in, the player autoplays in the centre, a round close button on the player's top corner;
 * Esc, the close button or a click on the overlay closes it (fade out), the player is removed (stops the sound) and focus
 * goes back to the play button. Nothing third-party loads before the click. Close label = data-close-label on the play
 * button (forms/common close). Source = data-host + data-id (src/data/about.json, hospital JSON).
 * Frame shape (bug 031, 7 Oct 2026): data-aspect on the facade ("16:9" default, "9:16" for a portrait Short, any "w:h" /
 * "w/h", or "portrait" / "landscape") becomes the --vl-ratio custom property (width / height) on the dialog; the CSS sizes
 * the frame from it, so a portrait video gets a portrait frame and a landscape one a 16:9 frame, both fitted to the
 * viewport (85dvh tall at most, never wider than the screen). Look: .video-lightbox rules in src/styles/global.css.
 */
const RATIOS: Record<string, number> = {
  landscape: 16 / 9,
  portrait: 9 / 16,
  square: 1,
};

/** "9:16" | "9/16" | "portrait" | "landscape" -> width / height (16:9 when missing or unreadable). */
export function aspectRatio(spec: string | undefined): number {
  const v = (spec ?? "").trim().toLowerCase();
  if (v in RATIOS) return RATIOS[v];
  const m = v.match(/^(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)$/);
  if (m) {
    const w = Number(m[1]);
    const h = Number(m[2]);
    if (w > 0 && h > 0) return w / h;
  }
  return RATIOS.landscape;
}
function embed(host: string, id: string): HTMLElement | null {
  if (!id) return null;
  if (host === "file") {
    const v = document.createElement("video");
    v.src = id;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    return v;
  }
  const src =
    host === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`
      : host === "vimeo"
        ? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`
        : "";
  if (!src) return null;
  const f = document.createElement("iframe");
  f.src = src;
  // clipboard-write: the player's "Copy link" fails without it; web-share: its Share button.
  f.allow =
    "autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share";
  f.allowFullscreen = true;
  f.title = "Video";
  f.referrerPolicy = "strict-origin-when-cross-origin";
  return f;
}

const FADE_MS = 250;
let box: HTMLDialogElement | null = null;
let frame: HTMLElement | null = null;
let returnFocusTo: HTMLElement | null = null;
let closeTimer = 0;

function lightbox(label: string, closeLabel: string): HTMLDialogElement {
  if (box) return box;
  box = document.createElement("dialog");
  box.className = "video-lightbox";
  box.setAttribute("aria-modal", "true");
  // The stage is sized from --vl-ratio; the close button is positioned on ITS top corner, so it follows the frame at every size.
  box.innerHTML = `<div class="video-lightbox-stage" data-vl-stage><button type="button" class="video-lightbox-close" data-vl-close>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
    </button><div class="video-lightbox-frame" data-vl-frame></div></div>`;
  document.body.append(box);
  frame = box.querySelector<HTMLElement>("[data-vl-frame]");
  box.querySelector("[data-vl-close]")!.addEventListener("click", close);
  // Click on the dark overlay (outside the player) closes, like the live site.
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });
  // Esc: run our fade + cleanup instead of the instant native close.
  box.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  box.setAttribute("aria-label", label);
  box.querySelector("[data-vl-close]")!.setAttribute("aria-label", closeLabel);
  return box;
}

function open(player: HTMLElement, btn: HTMLElement, ratio: number) {
  const d = lightbox(
    btn.getAttribute("aria-label") ?? "Video",
    btn.dataset.closeLabel ?? "Close",
  );
  window.clearTimeout(closeTimer);
  returnFocusTo = btn;
  d.style.setProperty("--vl-ratio", String(ratio));
  d.classList.toggle("is-portrait", ratio < 1);
  player.setAttribute("class", "video-lightbox-player");
  frame!.replaceChildren(player);
  d.classList.remove("is-open");
  if (!d.open) d.showModal();
  document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => d.classList.add("is-open"));
  d.querySelector<HTMLElement>("[data-vl-close]")!.focus();
}

function close() {
  if (!box || !box.open) return;
  const d = box;
  d.classList.remove("is-open");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  closeTimer = window.setTimeout(
    () => {
      d.close();
      frame?.replaceChildren();
      document.documentElement.style.overflow = "";
      returnFocusTo?.focus();
      returnFocusTo = null;
    },
    reduce ? 0 : FADE_MS,
  );
}

document
  .querySelectorAll<HTMLElement>("[data-video-facade]")
  .forEach((wrap) => {
    const btn = wrap.querySelector<HTMLButtonElement>("[data-video-play]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const el = embed(wrap.dataset.host ?? "", wrap.dataset.id ?? "");
      if (el) open(el, btn, aspectRatio(wrap.dataset.aspect));
    });
  });
