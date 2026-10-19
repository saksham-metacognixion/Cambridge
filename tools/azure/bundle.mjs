// Bundles the Azure App Service server: tools/azure/server.ts -> dist-server/server.mjs (gitignored). One self-contained
// ESM file with no npm dependencies, so the deployment is dist/ + dist-server/ and App Service installs nothing.
// Run after `npm run build` (npm run build:azure does both).
import { build } from 'esbuild';

await build({
  entryPoints: ['tools/azure/server.ts'],
  outfile: 'dist-server/server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // functions/_lib/smtp.ts loads node:net / node:tls (or cloudflare:sockets) by a variable specifier: left as is.
  logOverride: { 'unsupported-dynamic-import': 'silent' },
  logLevel: 'warning',
});
console.log('dist-server/server.mjs bundled');
