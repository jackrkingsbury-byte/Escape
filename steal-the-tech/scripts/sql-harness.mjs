// Shared helpers for the SQL test suites. Every RPC is called exactly the way
// Supabase's API layer calls it: inside a transaction, as role `authenticated`,
// with the caller's user id in request.jwt.claim.sub.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..');

export function migrationFiles() {
  const dir = join(ROOT, 'supabase', 'migrations');
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(dir, f));
}

export function loadSql(withShim = true) {
  const files = [...(withShim ? [join(ROOT, 'supabase', 'local', 'shim.sql')] : []), ...migrationFiles()];
  return files.map((f) => ({ file: f, sql: readFileSync(f, 'utf8') }));
}

let passed = 0;
let failed = 0;
const failures = [];

export async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push([name, e]);
    console.log(`  ✗ ${name}\n      ${e && e.message ? e.message : e}`);
  }
}

export function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    for (const [n, e] of failures) console.log(`\n--- ${n}\n${e && e.stack ? e.stack : e}`);
  }
  return failed === 0;
}

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}
export function eq(a, b, msg = '') {
  if (a !== b) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
export async function rejects(promise, pattern, msg = '') {
  try {
    await promise;
  } catch (e) {
    if (pattern && !String(e.message).match(pattern)) {
      throw new Error(`${msg} rejected with unexpected error: ${e.message}`);
    }
    return e;
  }
  throw new Error(`${msg} expected rejection matching ${pattern}`);
}
