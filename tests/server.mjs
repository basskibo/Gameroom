// Tiny static server for the tests: serves the repo root like Vercel does (trailing slash, index.html).
// No dependencies on purpose. PORT=4173 by default.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  let stat;
  try { stat = statSync(file); } catch { res.writeHead(404).end('not found'); return; }
  let target = file;
  if (stat.isDirectory()) {
    if (!path.endsWith('/')) { res.writeHead(308, { Location: path + '/' + url.search }).end(); return; }
    target = join(file, 'index.html');
    try { stat = statSync(target); } catch { res.writeHead(404).end('not found'); return; }
  }
  res.writeHead(200, { 'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
  createReadStream(target).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`gameroom tests: serving ${root} on http://127.0.0.1:${port}`));
