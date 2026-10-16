// News tabs: filter the home News cards by category. The set swaps at once (all animations removed, 16 Oct 2026).
// Each tab's cards are pre-rendered into <template data-news-set="key">.
// No tab is pressed by default (Figma); pressing the selected tab again returns to the default cards.
// A tab without a template (no posts in that category yet) shows the default cards.

const root = document.querySelector<HTMLElement>('[data-news]');
const box = root?.querySelector<HTMLElement>('[data-news-cards]');
if (root && box) {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-news-tab]'));
  const sets = new Map<string, HTMLTemplateElement>();
  root.querySelectorAll<HTMLTemplateElement>('template[data-news-set]').forEach((t) => sets.set(t.dataset.newsSet!, t));
  const defaults = Array.from(box.children);
  let wanted = ''; // set last asked for ('' = default cards)

  const nodes = (key: string) =>
    key ? Array.from((sets.get(key)!.content.cloneNode(true) as DocumentFragment).children) : defaults;

  const swap = (key: string) => {
    box.replaceChildren(...nodes(key));
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
