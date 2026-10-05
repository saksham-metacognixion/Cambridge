/*
 * About intro video: the page ships only a poster + play button. The player (iframe or <video>) is created on click,
 * so no third-party script or request happens on page load. Source from src/data/about.json (host + id).
 */
function embed(host: string, id: string): HTMLElement | null {
  if (!id) return null;
  if (host === 'file') {
    const v = document.createElement('video');
    v.src = id; v.controls = true; v.autoplay = true; v.playsInline = true;
    return v;
  }
  const src = host === 'youtube' ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`
    : host === 'vimeo' ? `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1` : '';
  if (!src) return null;
  const f = document.createElement('iframe');
  f.src = src; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
  f.title = 'Video'; f.referrerPolicy = 'strict-origin-when-cross-origin';
  return f;
}

document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach((box) => {
  const btn = box.querySelector<HTMLButtonElement>('[data-video-play]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const el = embed(box.dataset.host ?? '', box.dataset.id ?? '');
    if (!el) return;
    el.setAttribute('class', 'player');
    box.replaceChildren(el);
  });
});
