// Contact Us Google map (bug 051; markup in components/contact/ContactForm.astro, data = lib/hospitals.ts mapSpots, i.e. the
// edition's hospitals from hospitals.json: the same list as the form's Hospital select). The ONLY map implementation is the
// Maps JavaScript API; nothing from Google loads until the map box comes near the screen (or a hospital is chosen first), and
// the API script is requested once. One map, one marker per hospital with a position, fitted to all of them on load.
// Choosing a hospital (select change: mouse or keyboard) zooms to its marker, highlights it and fills our card (the site's
// name + address, never Google's place name; directions to the exact position). A marker click does the same AND selects
// that hospital in the form, so the dropdown, the map, the active marker and the card always agree (one activeId).
// Fallback (no key, Google rejects the key, the script fails): the neutral placeholder drawing stays in place, the select and the card
// (name, address, directions link) keep working, and the cause is logged. Never an iframe embed, never a search by name.
// A hospital without a position (hospitals.json location lat / lng null: Jeddah until the client sends it) gets no marker and
// no directions link; choosing it shows the overview and its card (name + address) and logs a warning.
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
type GMap = {
  setCenter(p: LatLng): void;
  setZoom(z: number): void;
  panBy(x: number, y: number): void;
  fitBounds(b: unknown, padding: object): void;
};
type GMarker = {
  setOptions(o: { icon?: Icon; zIndex?: number }): void;
  addListener(e: string, f: () => void): void;
};
type G = {
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  LatLngBounds: new () => { extend(p: LatLng): void };
  event: { addListenerOnce(target: unknown, e: string, f: () => void): void };
  importLibrary(
    name: string,
  ): Promise<Record<string, new (...args: never[]) => unknown>>;
};

