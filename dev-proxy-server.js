#!/usr/bin/env node
// Temporary same-origin dev server for sharing flowforge-site over a tunnel.
// Serves static files AND reverse-proxies /webhook/* to local n8n (5678),
// mirroring the production Caddy setup (see flowforge-site/deploy/Caddyfile)
// so the chatbot widget's relative webhookUrl ("/webhook/...") resolves
// without needing CORS or a second tunnel.

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;
const N8N_TARGET = process.env.N8N_TARGET || 'http://localhost:5678';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res) {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, reqPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyToN8n(req, res) {
  const target = new URL(N8N_TARGET + req.url);
  const upstreamReq = http.request(target, { method: req.method, headers: req.headers }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstreamReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upstream n8n unreachable', detail: err.message }));
  });
  req.pipe(upstreamReq);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/webhook/')) {
    proxyToN8n(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`flowforge-site dev proxy on http://localhost:${PORT} (webhook -> ${N8N_TARGET})`);
});
