// Bundles the dashboard's admin service: tools/admin/server.ts -> dist-admin/admin-server.mjs (gitignored), one
// self-contained ESM file with no node_modules (the schemas pull in zod from astro). Run by the `cambridge-admin` unit.
import { build } from 'esbuild';

await build({
  entryPoints: ['tools/admin/server.ts'],
  outfile: 'dist-admin/admin-server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  logLevel: 'warning',
});
console.log('dist-admin/admin-server.mjs bundled');
