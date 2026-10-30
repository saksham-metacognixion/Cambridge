// Bundles the self-hosted form server: tools/docker/forms-server.ts -> dist-server/forms-server.mjs (gitignored), one
// self-contained ESM file with no node_modules, run by the `forms` image of the Dockerfile.
import { build } from 'esbuild';

await build({
  entryPoints: ['tools/docker/forms-server.ts'],
  outfile: 'dist-server/forms-server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // functions/_lib/smtp.ts loads node:net / node:tls (or cloudflare:sockets) by a variable specifier: left as is.
  logOverride: { 'unsupported-dynamic-import': 'silent' },
  logLevel: 'warning',
});
console.log('dist-server/forms-server.mjs bundled');
