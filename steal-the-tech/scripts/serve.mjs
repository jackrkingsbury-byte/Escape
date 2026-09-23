// Tiny static server for the built game (./play). Used by the E2E test and for
// local previews:  node scripts/serve.mjs [port]
// Also serves PGlite from node_modules at /pglite/* so offline mode works without
// internet access (set window.STT_CONFIG.pgliteUrl = '/pglite/index.js').
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const PLAY = join(here, '..', 'play');
const PGLITE = join(here, '..', 'node_modules', '@electric-sql', 'pglite', 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.gz': 'application/gzip',
};

export function serve(port = 4173, { localPglite = false } = {}) {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file;
    if (url.startsWith('/pglite/')) file = join(PGLITE, normalize(url.slice('/pglite/'.length)));
    else file = join(PLAY, normalize(url === '/' ? '/index.html' : url));
    if (!file.startsWith(PLAY) && !file.startsWith(PGLITE)) {
      res.writeHead(403).end();
      return;
    }
    if (localPglite && url === '/config.js') {
      res.writeHead(200, { 'content-type': TYPES['.js'] });
      res.end(`window.STT_CONFIG = { supabaseUrl: '', supabaseAnonKey: '', pgliteUrl: location.origin + '/pglite/index.js' };`);
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.argv[2] || 4173);
  serve(port, { localPglite: process.argv.includes('--local-pglite') }).then(() =>
    console.log(`Steal the Tech → http://localhost:${port}/`),
  );
}
