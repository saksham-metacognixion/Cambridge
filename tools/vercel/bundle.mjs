// Bundles the Vercel staging form function: tools/vercel/api-forms.ts -> api/forms/[form].js (gitignored).
// Vercel's Node builder compiles each file on its own, so the shared handler's extension-less imports and JSON imports
// (fine in the Cloudflare / esbuild bundles) do not resolve there; one self-contained ESM file does. Part of the Vercel
// build command (tools/vercel-json.mjs), run after `npm run build`.
import { build } from 'esbuild';

await build({
  entryPoints: ['tools/vercel/api-forms.ts'],
  outfile: 'api/forms/[form].js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  // functions/_lib/smtp.ts loads node:net / node:tls (or cloudflare:sockets) by a variable specifier: left as is.
  logOverride: { 'unsupported-dynamic-import': 'silent' },
  logLevel: 'warning',
});
console.log('api/forms/[form].js bundled');
