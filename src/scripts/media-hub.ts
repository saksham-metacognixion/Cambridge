// Media Hub "Latest Blogs & Posts": category filter + lazy loading of the full post list.
// The page ships with the newest posts. Choosing a category (or scrolling to the end of the row) loads posts.json once,
// which holds ALL posts of the edition, and renders cards from the <template>. Filter state is in the URL
// (?category=events): the back button works and the URL can be shared.
// The row auto-scrolls in a loop (bug 064, src/scripts/autoscroll.ts): `row` is the scroller, the cards live in its
// [data-loop-row] list (the auto-scroll copies come after it). New cards go into that list, then 'autoscroll:refresh'
// rebuilds the copies, so the loop grows as the visitor (or the auto-scroll) nears the end of the loaded posts.
// Bug 127: See More opens the grid under the row (the same cards, GRID_STEP at a time, of the chosen category); a category
// change re-fills it from the start. The grid is not part of the auto-scroll loop.

type Card = {
  slug: string; category: string; href: string; title: string; excerpt: string; iso: string;
  day: string; weekday: string; dateFull: string; src: string; srcset: string; alt: string; crop: string;
};

const CHUNK = 6;
const GRID_STEP = 12;
const root = document.querySelector<HTMLElement>('[data-latest]');
const select = document.querySelector<HTMLSelectElement>('[data-category-select]');
const row = root?.querySelector<HTMLElement>('[data-row]');
const tpl = root?.querySelector<HTMLTemplateElement>('template[data-card-template]');
const list = row?.querySelector<HTMLElement>('[data-loop-row]') ?? row;
const sentinel = list?.querySelector<HTMLElement>('[data-sentinel]');
const toggle = root?.querySelector<HTMLButtonElement>('[data-grid-toggle]');
const grid = root?.querySelector<HTMLElement>('[data-grid]');
const gridList = grid?.querySelector<HTMLElement>('[data-grid-list]');
const more = grid?.querySelector<HTMLButtonElement>('[data-grid-more]');

if (root && select && row && list && tpl && sentinel && toggle && grid && gridList && more) {
  const valid = new Set(Array.from(select.options).map((o) => o.value));
  let all: Card[] | null = null;
  let index: Promise<Card[]> | null = null;
  let posts: Card[] = [];
  let shown = list.querySelectorAll('[data-card]').length; // cards rendered at build time = newest posts, all categories
  let category = '';
  let run = 0;
  let gridShown = 0;
  let gridCategory: string | null = null; // category the grid holds (null = not filled yet)

  const fromUrl = () => {
    const c = new URL(location.href).searchParams.get('category') ?? '';
    return valid.has(c) ? c : '';
  };

  const load = () => (index ??= fetch(root.dataset.index!).then((r) => r.json()).then((j: Card[]) => (all = j)));

  const make = (c: Card) => {
    const li = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    li.querySelector('[data-card]')!.setAttribute('data-category', c.category);
    const img = li.querySelector<HTMLImageElement>('[data-img]')!;
    img.hidden = !c.src;
    img.src = c.src;
    if (c.srcset) img.srcset = c.srcset;
    img.alt = c.alt;
    if (c.crop) img.setAttribute('style', c.crop);
    const time = li.querySelector<HTMLTimeElement>('[data-time]')!;
    time.dateTime = c.iso;
    time.setAttribute('aria-label', c.dateFull);
    li.querySelector('[data-day]')!.textContent = c.day;
    li.querySelector('[data-weekday]')!.textContent = c.weekday;
    const title = li.querySelector<HTMLAnchorElement>('[data-title]')!;
    title.href = c.href;
    title.textContent = c.title;
    li.querySelector('[data-excerpt]')!.textContent = c.excerpt;
    li.querySelector<HTMLAnchorElement>('[data-arrow]')!.href = c.href;
    return li;
  };

  const append = () => {
    const next = posts.slice(shown, shown + CHUNK);
    next.forEach((c) => list.insertBefore(make(c), sentinel));
    shown += next.length;
    row.dispatchEvent(new Event('autoscroll:refresh'));
    io.unobserve(sentinel); // re-observe so a sentinel that is still in view loads the next chunk
    if (shown < posts.length) io.observe(sentinel);
  };

  const io = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      const id = run;
      await load();
      if (id !== run) return;
      posts = all!.filter((c) => !category || c.category === category);
      append();
    },
    { root: row, rootMargin: '0px 400px' },
  );

  // Grid: the next GRID_STEP posts of the category; `focus` moves keyboard focus to the first new card (See More at the end).
  const gridAdd = (focus: boolean) => {
    const posts = all!.filter((c) => !category || c.category === category);
    const next = posts.slice(gridShown, gridShown + GRID_STEP).map((c) => {
      const li = make(c);
      li.removeAttribute('data-loop-item');
      return li;
    });
    gridList.append(...next);
    gridShown += next.length;
    more.hidden = gridShown >= posts.length;
    if (focus) next[0]?.querySelector<HTMLElement>('[data-title]')?.focus();
  };

  const gridFill = async () => {
    const cat = category;
    await load();
    if (cat !== category || toggle.getAttribute('aria-expanded') !== 'true') return;
    if (gridCategory === cat) return;
    gridCategory = cat;
    gridList.replaceChildren();
    gridShown = 0;
    gridAdd(false);
  };

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('[data-label]')!.textContent = (open ? toggle.dataset.labelLess : toggle.dataset.labelMore) ?? '';
    grid.hidden = !open;
    if (open) gridFill();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  more.addEventListener('click', () => gridAdd(true));

  const apply = async (cat: string, reset: boolean) => {
    category = cat;
    select.value = cat;
    if (gridCategory !== cat) {
      gridCategory = null; // never show the previous category's posts: emptied now, re-filled when open
      gridList.replaceChildren();
      if (!grid.hidden) gridFill();
    }
    const id = ++run;
    io.unobserve(sentinel);
    if (!reset && !cat) {
      // First load without a filter: keep the cards rendered at build time.
      io.observe(sentinel);
      return;
    }
    await load();
    if (id !== run) return;
    list.querySelectorAll('li:not([data-sentinel])').forEach((n) => n.remove());
    row.scrollTo({ left: 0 });
    posts = all!.filter((c) => !cat || c.category === cat);
    shown = 0;
    append();
  };

  select.addEventListener('change', () => {
    const url = new URL(location.href);
    if (select.value) url.searchParams.set('category', select.value);
    else url.searchParams.delete('category');
    history.pushState({}, '', url);
    apply(select.value, true);
  });
  addEventListener('popstate', () => apply(fromUrl(), true));

  apply(fromUrl(), false);
}
