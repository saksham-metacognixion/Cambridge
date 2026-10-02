/*
 * ALL / KSA / UAE filter for lists rendered in the HTML (Insurance Providers, Patient Testimonials) on the Global edition.
 * Root [data-region-filter]; pills [data-country] (RegionPills); items [data-regions="ae sa"]; optional [data-region-empty]
 * and [data-region-status] (template with {n}). State in the URL: ?country=ae|sa (absent = all, the default), one history
 * entry per change, back/forward restore it. Same parameter name as Find a Doctor. /ae and /sa render only their own
 * items server-side and have no pills, so this script does nothing there.
 */
const COUNTRIES = ["all", "ae", "sa"];

for (const root of document.querySelectorAll<HTMLElement>(
  "[data-region-filter]",
)) {
  const pills = [...root.querySelectorAll<HTMLButtonElement>("[data-country]")];
  if (!pills.length) continue;
  const items = [...root.querySelectorAll<HTMLElement>("[data-regions]")];
  const empty = root.querySelector<HTMLElement>("[data-region-empty]");
  const status = root.querySelector<HTMLElement>("[data-region-status]");
  const read = () => {
    const v = new URLSearchParams(location.search).get("country") ?? "all";
    return COUNTRIES.includes(v) ? v : "all";
  };
  let country = read();
  let announce = false;

  const render = () => {
    let n = 0;
    for (const it of items) {
      const ok =
        country === "all" ||
        (it.dataset.regions ?? "").split(" ").includes(country);
      it.hidden = !ok;
      if (ok) n++;
    }
    for (const p of pills)
      p.setAttribute("aria-pressed", String(p.dataset.country === country));
    if (empty) empty.hidden = n > 0;
    if (status && announce)
      status.textContent = (status.dataset.template ?? "").replace(
        "{n}",
        String(n),
      );
  };

  for (const p of pills) {
    p.addEventListener("click", () => {
      country = p.dataset.country ?? "all";
      const q = new URLSearchParams(location.search);
      if (country === "all") q.delete("country");
      else q.set("country", country);
      const search = q.toString() ? `?${q}` : "";
      if (search !== location.search)
        history.pushState(null, "", location.pathname + search + location.hash);
      announce = true;
      render();
    });
  }
  window.addEventListener("popstate", () => {
    country = read();
    announce = true;
    render();
  });
  render();
}
