// Contact Us Google map (bug 051; markup in components/contact/ContactForm.astro, data = lib/hospitals.ts mapSpots, i.e. the
// edition's hospitals from hospitals.json: the same list as the form's Hospital select). The Figma map image stays as the
// placeholder; nothing from Google loads until the map box comes near the screen (or a hospital is chosen first).
//   key    -> Maps JavaScript API, loaded once: one map, one marker per hospital with a position, fitted to all of them on load.
//             Choosing a hospital (select change: mouse or keyboard) zooms to its marker, highlights it and fills our card (the
//             site's name + address, never Google's place name; directions to the exact position). The map instance and its
//             markers are reused for every change. A marker click shows its card too (the form value is left as it is).
//   no key -> keyless Google Maps embed by position (one pin at a time; the overview is the area of the edition's hospitals
//             without pins), same card. Also used when Google rejects the key (gm_authFailure).
// A hospital without a position (hospitals.json location lat / lng null: Jeddah until the client sends it) gets no marker and no
// directions link; choosing it shows the overview and its card (name + address). Positions are never searched for by name.
type Spot = {
  id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number } | null;
  placeId: string;
  directions: string;
};
type Config = { key: string; lang: string; region: string; spots: Spot[] };
// The few Google Maps classes used here (no @types/google.maps dependency).
type LatLng = { lat: number; lng: number };
type Icon = { url: string; scaledSize: unknown; anchor: unknown };
type GMap = { setCenter(p: LatLng): void; setZoom(z: number): void; panBy(x: number, y: number): void; fitBounds(b: unknown, padding: object): void };
type GMarker = { setOptions(o: { icon?: Icon; zIndex?: number }): void; addListener(e: string, f: () => void): void };
type G = {
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  LatLngBounds: new () => { extend(p: LatLng): void };
  event: { addListenerOnce(target: unknown, e: string, f: () => void): void };
  importLibrary(name: string): Promise<Record<string, new (...args: never[]) => unknown>>;
};

