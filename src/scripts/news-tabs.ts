// News tabs: filter the home News cards by category, with the live site's transition (cards fade out, the set
// swaps, cards fade back in). Each tab's cards are pre-rendered into <template data-news-set="key">.
// No tab is pressed by default (Figma); pressing the selected tab again returns to the default cards.
// A tab without a template (no posts in that category yet) shows the default cards.

const OUT_MS = 250; // must match the CSS transition in News.astro

const root = document.querySelector<HTMLElement>('[data-news]');
const box = root?.querySelector<HTMLElement>('[data-news-cards]');
if (root && box) {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-news-tab]'));
  const sets = new Map<string, HTMLTemplateElement>();
  root.querySelectorAll<HTMLTemplateElement>('template[data-news-set]').forEach((t) => sets.set(t.dataset.newsSet!, t));
  const defaults = Array.from(box.children);
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  let wanted = ''; // set last asked for ('' = default cards)
  let run = 0;

  const nodes = (key: string) =>
    key ? Array.from((sets.get(key)!.content.cloneNode(true) as DocumentFragment).children) : defaults;

  const swap = async (key: string) => {
    const id = ++run;
    box.setAttribute('aria-busy', 'true');
    if (motion.matches) {
      box.classList.add('is-fading');
      await new Promise((r) => setTimeout(r, OUT_MS));
      if (id !== run) return; // a newer click took over
    }
    const next = nodes(key);
    if (motion.matches) next.forEach((n) => n.classList.add('is-entering'));
    box.replaceChildren(...next);
    box.classList.remove('is-fading');
    if (motion.matches) {
      void box.offsetWidth; // commit opacity 0 before fading in
      next.forEach((n) => n.classList.remove('is-entering'));
    }
    box.removeAttribute('aria-busy');
  };

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('aria-pressed') === 'true' ? '' : tab.dataset.newsTab!;
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab && key !== '')));
      const target = key && sets.has(key) ? key : '';
      if (target !== wanted) { wanted = target; swap(target); }
    }),
  );
}
