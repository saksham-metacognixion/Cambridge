// Prints the ADMIN_PASSWORD_HASH for a password (tools/admin/server.ts checks it with scrypt; the password itself is never
// stored). Run: node tools/admin/hash-password.mjs 'the password'   -> paste the line into .env / /etc/cambridge-admin.env
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('usage: node tools/admin/hash-password.mjs <password of at least 12 characters>');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`);
