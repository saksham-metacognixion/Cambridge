/**
 * Bugs 234-237 (19 Oct 2026): re-matte a banner cut-out from the client's 2880x1370 composite onto the EXISTING cut-out's pixel
 * grid (same size, scale and placement, so src/data/banner-art.json is untouched).
 *
 * client_cutout.py keys by a colour threshold, which leaves a stepped / jagged outline (noise around the threshold, bites where a
 * pill stroke meets the figure) and keeps the soft edge pixels with the backdrop colour in them (a pale or pill-coloured fringe).
 * Here its hard key K (composite px) only seeds an edge band (D px either side); in the band each px is matted:
 *   F = the cloth colour (sure-foreground px nearby), B = the backdrop behind it: the gradient model, or, only where a pill stroke
 *   can be behind it (the rendered pill mask + 3 px), the best of the local sure-background samples (row, column, window);
 *   alpha = projection of C on the B -> F line; colour = C un-blended from B (no fringe).
 * Where cloth and backdrop are too alike (white coat / grey sweater on the pale gradient, |F - B| < 30..60) or the px is off the
 * B-F line (a dark rim), the key decides, with level-set smoothing (Gaussian sigma 2 px, re-thresholded at 0.5: the outline is
 * straightened, the edge stays ~1 px sharp). Partial alpha is kept only within 1.5 px of the 0.5 contour (fabric texture on
 * low-contrast cloth otherwise reads as part backdrop); holes < 150 px in it are filled.
 * Per banner (manifest): `pockets` = seeds (cut px) of genuine gaps the key kept opaque (flooded over gradient / stroke px within
 * pocketR), `edgeZones` = boxes (cut px) whose start-side outline is smoothed along its length (sigma rows, shift <= ~1 px),
 * `maxRow` = composite rows from here down are backdrop. Then specks off the figure go and the result is resampled (premultiplied
 * Lanczos-3) onto the grid; output islands < 20 px are cleared.
 *
 *   node tools/banners/pillmask.mjs /tmp/pillmask.png
 *   python3 -I <client_cutout.py with the hard key saved: see docs/bugs-234-237.md> "<composite.png>" /tmp/pillmask.png /tmp/cc.png
 *   node tools/banners/rematte.cjs tools/banners/rematte-234-237.json <key> "<composite.png>" /tmp/cc_hard.png /tmp/pillmask.png /tmp/out.png
 *   -> lossless WebP via sharp
 */
const fs = require('fs');
const sharp = require('sharp');
const man = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cfg = process.argv.length > 4
  ? { ...man[process.argv[3]], comp: process.argv[4], hard: process.argv[5], pills: process.argv[6], out: process.argv[7] }
  : man;
const _CORES = [[1, 65, 90], [34, 180, 116], [3, 189, 251]];  // stroke colours, as client_cutout.py
const PILL_COLOURS = []; for (const c of _CORES.slice(1)) for (let k = 0; k <= 6; k++) PILL_COLOURS.push(_CORES[0].map((a, j) => Math.round(a + k / 6 * (c[j] - a))));

