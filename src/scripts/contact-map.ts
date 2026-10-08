// Contact Us Google map (bug 051; markup in components/contact/ContactForm.astro). The Figma map image stays as the
// placeholder; the iframe gets its URL when the map box comes near the screen (or a hospital is chosen first), so the page
// loads no Google code up front. On load: the edition's overview search (Global: the group; UAE / KSA: that country). Choosing
// a hospital in the form's Hospital select moves the map to that hospital's own Google place (name, address, directions link
// in Google's place card). Map labels follow the page language (hl / language = en | ar).
//   no key  -> https://www.google.com/maps?q=...&output=embed (keyless embed). English: the hospital's checked search (Google's
//              place card with name, address, open in Maps). Arabic: its position (lat,lng), because Google's Arabic interface
//              matches the English names to other places (Jeddah, Al Khobar).
//   key     -> Maps Embed API: place mode (q=place_id:<id> when hospitals.json has a Place ID) / search mode for the overview
type Place = { q: string; ll: string; id: string };
type Config = { key: string; hl: string; overview: string; places: Record<string, Place> };

const frame = document.querySelector<HTMLIFrameElement>("[data-map-frame]");
if (frame) {
  const cfg = JSON.parse(frame.dataset.config ?? "{}") as Config;
  const select = document.querySelector<HTMLSelectElement>('#contact-form select[name="hospital"]');
  const url = (place?: Place) => {
    const q = !place ? cfg.overview : cfg.key && place.id ? `place_id:${place.id}` : cfg.hl === "ar" ? place.ll : place.q;
    if (cfg.key) {
      const mode = place ? "place" : "search";
      return `https://www.google.com/maps/embed/v1/${mode}?key=${encodeURIComponent(cfg.key)}&q=${encodeURIComponent(q)}&language=${cfg.hl}`;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&hl=${cfg.hl}${place ? "&z=15" : ""}&output=embed`;
  };
  const show = (place?: Place) => {
    const next = url(place);
    if (frame.src === next) return;
    frame.src = next;
    frame.hidden = false;
  };
  frame.addEventListener("load", () => frame.classList.add("is-ready"));

  const selected = () => (select?.value ? cfg.places[select.value] : undefined);
  select?.addEventListener("change", () => show(selected()));

  const box = frame.parentElement!;
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (!frame.src) show(selected());
    }, { rootMargin: "300px 0px" });
    io.observe(box);
  } else show(selected());
}
