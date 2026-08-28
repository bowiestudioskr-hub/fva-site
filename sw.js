/**
 * 피바아카데미 화면들 — 새 판이 바로 뜨게 하는 서비스워커
 *
 * ⚠ 범위가 사이트 전체(/)다. 홈 화면 앱 세 개(유입현황·앰버서더·501)와
 *   광고 운영 화면(worklist·adlog)이 이걸 함께 쓴다.
 *   ⚠ 등록은 **그 화면들에서만** 한다 — 손님이 보는 소개 페이지는 등록하지 않는다.
 *     (등록한 적 없는 브라우저는 이 파일을 받지도 않는다.)
 *
 * ⚠ 왜 필요했나 — GitHub Pages 가 HTML 에 `cache-control: max-age=600` 을 박는다.
 *   그래서 배포하고 10분 동안 폰이 옛 화면을 그대로 썼다.
 *   홈 화면 앱을 지웠다 다시 깔아야 반영되던 이유가 이것이다(2026-08-28).
 *   서버 헤더는 못 바꾸므로, 여기서 `cache: 'no-store'` 로 **캐시를 건너뛰고** 받아온다.
 *
 * ⚠ 미리 담아두지(precache) 않는다. 담아두면 오히려 옛 판에 갇힌다 —
 *   고치려던 문제를 더 크게 만드는 길이다. 늘 그물에서 먼저 받고,
 *   **못 받았을 때만** 마지막으로 받아둔 것을 내준다(비행기·지하철).
 *
 * ⚠ 문서(HTML·매니페스트)만 다룬다. 이미지·아이콘은 손대지 않는다 —
 *   그것들은 주소에 ?v= 가 붙어 있어 캐시가 오히려 이득이다.
 */
const 곳간 = 'fva-doc-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/* 화면 쪽에서 「지금 당장 새 판 확인해」라고 부를 수 있게 */
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) return;     // 남의 집은 건드리지 않는다

  const 문서 = req.mode === 'navigate'
            || req.destination === 'document'
            || u.pathname.endsWith('/')
            || /\.(html|webmanifest)$/.test(u.pathname)
            || u.pathname.endsWith('/ver.txt');
  if (!문서) return;

  e.respondWith((async () => {
    try {
      /* ⚠ fetch(req, …) 에 그대로 넘기면 안 된다. 문서 요청은 mode 가 'navigate' 인데
           사양이 navigate 요청을 fetch() 에 넣는 걸 금지한다 — TypeError 로 죽는다.
           그래서 **주소로 새 요청을 만들어** 보낸다. (2026-08-28 실제로 여기서 깨졌다) */
      const res = await fetch(req.url, {
        cache: 'no-store', credentials: 'same-origin', redirect: 'follow',
      });
      if (res && res.ok) {
        const c = await caches.open(곳간);
        c.put(req.url, res.clone()).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req.url);
      if (hit) return hit;
      throw err;
    }
  })());
});