const canvas = document.querySelector<HTMLElement>("[data-map-canvas]");
const card = document.querySelector<HTMLElement>("[data-map-card]");
if (canvas && card) {
  const cfg = JSON.parse(canvas.dataset.config ?? "{}") as Config;
  const select = document.querySelector<HTMLSelectElement>(
    '#contact-form select[name="hospital"]',
  );
  const located = cfg.spots.filter((s) => s.position);
  const spotOf = (id?: string) => cfg.spots.find((s) => s.id === id);
  const HOSPITAL_ZOOM = 15;

  const nameEl = card.querySelector<HTMLElement>("[data-map-name]")!;
  const addrEl = card.querySelector<HTMLElement>("[data-map-addr]")!;
  const linkEl = card.querySelector<HTMLAnchorElement>("[data-map-link]")!;
  const showCard = (s?: Spot) => {
    card.hidden = !s;
    if (!s) return;
    nameEl.textContent = s.name;
    addrEl.textContent = s.address;
    linkEl.hidden = !s.directions;
    if (s.directions) linkEl.href = s.directions;
    else linkEl.removeAttribute("href");
  };
  // Pixels the card covers at the top of the map, so a chosen marker sits in the free part below it.
  const cardOffset = () =>
    card.hidden ? 0 : card.offsetTop + card.offsetHeight;

  // ---- keyless embed ----
  const embedView = () => {
    // Centre + zoom that fit the edition's hospitals in the box (Web Mercator), for the no-pin overview.
    const ys = located.map((s) =>
      Math.log(Math.tan(Math.PI / 4 + (s.position!.lat * Math.PI) / 360)),
    );
    const xs = located.map((s) => s.position!.lng);
    const [x0, x1, y0, y1] = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ];
    const { width, height } = canvas.getBoundingClientRect();
    const fit = Math.min(
      width / 256 / Math.max((x1 - x0) / 360, 1e-6),
      height / 256 / Math.max((y1 - y0) / (2 * Math.PI), 1e-6),
    );
    const z = Math.max(
      3,
      Math.min(HOSPITAL_ZOOM, Math.floor(Math.log2(fit * 0.75))),
    );
    const lat = (Math.atan(Math.sinh((y0 + y1) / 2)) * 180) / Math.PI;
    return `ll=${lat.toFixed(6)},${((x0 + x1) / 2).toFixed(6)}&z=${z}`;
  };
  const embedSrc = (s?: Spot) => {
    const view = s?.position
      ? `q=${s.position.lat},${s.position.lng}&z=${HOSPITAL_ZOOM}`
      : located.length
        ? embedView()
        : "q=";
    return `https://www.google.com/maps?${view}&hl=${cfg.lang}&output=embed`;
  };
  const embed = (s?: Spot) => {
    let frame = canvas.querySelector("iframe");
    if (!frame) {
      frame = document.createElement("iframe");
      frame.title = canvas.getAttribute("aria-label") ?? "";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.addEventListener("load", () => canvas.classList.add("is-ready"));
      canvas.replaceChildren(frame);
    }
    const next = embedSrc(s);
    if (frame.src !== next) frame.src = next;
  };

  // ---- Maps JavaScript API ----
  let g: G | undefined;
  let api: Promise<G> | undefined;
  const loadApi = () =>
    (api ??= new Promise<G>((resolve, reject) => {
      const w = window as unknown as Record<string, unknown>;
      w.__contactMapReady = () => resolve((g = (w.google as { maps: G }).maps));
      w.gm_authFailure = () => toEmbed();
      const params = new URLSearchParams({
        key: cfg.key,
        language: cfg.lang,
        loading: "async",
        callback: "__contactMapReady",
      });
      if (cfg.region) params.set("region", cfg.region);
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      s.async = true;
      s.onerror = reject;
      document.head.append(s);
    }));

  let map: GMap | undefined;
  const markers = new Map<string, GMarker>();
  let icons: { normal: Icon; active: Icon } | undefined;
  let activeId = "";

  const pinIcon = (
    g: G,
    fill: string,
    dot: string,
    scale: number,
  ): Icon => ({
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 1C6.8 1 1 6.8 1 13.9 1 23.6 14 39 14 39s13-15.4 13-25.1C27 6.8 21.2 1 14 1z" fill="${fill}" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="${dot}"/></svg>`,
      ),
    scaledSize: new g.Size(28 * scale, 40 * scale),
    anchor: new g.Point(14 * scale, 40 * scale),
  });

  const overview = () => {
    if (!map || !located.length) return;
    if (located.length === 1) {
      map.setCenter(located[0].position!);
      map.setZoom(HOSPITAL_ZOOM - 1);
      return;
    }
    const b = new g!.LatLngBounds();
    located.forEach((s) => b.extend(s.position!));
    // Padding counts the marker's point: the pin (40 px) rises above it, hence the larger top.
    map.fitBounds(b, {
      top: 40 + 24 + cardOffset(),
      bottom: 32,
      left: 32,
      right: 32,
    });
  };

  const highlight = (id: string) => {
    if (!icons) return;
    markers.get(activeId)?.setOptions({ icon: icons.normal, zIndex: 1 });
    activeId = id;
    markers.get(id)?.setOptions({ icon: icons.active, zIndex: 2 });
  };

  const focusSpot = (s?: Spot) => {
    showCard(s);
    if (!map) return;
    highlight(s?.position ? s.id : "");
    if (!s?.position) return overview();
    map.setZoom(HOSPITAL_ZOOM);
    map.setCenter(s.position);
    map.panBy(0, -cardOffset() / 2);
  };

  const initMap = async () => {
    const g = await loadApi();
    if (mode !== "js") return;
    const [maps, marker] = await Promise.all([g.importLibrary("maps"), g.importLibrary("marker")]);
    const MapClass = maps.Map as unknown as new (el: HTMLElement, o: object) => GMap;
    const Marker = marker.Marker as unknown as new (o: object) => GMarker;
    if (mode !== "js") return;
    icons = {
      normal: pinIcon(g, "#004059", "#fff", 1),
      active: pinIcon(g, "#00b8ff", "#004059", 1.2),
    };
    map = new MapClass(canvas, {
      center: located[0]?.position ?? { lat: 24.4, lng: 54.4 },
      zoom: 6,
      gestureHandling: "cooperative",
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // Google's place labels are hidden so its old names (e.g. "CMRC Saudi Arabia Hospital" at Dhahran, filed outside
      // poi.medical) never sit next to ours; roads, areas and transit stay labelled.
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
    for (const s of located) {
      const m = new Marker({
        map,
        position: s.position!,
        title: s.name,
        icon: icons.normal,
        zIndex: 1,
      });
      m.addListener("click", () => focusSpot(s));
      markers.set(s.id, m);
    }
    g.event.addListenerOnce(map, "tilesloaded", () =>
      canvas.classList.add("is-ready"),
    );
    const s = spotOf(select?.value);
    if (s) focusSpot(s);
    else overview();
  };

  let mode: "" | "js" | "embed" = "";
  const toEmbed = () => {
    mode = "embed";
    map = undefined;
    markers.clear();
    canvas.classList.remove("is-ready");
    embed(spotOf(select?.value));
  };

  const start = () => {
    if (mode) return;
    canvas.hidden = false;
    if (cfg.key) {
      mode = "js";
      initMap().catch(toEmbed);
    } else toEmbed();
  };

  const onChoice = () => {
    const s = spotOf(select?.value);
    if (!mode) {
      showCard(s);
      return start();
    }
    if (mode === "embed") {
      showCard(s);
      embed(s);
    } else focusSpot(s);
  };
  select?.addEventListener("change", onChoice);
  // The form clears itself after a successful send: back to the overview, no card.
  select?.form?.addEventListener("reset", () => setTimeout(onChoice));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(canvas.parentElement!);
  } else start();
}