const TAG = "[contact-map]";
const canvas = document.querySelector<HTMLElement>("[data-map-canvas]");
const card = document.querySelector<HTMLElement>("[data-map-card]");
if (canvas && card) {
  const cfg = JSON.parse(canvas.dataset.config ?? "{}") as Partial<Config>;
  const spots = Array.isArray(cfg.spots) ? cfg.spots : [];
  if (!spots.length)
    console.error(
      `${TAG} no hospitals in the map config (lib/hospitals.ts mapSpots)`,
    );
  const select = document.querySelector<HTMLSelectElement>(
    '#contact-form select[name="hospital"]',
  );
  const validPos = (s: Spot) =>
    !!s.position &&
    Number.isFinite(s.position.lat) &&
    Number.isFinite(s.position.lng) &&
    Math.abs(s.position.lat) <= 90 &&
    Math.abs(s.position.lng) <= 180;
  for (const s of spots)
    if (s.position && !validPos(s))
      console.error(`${TAG} invalid coordinates for "${s.name}":`, s.position);
  const located = spots.filter(validPos);
  const unlocated = spots.filter((s) => !validPos(s));
  if (unlocated.length)
    console.warn(
      `${TAG} no exact position yet (hospitals.json location.lat / lng), so no marker and no directions link: ` +
        unlocated.map((s) => `"${s.name}"`).join(", "),
    );
  const spotOf = (id?: string) => spots.find((s) => s.id === id);
  const HOSPITAL_ZOOM = 15;

  // ---- the card (always ours: site name + address + directions to the exact position) ----
  const nameEl = card.querySelector<HTMLElement>("[data-map-name]")!;
  const addrEl = card.querySelector<HTMLElement>("[data-map-addr]")!;
  const linkEl = card.querySelector<HTMLAnchorElement>("[data-map-link]")!;
  const showCard = (s?: Spot) => {
    card.hidden = !s;
    card.dataset.active = s?.id ?? "";
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

  // ---- state: "" = not started, "js" = Maps JavaScript API, "fallback" = placeholder drawing + card only ----
  let mode: "" | "js" | "fallback" = "";
  const fallback = (why: string, detail?: unknown) => {
    mode = "fallback";
    canvas.dataset.mapState = "fallback";
    map = undefined;
    markers.clear();
    canvas.hidden = true;
    canvas.classList.remove("is-ready");
    canvas.replaceChildren();
    if (detail === undefined)
      console.error(`${TAG} ${why}; showing the placeholder map instead`);
    else
      console.error(
        `${TAG} ${why}; showing the placeholder map instead`,
        detail,
      );
    showCard(spotOf(select?.value));
  };

  // ---- Maps JavaScript API, loaded once ----
  let g: G | undefined;
  let api: Promise<G> | undefined;
  const loadApi = () =>
    (api ??= new Promise<G>((resolve, reject) => {
      const w = window as unknown as Record<string, unknown>;
      w.__contactMapReady = () => {
        const maps = (w.google as { maps?: G } | undefined)?.maps;
        if (maps) resolve((g = maps));
        else reject(new Error("google.maps missing after the script loaded"));
      };
      // Google calls this when it refuses the key (wrong key, referrer not allowed, Maps JavaScript API not enabled).
      w.gm_authFailure = () =>
        fallback(
          "Google rejected the API key (check PUBLIC_GOOGLE_MAPS_KEY: Maps JavaScript API enabled, HTTP referrer allowed)",
        );
      const params = new URLSearchParams({
        key: cfg.key ?? "",
        language: cfg.lang ?? "en",
        loading: "async",
        callback: "__contactMapReady",
      });
      if (cfg.region) params.set("region", cfg.region);
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      s.async = true;
      s.onerror = () =>
        reject(new Error("the Maps JavaScript API script did not load"));
      document.head.append(s);
    }));

  let map: GMap | undefined;
  const markers = new Map<string, GMarker>();
  let icons: { normal: Icon; active: Icon } | undefined;
  let activeId = "";

  const pinIcon = (g: G, fill: string, dot: string, scale: number): Icon => ({
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path d="M14 1C6.8 1 1 6.8 1 13.9 1 23.6 14 39 14 39s13-15.4 13-25.1C27 6.8 21.2 1 14 1z" fill="${fill}" stroke="#fff" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="${dot}"/></svg>`,
      ),
    scaledSize: new g.Size(28 * scale, 40 * scale),
    anchor: new g.Point(14 * scale, 40 * scale),
  });

  // All of the edition's hospitals in view (LatLngBounds), or the one hospital when only one has a position.
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
    canvas.dataset.active = id;
  };

  // The one place that moves the map: card + active marker + centre + zoom for a hospital (or the overview for none).
  const focusSpot = (s?: Spot) => {
    showCard(s);
    if (!map) return;
    const has = !!s && validPos(s);
    highlight(has ? s!.id : "");
    if (!has) {
      if (s)
        console.warn(
          `${TAG} "${s.name}" has no exact position yet: overview shown instead of its marker`,
        );
      return overview();
    }
    map.setZoom(HOSPITAL_ZOOM);
    map.setCenter(s!.position!);
    map.panBy(0, -cardOffset() / 2);
  };

  // Marker click: select that hospital in the form (same value as the <option>), which runs onChoice through the form's own
  // change handling (error clearing etc.), so dropdown, map and card never disagree.
  const chooseFromMarker = (s: Spot) => {
    if (select && select.value !== s.id) {
      select.value = s.id;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } else focusSpot(s);
  };

  const initMap = async () => {
    const g = await loadApi();
    if (mode !== "js") return;
    const [maps, marker] = await Promise.all([
      g.importLibrary("maps"),
      g.importLibrary("marker"),
    ]);
    const MapClass = maps.Map as unknown as new (
      el: HTMLElement,
      o: object,
    ) => GMap;
    const Marker = marker.Marker as unknown as new (o: object) => GMarker;
    if (mode !== "js" || map) return;
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
      m.addListener("click", () => chooseFromMarker(s));
      markers.set(s.id, m);
    }
    g.event.addListenerOnce(map, "tilesloaded", () => {
      canvas.classList.add("is-ready");
      canvas.dataset.mapState = "js";
    });
    const s = spotOf(select?.value);
    if (s) focusSpot(s);
    else overview();
  };

  const start = () => {
    if (mode) return;
    if (!cfg.key)
      return fallback(
        "no Google Maps API key (set PUBLIC_GOOGLE_MAPS_KEY, see .env.example)",
      );
    if (!located.length)
      return fallback("no hospital of this edition has a position to show");
    mode = "js";
    canvas.hidden = false;
    canvas.dataset.mapState = "loading";
    initMap().catch((e: unknown) =>
      fallback("the Google map could not be started", e),
    );
  };

  const onChoice = () => {
    const s = spotOf(select?.value);
    if (!mode) {
      showCard(s);
      return start();
    }
    if (mode === "fallback") showCard(s);
    else focusSpot(s);
  };
  select?.addEventListener("change", onChoice);
  // The form clears itself after a successful send: back to the overview, no card.
  select?.form?.addEventListener("reset", () => setTimeout(onChoice));

  // Lazy: Google loads only once the map box is near the screen, and never before the page's own load event (then in an
  // idle slot), so the API script stays off the critical path. A hospital choice starts it at once (onChoice above).
  const whenIdle = (f: () => void) => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o: { timeout: number }) => void;
    };
    if (w.requestIdleCallback) w.requestIdleCallback(f, { timeout: 2000 });
    else setTimeout(f, 200);
  };
  const afterLoad = (f: () => void) =>
    document.readyState === "complete"
      ? f()
      : window.addEventListener("load", f, { once: true });
  const startLazily = () => afterLoad(() => whenIdle(start));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        startLazily();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(canvas.parentElement!);
  } else startLazily();
}
