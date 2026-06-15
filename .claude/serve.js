// Minimal static server for standalone/ (preview verification)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'standalone');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css' };
http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, path.normalize(p));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8765, '127.0.0.1', () => console.log('serving on 8765'));