(async () => {
  const comp = await sharp(cfg.comp).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = comp.info.width, H = comp.info.height, C = comp.data;
  const hard = await sharp(cfg.hard).greyscale().raw().toBuffer();
  const N = W * H;
  const D = cfg.D ?? 4;
  const K = new Uint8Array(N);
  for (let i = 0; i < N; i++) K[i] = hard[i] > 127 ? 1 : 0;
  if (cfg.maxRow) for (let y = cfg.maxRow; y < H; y++) for (let x = 0; x < W; x++) K[y * W + x] = 0;

  // chamfer distance to the other class, in px (mask M, default K)
  function dist(inside, M = K) {
    const d = new Float32Array(N), INF = 1e9;
    for (let i = 0; i < N; i++) d[i] = (M[i] === inside) ? INF : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!d[i]) continue; let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + 1.414); if (x < W - 1) v = Math.min(v, d[i - W + 1] + 1.414); }
      d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; if (!d[i]) continue; let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < H - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + 1.414); if (x > 0) v = Math.min(v, d[i + W - 1] + 1.414); }
      d[i] = v;
    }
    return d;
  }
  // the key bites into the figure where a pill stroke meets it (the flood follows stroke-coloured edge px): close K
  // (radius cfg.close) only inside strips around the strokes; the matte below then finds the true edge there
  const g = cfg.grid; g.nsx = g.nsx ?? g.ns; g.nsy = g.nsy ?? g.ns;
  const GL = [], GR = [];   // gradient model: per-row colour at the left / right frame edge, ramped across (client_cutout.py)
  for (let y = 0; y < H; y++) { const l = [0, 0, 0], r = [0, 0, 0];
    for (let x = 8; x < 40; x++) for (let c = 0; c < 3; c++) { l[c] += C[(y * W + x) * 3 + c] / 32; r[c] += C[(y * W + W - 1 - x) * 3 + c] / 32; }
    GL.push(l); GR.push(r); }
  const grad = (x, y) => { const t = x / W; return [0, 1, 2].map(c => GL[y][c] * (1 - t) + GR[y][c] * t); };
  const fillM = new Uint8Array(N), pocketM = new Uint8Array(N);
  if (cfg.pills) {
    const pm = await sharp(cfg.pills).ensureAlpha().extractChannel(3).raw().toBuffer();
    const P0 = new Uint8Array(N); for (let i = 0; i < N; i++) P0[i] = pm[i] > 40 ? 1 : 0;
    const dP = dist(0, P0);                                    // distance to the nearest stroke px
    const rc = cfg.close ?? 6;
    const dil = new Uint8Array(N), d0 = dist(0); for (let i = 0; i < N; i++) dil[i] = (K[i] || d0[i] <= rc) ? 1 : 0;
    const dE = dist(1, dil); let filled = 0;                   // erode the dilation: distance to outside of dil
    for (let i = 0; i < N; i++) if (!K[i] && dil[i] && dE[i] > rc && dP[i] <= rc + 2) { K[i] = 1; fillM[i] = 1; filled++; }
    console.log('pill-strip closing filled', filled);
  }
  // genuine gaps the key kept opaque (an enclosed pocket that failed its size/shade test): flood from a seed (cut px) over
  // px within cfg.pocketTol of the gradient model (per-row edge colours, ramped) or on a pill stroke; they become background
  if (cfg.pockets) {
    const pm = await sharp(cfg.pills).ensureAlpha().extractChannel(3).raw().toBuffer();
    const L = [], R = [];
    for (let y = 0; y < H; y++) { const l = [0, 0, 0], r = [0, 0, 0];
      for (let x = 8; x < 40; x++) for (let c = 0; c < 3; c++) { l[c] += C[(y * W + x) * 3 + c] / 32; r[c] += C[(y * W + W - 1 - x) * 3 + c] / 32; }
      L.push(l); R.push(r); }
    const tol = cfg.pocketTol ?? 10;
    for (const [sx, sy, sr, loose] of cfg.pockets) {
      const x = Math.round(g.x0 + sx / g.nsx), y = Math.round(g.y0 + sy / g.nsy);
      const ok = (i) => { const xx = i % W, yy = (i / W) | 0, t = xx / W; let m = 0;
        for (let c = 0; c < 3; c++) m = Math.max(m, Math.abs(C[i * 3 + c] - (L[yy][c] * (1 - t) + R[yy][c] * t)));
        if (m <= tol) return true;
        if (pm[i] <= 40) return false;
        // on the stroke mask: only px on a bg -> stroke-colour line (client_cutout.py PILL_COLOURS test, residual <= 14)
        const q = [0, 1, 2].map(c => L[yy][c] * (1 - t) + R[yy][c] * t), u = [0, 1, 2].map(c => C[i * 3 + c] - q[c]);
        for (const P of PILL_COLOURS) { const v = [P[0] - q[0], P[1] - q[1], P[2] - q[2]];
          const tt = Math.max(0, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (v[0] * v[0] + v[1] * v[1] + v[2] * v[2])));
          if ((loose || tt >= 0.6) && Math.max(Math.abs(u[0] - tt * v[0]), Math.abs(u[1] - tt * v[1]), Math.abs(u[2] - tt * v[2])) <= 10) return true; }
        return false; };
      const st = [y * W + x], seen = new Uint8Array(N); let n = 0; const cap = cfg.pocketMax ?? 20000, R2 = (sr ?? cfg.pocketR ?? 60) ** 2;
      if (!ok(st[0])) { console.log('pocket seed not bg-like', sx, sy); continue; }
      seen[st[0]] = 1;
      while (st.length && n < cap) { const i = st.pop(); K[i] = 0; fillM[i] = 0; pocketM[i] = 1; n++; const xx = i % W;
        for (const j of [xx > 0 ? i - 1 : -1, xx < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !seen[j] && ok(j) && ((j % W - x) ** 2 + (((j / W) | 0) - y) ** 2) <= R2) { seen[j] = 1; st.push(j); } }
      if (n >= cap) console.log('POCKET CAP HIT');
      console.log('pocket', sx, sy, 'px', n);
    }
  }
  // where a stroke can be behind a px: the rendered pill mask, dilated 3 px (render tolerance)
  const pillNear = new Uint8Array(N);
  if (cfg.pills) { const pm2 = await sharp(cfg.pills).ensureAlpha().extractChannel(3).raw().toBuffer();
    const P1 = new Uint8Array(N); for (let i = 0; i < N; i++) P1[i] = pm2[i] > 40 ? 1 : 0;
    const dq = dist(0, P1); for (let i = 0; i < N; i++) pillNear[i] = dq[i] <= 3 ? 1 : 0; }
  const dIn = dist(1), dOut = dist(0);
  const sureF = (i) => K[i] && dIn[i] > D && !fillM[i];
  const sureB = (i) => !K[i] && dOut[i] > D;

  // soft key: K blurred (sigma 1.2) and re-steepened, ~1.5 px transition along a smoothed contour
  function gauss(src, sigma) {
    const r = Math.ceil(sigma * 3), k = []; let s = 0;
    for (let t = -r; t <= r; t++) { const v = Math.exp(-t * t / (2 * sigma * sigma)); k.push(v); s += v; }
    for (let t = 0; t < k.length; t++) k[t] /= s;
    const tmp = new Float32Array(N), out = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = 0; for (let t = -r; t <= r; t++) { const xx = Math.min(W - 1, Math.max(0, x + t)); v += src[y * W + xx] * k[t + r]; }
      tmp[y * W + x] = v;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = 0; for (let t = -r; t <= r; t++) { const yy = Math.min(H - 1, Math.max(0, y + t)); v += tmp[yy * W + x] * k[t + r]; }
      out[y * W + x] = v;
    }
    return out;
  }
  const Kf = new Float32Array(N); for (let i = 0; i < N; i++) Kf[i] = K[i];
  const Kb = gauss(Kf, 1.2);
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

  const A = new Float32Array(N), O = new Float32Array(N * 3); // alpha, straight colour
  const Fx = new Float32Array(N * 3), hasF = new Uint8Array(N), keyW = new Float32Array(N);  // keyW: share of the key in A
  let nBand = 0, nMat = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    O[i * 3] = C[i * 3]; O[i * 3 + 1] = C[i * 3 + 1]; O[i * 3 + 2] = C[i * 3 + 2];
    const band = (K[i] && dIn[i] <= D) || (!K[i] && dOut[i] <= D) || fillM[i];
    if (!band) { A[i] = K[i]; continue; }
    nBand++;
    // background: sure-bg px in a window, weighted 1 / (dx^2 + (4 dy)^2): at a vertical edge the same row wins (pill strokes
    // are horizontal, so a stroke row gets the stroke colour), at a flat horizontal edge the px just above / below win
    let bs = [0, 0, 0], bw = 0;
    for (let dy = -10; dy <= 10; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -24; dx <= 24; dx++) { const xx = x + dx; if (xx < 0 || xx >= W || (!dx && !dy)) continue;
        const j = yy * W + xx; if (!sureB(j)) continue;
        const w = 1 / Math.pow(dx * dx + 16 * dy * dy, 1.5);
        bs[0] += C[j * 3] * w; bs[1] += C[j * 3 + 1] * w; bs[2] += C[j * 3 + 2] * w; bw += w; } }
    if (!bw) { A[i] = clamp01((Kb[i] - 0.5) * 2.2 + 0.5); keyW[i] = 1; continue; }
    const Bwin = [bs[0] / bw, bs[1] / bw, bs[2] / bw];
    // other candidates: nearest sure-bg along the row / the column, and the gradient model
    const cands = [Bwin, grad(x, y)];
    for (const [sx, sy] of [[1, 0], [0, 1]]) { const acc = [0, 0, 0]; let n = 0, wsum = 0;
      for (const dir of [-1, 1]) for (let t = 1; t <= 40; t++) { const xx = x + dir * sx * t, yy = y + dir * sy * t;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) break; const j = yy * W + xx;
        if (sureB(j)) { const w = 1 / t; for (let c = 0; c < 3; c++) acc[c] += C[j * 3 + c] * w; wsum += w; n++; break; } }
      if (n) cands.push(acc.map(v => v / wsum)); }
    let B = Bwin;
    if (!pillNear[i]) {   // no stroke can be behind: the gradient (or the local sample when it agrees with it)
      const G = grad(x, y); const agree = Math.max(...[0, 1, 2].map(c => Math.abs(Bwin[c] - G[c]))) <= 12;
      B = agree ? Bwin : G; cands.length = 0; cands.push(B);
    }
    // a closing fill that IS this row's background (gradient or the stroke running along a flat edge) stays background
    if (fillM[i] && Math.max(Math.abs(C[i * 3] - B[0]), Math.abs(C[i * 3 + 1] - B[1]), Math.abs(C[i * 3 + 2] - B[2])) <= (cfg.fillBgTol ?? 14)) { A[i] = 0; continue; }
    // foreground: sure-fg within r (1/d^2 weighted), widening; else high-contrast K px within 3
    let F = null;
    for (const r of [7, 14]) {
      let fs = [0, 0, 0], fw = 0;
      for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx < 0 || xx >= W) continue;
          const d2 = dx * dx + dy * dy; if (d2 > r * r) continue; const j = yy * W + xx;
          if (sureF(j)) { const w = 1 / d2; fs[0] += C[j * 3] * w; fs[1] += C[j * 3 + 1] * w; fs[2] += C[j * 3 + 2] * w; fw += w; } } }
      if (fw) { F = [fs[0] / fw, fs[1] / fw, fs[2] / fw]; break; }
    }
    if (!F) {
      let fs = [0, 0, 0], fw = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx;
        if (!K[j]) continue;
        const c = Math.hypot(C[j * 3] - B[0], C[j * 3 + 1] - B[1], C[j * 3 + 2] - B[2]);
        if (c > 40) { fs[0] += C[j * 3] * c; fs[1] += C[j * 3 + 1] * c; fs[2] += C[j * 3 + 2] * c; fw += c; }
      }
      if (fw) F = [fs[0] / fw, fs[1] / fw, fs[2] / fw];
    }
    const aKey = clamp01((Kb[i] - 0.5) * 2.2 + 0.5);
    if (!F) {
      if (Math.max(Math.abs(C[i * 3] - B[0]), Math.abs(C[i * 3 + 1] - B[1]), Math.abs(C[i * 3 + 2] - B[2])) <= (cfg.bgTol ?? 8)) { A[i] = 0; continue; }
      A[i] = aKey; keyW[i] = 1; continue; }
    { let best = 1e9;
      for (const Bc of cands) { const v = [F[0] - Bc[0], F[1] - Bc[1], F[2] - Bc[2]], u = [C[i * 3] - Bc[0], C[i * 3 + 1] - Bc[1], C[i * 3 + 2] - Bc[2]];
        const vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2] || 1, t = clamp01((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / vv);
        const r = Math.hypot(u[0] - t * v[0], u[1] - t * v[1], u[2] - t * v[2]); if (r < best - 0.5) { best = r; B = Bc; } } }
    // only where cloth and backdrop differ clearly (white coat on the pale gradient: the key decides)
    if (Math.hypot(F[0] - B[0], F[1] - B[1], F[2] - B[2]) >= 30 && Math.max(Math.abs(C[i * 3] - B[0]), Math.abs(C[i * 3 + 1] - B[1]), Math.abs(C[i * 3 + 2] - B[2])) <= (cfg.bgTol ?? 8)) { A[i] = 0; continue; }
    hasF[i] = 1; Fx[i * 3] = F[0]; Fx[i * 3 + 1] = F[1]; Fx[i * 3 + 2] = F[2];
    const v = [F[0] - B[0], F[1] - B[1], F[2] - B[2]], u = [C[i * 3] - B[0], C[i * 3 + 1] - B[1], C[i * 3 + 2] - B[2]];
    const vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2], con = Math.sqrt(vv);
    let aM = clamp01((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / vv);
    if (aM < 0.06) aM = 0; else if (aM > 0.94) aM = 1;
    // a px far off the B-F line (a rim darker than both cloth and backdrop) is not a B/F mix: the key decides there
    const tq = clamp01((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / vv);
    const res = Math.hypot(u[0] - tq * v[0], u[1] - tq * v[1], u[2] - tq * v[2]);
    const w = clamp01((con - 30) / 30) * clamp01((25 - res) / 15);   // contrast 30 -> key, 60 -> matte; residual 10 -> matte, 25 -> key
    const a = w * aM + (1 - w) * aKey; keyW[i] = 1 - w;
    A[i] = a; if (w > 0) nMat++;
    if (a > 0) {
      for (let c = 0; c < 3; c++) {
        const U = Math.max(0, Math.min(255, B[c] + u[c] / Math.max(a, 0.05)));
        const col = a >= 0.6 ? U : F[c] + (U - F[c]) * (a / 0.6);
        O[i * 3 + c] = w * col + (1 - w) * C[i * 3 + c];
      }
    }
  }

  // key-driven edge px (low contrast: white cloth on the pale backdrop) follow the key's 1-2 px jitter: level-set smoothing
  // there (sigma 2 px, re-thresholded at 0.5 with a ~1 px transition); matted edges keep the client's own outline
  { const sg = cfg.keySmooth ?? 2, As = gauss(A, sg), m = sg * 2.5; let n = 0;
    for (let i = 0; i < N; i++) if (keyW[i] > 0.5) { A[i] = clamp01((As[i] - 0.5) * m + 0.5); n++; }
    console.log('key-smoothed px', n); }

  // partial alpha only across the edge: core = (A, lightly smoothed) >= 0.5 with small holes filled; deeper than TR px inside
  // the core -> 1, farther than TR outside -> 0 (fabric texture on low-contrast cloth otherwise reads as part background)
  {
    const TR = cfg.transition ?? 1.5;
    const As = gauss(A, 0.8), core = new Uint8Array(N);
    for (let i = 0; i < N; i++) core[i] = As[i] >= 0.5 ? 1 : 0;
    const out = new Uint8Array(N), st = [];
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const i = y * W + x; if (!core[i] && !out[i]) { out[i] = 1; st.push(i); } }
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const i = y * W + x; if (!core[i] && !out[i]) { out[i] = 1; st.push(i); } }
    const flood = () => { while (st.length) { const i = st.pop(), x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !core[j] && !out[j]) { out[j] = 1; st.push(j); } } };
    flood();
    const seen = new Uint8Array(N); let holes = 0;
    for (let s0 = 0; s0 < N; s0++) {
      if (core[s0] || out[s0] || seen[s0]) continue;
      const comp = [s0]; seen[s0] = 1;
      for (let k = 0; k < comp.length; k++) { const i = comp[k], x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !core[j] && !seen[j]) { seen[j] = 1; comp.push(j); } }
      if (comp.length < (cfg.holeMax ?? 150) && !comp.some(i => pocketM[i])) { for (const i of comp) { core[i] = 1; if (A[i] < 1) { A[i] = 1; O[i * 3] = C[i * 3]; O[i * 3 + 1] = C[i * 3 + 1]; O[i * 3 + 2] = C[i * 3 + 2]; } } holes++; }
    }
    const dcIn = dist(1, core), dcOut = dist(0, core); let forced = 0;
    for (let i = 0; i < N; i++) {
      if (core[i] && dcIn[i] > TR && A[i] < 1) { A[i] = 1; O[i * 3] = C[i * 3]; O[i * 3 + 1] = C[i * 3 + 1]; O[i * 3 + 2] = C[i * 3 + 2]; forced++; }
      else if (!core[i] && dcOut[i] > TR && A[i] > 0) { A[i] = 0; forced++; }
    }
    console.log('core holes filled', holes, 'px forced', forced);
  }

  for (let i = 0; i < N; i++) if (pocketM[i]) A[i] = Math.min(A[i], 0);

  const toComp = (bx) => [Math.floor(g.x0 + bx[0] / g.nsx), Math.floor(g.y0 + bx[1] / g.nsy), Math.ceil(g.x0 + bx[2] / g.nsx), Math.ceil(g.y0 + bx[3] / g.nsy)];
  // edge zones (Bug 234 abaya): the start-side edge x(y) in the box (first 0.5 crossing scanning rightwards), smoothed along
  // the edge (Gaussian, sigma rows, tapered to 0 over 2 sigma at the box ends); each row's edge profile (+-8 px) is shifted
  // by the difference, so the outline becomes a smooth curve with the edge's own softness (no blur of the edge itself)
  for (const z of cfg.edgeZones || []) {
    const [zx0, zy0, zx1, zy1] = toComp(z.box), sg = z.sigma, e = [];
    for (let y = zy0; y < zy1; y++) { let v = null;
      for (let x = zx0 + 1; x < zx1; x++) { const a1 = A[y * W + x]; if (a1 >= 0.5) { const a0 = A[y * W + x - 1]; v = a0 < 0.5 ? x - 1 + (0.5 - a0) / (a1 - a0) : null; break; } }
      e.push(v); }
    let maxd = 0;
    const Ac = A.slice(), Oc = O.slice();
    for (let k = 0; k < e.length; k++) {
      if (e[k] == null) continue;
      let sw = 0, sv = 0;
      for (let t = -3 * sg; t <= 3 * sg; t++) { const q = k + t; if (q < 0 || q >= e.length || e[q] == null) continue; const w = Math.exp(-t * t / (2 * sg * sg)); sw += w; sv += w * e[q]; }
      const taper = clamp01(Math.min(k, e.length - 1 - k) / (2 * sg));
      const dx = (sv / sw - e[k]) * taper; maxd = Math.max(maxd, Math.abs(dx));
      const y = zy0 + k, ex = e[k];
      for (let x = Math.floor(ex - 8); x <= Math.ceil(ex + 8); x++) {
        const wt = x <= ex + 2 ? 1 : clamp01((ex + 8 - x) / 6), src = x - dx * wt, x0 = Math.floor(src), f = src - x0;
        const i = y * W + x, i0 = y * W + x0, i1 = i0 + 1;
        A[i] = Ac[i0] * (1 - f) + Ac[i1] * f;
        for (let c = 0; c < 3; c++) {   // colour: from the opaque side when only one side carries it
          const c0 = Oc[i0 * 3 + c], c1 = Oc[i1 * 3 + c], w0 = Ac[i0] * (1 - f), w1 = Ac[i1] * f;
          O[i * 3 + c] = (w0 + w1) > 1e-4 ? (c0 * w0 + c1 * w1) / (w0 + w1) : Oc[i * 3 + c];
        }
      }
    }
    console.log('edge zone', z.box.join(','), 'rows', e.length, 'max shift px', maxd.toFixed(2));
  }
  for (const e of cfg.erase || []) {
    const [ex0, ey0, ex1, ey1] = toComp(e);
    for (let y = ey0; y < ey1; y++) for (let x = ex0; x < ex1; x++) A[y * W + x] = 0;
  }

  // drop specks: 8-connected pieces of alpha > 0.02 that do not touch the bottom row of the grid box
  {
    const yb = Math.min(H - 1, Math.floor(g.y0 + g.h / g.nsy) - 1), keep = new Uint8Array(N), st = [];
    const lim = cfg.maxRow ? cfg.maxRow - 1 : yb;
    for (let x = 0; x < W; x++) { const i = lim * W + x; if (A[i] > 0.02 && !keep[i]) { keep[i] = 1; st.push(i); } }
    while (st.length) { const i = st.pop(), x = i % W, y = (i / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (A[j] > 0.02 && !keep[j]) { keep[j] = 1; st.push(j); } } }
    let dropped = 0; for (let i = 0; i < N; i++) if (A[i] > 0 && !keep[i]) { A[i] = 0; dropped++; }
    console.log('speck px dropped', dropped);
  }

  // resample (premultiplied, Lanczos-3 scaled to the 1/ns footprint) onto the grid
  const ow = g.w, oh = g.h;
  const lz = (t) => { t = Math.abs(t); if (t < 1e-6) return 1; if (t >= 3) return 0; const p = Math.PI * t; return 3 * Math.sin(p) * Math.sin(p / 3) / (p * p); };
  function weights(n, o0, s) { const sup = 3 * s;
    const ws = [];
    for (let i = 0; i < n; i++) {
      const c = o0 + (i + 0.5) * s; const a = Math.floor(c - sup), b = Math.ceil(c + sup); const w = []; let tot = 0;
      for (let x = a; x <= b; x++) { const v = lz((x + 0.5 - c) / s); if (v) { w.push([x, v]); tot += v; } }
      ws.push(w.map(([x, v]) => [x, v / tot]));
    }
    return ws;
  }
  const wx = weights(ow, g.x0, 1 / g.nsx), wy = weights(oh, g.y0, 1 / g.nsy);
  const P = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const a = A[i]; P[i * 4] = O[i * 3] * a; P[i * 4 + 1] = O[i * 3 + 1] * a; P[i * 4 + 2] = O[i * 3 + 2] * a; P[i * 4 + 3] = a; }
  const T = new Float32Array(ow * H * 4);
  for (let y = 0; y < H; y++) for (let i = 0; i < ow; i++) { const o = (y * ow + i) * 4;
    for (const [x0_, v] of wx[i]) { const x = Math.min(W - 1, Math.max(0, x0_)); const p = (y * W + x) * 4; T[o] += P[p] * v; T[o + 1] += P[p + 1] * v; T[o + 2] += P[p + 2] * v; T[o + 3] += P[p + 3] * v; } }
  const out = Buffer.alloc(ow * oh * 4);
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const acc = [0, 0, 0, 0];
    for (const [y0_, v] of wy[j]) { const y = Math.min(H - 1, Math.max(0, y0_)); const p = (y * ow + i) * 4; acc[0] += T[p] * v; acc[1] += T[p + 1] * v; acc[2] += T[p + 2] * v; acc[3] += T[p + 3] * v; }
    let a = Math.max(0, Math.min(1, acc[3]));
    if (a < 1 / 255) a = 0;
    const o = (j * ow + i) * 4;
    out[o + 3] = Math.round(a * 255);
    for (let c = 0; c < 3; c++) out[o + c] = a ? Math.max(0, Math.min(255, Math.round(acc[c] / acc[3]))) : 0;
  }
  // last: detached islands under 20 px in the output (resampling crumbs) go; real detached parts (wheel rims) are larger
  { const seen = new Uint8Array(ow * oh); let gone = 0;
    for (let s0 = 0; s0 < ow * oh; s0++) { if (seen[s0] || out[s0 * 4 + 3] <= 8) continue; const comp = [s0]; seen[s0] = 1;
      for (let k = 0; k < comp.length; k++) { const i = comp[k], x = i % ow, y = (i / ow) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= ow || yy >= oh) continue;
          const j = yy * ow + xx; if (!seen[j] && out[j * 4 + 3] > 8) { seen[j] = 1; comp.push(j); } } }
      if (comp.length < 20) for (const i of comp) { out.fill(0, i * 4, i * 4 + 4); gone++; } }
    console.log('output crumbs cleared px', gone); }
  await sharp(out, { raw: { width: ow, height: oh, channels: 4 } }).png().toFile(cfg.out);
  console.log(JSON.stringify({ out: cfg.out, band: nBand, matted: nMat }));
})();
