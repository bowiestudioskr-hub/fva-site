#!/usr/bin/env node
/** 미리보기 서버. 캐시를 끄기 때문에 새로고침하면 항상 최신이 보인다. */
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml',
  '.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(__dirname, p);
  if (!f.startsWith(__dirname) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('404');
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  });
  fs.createReadStream(f).pipe(res);
}).listen(8765, '127.0.0.1', ()=>console.log('미리보기 http://127.0.0.1:8765/  (캐시 없음)'));
