#!/usr/bin/env node
/**
 * 로컬 미리보기 서버. 캐시를 끄기 때문에 새로고침하면 항상 최신이 보인다.
 * 127.0.0.1 에만 바인딩되지만, 브라우저를 통한 우회 접근을 막기 위해
 * Host 헤더 검사와 경로 탈출 방지를 함께 건다.
 */
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = fs.realpathSync(__dirname);
const PORT = 8765;
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml',
  '.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};

// DNS 리바인딩 방지 — 외부 도메인이 127.0.0.1 로 해석돼 들어오는 요청을 거른다
// LAN=1 로 켜면 같은 와이파이의 폰에서도 볼 수 있다 (기본은 127.0.0.1 전용)
const LAN = process.env.LAN === '1';
const LAN_IP = LAN ? (require('os').networkInterfaces().en0 || [])
  .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address)[0] : null;
const ALLOWED_HOSTS = new Set([
  `127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`,
  ...(LAN_IP ? [`${LAN_IP}:${PORT}`] : []),
]);

const deny = (res, code, msg) => {
  res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8'});
  res.end(msg);
};

http.createServer((req, res) => {
  if (!ALLOWED_HOSTS.has(String(req.headers.host || '').toLowerCase())) {
    return deny(res, 403, 'forbidden host');
  }

  let p;
  try { p = decodeURIComponent(url.parse(req.url).pathname || '/'); }
  catch { return deny(res, 400, 'bad request'); }
  if (p.endsWith('/')) p += 'index.html';

  // 경로 탈출 방지: 정규화 후 ROOT 하위인지 확인 (구분자까지 비교)
  const target = path.resolve(ROOT, '.' + path.posix.normalize(p));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    return deny(res, 403, 'forbidden path');
  }

  let real;
  try { real = fs.realpathSync(target); }            // 심볼릭 링크로 빠져나가는 것도 차단
  catch { return deny(res, 404, '404'); }
  if (real !== ROOT && !real.startsWith(ROOT + path.sep)) {
    return deny(res, 403, 'forbidden link');
  }
  const st = fs.statSync(real);
  if (!st.isFile()) return deny(res, 404, '404');

  const head = {
    'Content-Type': TYPES[path.extname(real).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };

  /* iOS Safari 는 Range(206) 응답을 못 받으면 영상을 아예 재생하지 않는다.
     이게 없어서 폰에서만 영상이 안 나왔다. */
  const range = req.headers.range;
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m) {
    let start = m[1] === '' ? null : parseInt(m[1], 10);
    let end   = m[2] === '' ? null : parseInt(m[2], 10);
    if (start === null) {                       // bytes=-N : 끝에서 N 바이트
      start = Math.max(0, st.size - (end || 0));
      end = st.size - 1;
    } else if (end === null || end >= st.size) {
      end = st.size - 1;
    }
    if (start > end || start >= st.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
      return res.end();
    }
    head['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    head['Content-Length'] = end - start + 1;
    res.writeHead(206, head);
    return fs.createReadStream(real, { start, end }).pipe(res);
  }

  head['Content-Length'] = st.size;
  res.writeHead(200, head);
  fs.createReadStream(real).pipe(res);
}).listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`미리보기 http://127.0.0.1:${PORT}/  (캐시 없음)`);
  if (LAN_IP) console.log(`폰에서   http://${LAN_IP}:${PORT}/   (같은 와이파이)`);
});
