// Bundles the dashboard: tools/admin/server.ts -> dist-admin/admin-server.mjs (one self-contained ESM file, no
// node_modules; the schemas pull in zod from astro) and the UI, tools/admin/ui/app.tsx (preact) -> dist-admin/ui/app.js +
// app.css + index.html + logo.svg + favicon.svg, which the server serves at /admin. Run by `npm run admin` and the `cambridge-admin` unit.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

await build({
  entryPoints: ['tools/admin/server.ts'],
  outfile: 'dist-admin/admin-server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // sharp (image uploads) is native: loaded from the checkout's node_modules at run time (tools/admin/server.ts sharp()).
  external: ['sharp'],
  logLevel: 'warning',
});
await build({
  entryPoints: ['tools/admin/ui/app.tsx'],
  outfile: 'dist-admin/ui/app.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  jsx: 'automatic',
  jsxImportSource: 'preact',
  logLevel: 'warning',
});
mkdirSync('dist-admin/ui', { recursive: true });
// logo.svg / favicon.svg: copies of src/assets/header/logo.svg and public/favicon.svg, so the bundle needs no site files (bug 258)
for (const f of ['index.html', 'app.css', 'logo.svg', 'favicon.svg']) copyFileSync(`tools/admin/ui/${f}`, `dist-admin/ui/${f}`);
console.log('dist-admin/admin-server.mjs + ui/ bundled');
