/**
 * fva.co.kr 전면 점검기.
 *
 *   node tools/audit.mjs            사이트만
 *   node tools/audit.mjs --ads      광고 계정까지 (네이버 API + 구글애즈 화면)
 *   node tools/audit.mjs --local    배포본 대신 로컬 파일로
 *
 * 문제가 하나라도 있으면 종료코드 1 로 끝난다. 그래서 「없을 때까지」 돌릴 수 있다.
 *   until node tools/audit.mjs --ads; do ...고친다...; done
 *
 * ⚠ 왜 헤드리스 브라우저까지 쓰나
 *   HTML 만 봐서는 자바스크립트가 죽었는지, 표가 안 그려졌는지, 모바일에서 가로로
 *   삐져나가는지 알 수 없다. 실제로 열어봐야 안다.
 *
 * ⚠ 광고 항목이 제일 중요하다. 페이지가 좀 못생긴 것보다 광고가 안 나가거나
 *   엉뚱한 데로 떨어지는 쪽이 훨씬 비싸다. 그래서 심각도를 따로 매긴다.
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = 'https://fva.co.kr';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const WANT_ADS = process.argv.includes('--ads');

const issues = [];
const add = (sev, area, msg, hint) => issues.push({ sev, area, msg, hint });
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 사람이 보는 공개 페이지와, 검색에서 빼야 하는 내부 화면을 나눠 둔다. */
const PUBLIC = ['', 'index.html', 'offline.html', 'online.html', 'curriculum.html',
  'works.html', 'reviews.html', 'privacy.html', 'news.html'];
const PRIVATE = ['adminmonitor.html', 'worklist.html', 'adlog.html'];

/* 광고가 실제로 떨어지는 자리. 여기가 깨지면 돈이 샌다. */
const LANDING = ['offline.html', 'online.html', 'curriculum.html', 'index.html'];

// ── 1. HTTP ──────────────────────────────────────────────
async function head(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    return { status: r.status, ct: r.headers.get('content-type') || '', text: r };
  } catch (e) { return { status: 0, ct: '', err: String(e.message || e) }; }
}

async function httpPass() {
  const pages = {};
  for (const p of [...PUBLIC, ...PRIVATE, 'robots.txt', 'sitemap.xml']) {
    const url = `${BASE}/${p}`;
    const r = await fetch(url, { headers: { 'User-Agent': UA } }).catch(e => null);
    if (!r || !r.ok) { add('심각', 'HTTP', `${p || '/'} 가 ${r ? r.status : '연결 실패'}`); continue; }
    pages[p] = await r.text();
  }

  // 사이트맵에 적힌 주소가 진짜 열리는지. 검색엔진이 여기를 보고 돈다.
  const sm = pages['sitemap.xml'] || '';
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!locs.length) add('심각', '노출', '사이트맵이 비어 있다');
  for (const l of locs) {
    const r = await head(l);
    if (r.status !== 200) add('심각', '노출', `사이트맵에 적힌 ${l} 가 ${r.status}`);
  }
  // 홈은 반드시 들어 있어야 한다
  if (!locs.some(l => /fva\.co\.kr\/?$/.test(l))) add('보통', '노출', '사이트맵에 홈(/)이 없다');
  // 내부 화면은 사이트맵에도 robots 에도 나오면 안 된다
  for (const p of PRIVATE) {
    if (sm.includes(p)) add('심각', '노출', `사이트맵에 내부 화면 ${p} 가 들어 있다`);
    if ((pages['robots.txt'] || '').includes(p))
      add('심각', '노출', `robots.txt 가 ${p} 를 언급한다 — 경로를 광고하는 셈이다`);
    if (!/<meta[^>]+noindex/i.test(pages[p] || ''))
      add('심각', '노출', `${p} 에 noindex 가 없다 — 검색에 뜬다`);
  }
  // 공개 페이지에 noindex 가 잘못 붙으면 검색에서 통째로 사라진다
  for (const p of PUBLIC) {
    if (/<meta[^>]+noindex/i.test(pages[p] || ''))
      add('심각', '노출', `${p || '/'} 에 noindex 가 붙어 있다 — 검색에서 사라진다`);
  }
  return pages;
}

// ── 2. 링크·자산 ───────────────────────────────────────────
async function linkPass(pages) {
  const targets = new Map();
  for (const [p, html] of Object.entries(pages)) {
    if (!html || p.endsWith('.txt') || p.endsWith('.xml')) continue;
    const found = [
      ...[...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]),
      ...[...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]),
    ];
    for (let u of found) {
      if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/.test(u)) continue;
      // 자바스크립트 안의 템플릿 조각이 href="..." 처럼 보인다. 주소가 아니다.
      if (/[+`${}]|\besc\(|\s\+\s/.test(u)) continue;
      u = u.split('#')[0].split('?')[0].replace(/^\//, '');
      if (!u) continue;
      if (!targets.has(u)) targets.set(u, new Set());
      targets.get(u).add(p || '/');
    }
  }
  for (const [u, from] of targets) {
    const r = await head(`${BASE}/${u}`);
    if (r.status !== 200) {
      // 클라우드플레어 이메일 난독화는 자바스크립트가 되돌린다. 404 여도 실제로는 멀쩡하다.
      if (u.startsWith('cdn-cgi/l/email-protection')) continue;
      add('심각', '링크', `${u} 가 ${r.status}`, `여기서 건다: ${[...from].join(', ')}`);
    }
  }
  return targets.size;
}

// ── 3. 브라우저 ────────────────────────────────────────────
/* 비콘은 페이지를 떠날 때 끊긴 것처럼 보인다. 실패가 아니다. */
const BEACON = /google-analytics|analytics\.google|googletagmanager|google\.com\/(ccm|rmkt|pagead)|doubleclick|facebook\.com\/tr|connect\.facebook|wcs\.naver|nlog\.naver|clarity\.ms|\.mp4$/i;

async function browser() {
  const PORT = 9377;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [`--remote-debugging-port=${PORT}`, '--headless=new', '--user-data-dir=/tmp/fva-audit',
      '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
  let ws, id = 0; const pend = new Map();
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; }
    catch { await sleep(400); }
  }
  const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  const handlers = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    handlers.forEach(h => h(m));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return {
    stop() { try { ws.close(); } catch {} chrome.kill(); },
    async open(url, { width = 1440, height = 1000, wait = 13000 } = {}) {
      const errs = [], net = [], req = {};
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const S = (m, p) => send(m, p, sessionId);
      const h = m => {
        if (m.sessionId !== sessionId) return;
        if (m.method === 'Runtime.exceptionThrown')
          errs.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
          errs.push('console: ' + (m.params.args || []).map(a => a.value ?? a.description).join(' ').slice(0, 140));
        if (m.method === 'Network.requestWillBeSent') req[m.params.requestId] = m.params.request.url;
        if (m.method === 'Network.loadingFailed') {
          const u = req[m.params.requestId] || '?';
          if (!BEACON.test(u)) net.push(`${m.params.errorText} ${u.slice(0, 90)}`);
        }
        if (m.method === 'Network.responseReceived' && m.params.response.status >= 400)
          net.push(`${m.params.response.status} ${m.params.response.url.slice(0, 90)}`);
      };
      handlers.push(h);
      await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable');
      await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await S('Page.navigate', { url });
      await sleep(wait);
      const probe = await S('Runtime.evaluate', {
        returnByValue: true, expression: `(() => {
        const q = s => document.querySelector(s);
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent);
        const wide = [...document.querySelectorAll('body *')]
          .filter(e => { const r = e.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 2 || r.left < -2)
                   && getComputedStyle(e).position !== 'fixed'; })
          .slice(0, 4).map(e => (e.tagName + '.' + String(e.className || '').split(' ')[0]).slice(0, 40));
        return {
          title: (document.title || '').trim(),
          desc: (q('meta[name=description]') || {}).content || '',
          canonical: (q('link[rel=canonical]') || {}).href || '',
          og: (q('meta[property="og:image"]') || {}).content || '',
          h1: [...document.querySelectorAll('h1')].length,
          // src 가 아예 없는 <img> 는 자바스크립트가 나중에 채우는 자리다(사진 확대창 등).
          // 그건 깨진 게 아니다. 주소가 있는데 안 뜨는 것만 잡는다.
          imgs: [...document.images]
                  .filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0)
                  .slice(0, 5).map(i => i.currentSrc || i.src),
          noalt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
          ld, text: (document.body.innerText || '').length,
          overflowX: document.documentElement.scrollWidth > innerWidth + 1,
          wide,
          ga: !!window.gtag, dataLayer: Array.isArray(window.dataLayer),
          tags: (document.documentElement.innerHTML.match(/G-[A-Z0-9]{8,}|AW-\\d{9,}/g) || [])
                  .filter((x, i, a) => a.indexOf(x) === i),
        };
      })()` });
      handlers.splice(handlers.indexOf(h), 1);
      await send('Target.closeTarget', { targetId });
      return { errs, net, ...(probe.result.value || {}) };
    },
  };
}

async function browserPass() {
  const B = await browser();
  try {
    for (const p of [...PUBLIC.filter(x => x !== ''), ...PRIVATE]) {
      const url = `${BASE}/${p}`;
      const r = await B.open(url, { width: 1440, height: 1200, wait: p === 'reviews.html' ? 17000 : 13000 });
      const tag = p;
      if (r.errs?.length) add('심각', '자바스크립트', `${tag}: ${r.errs[0]}`.slice(0, 200));
      for (const n of [...new Set(r.net || [])].slice(0, 3)) add('심각', '자산', `${tag}: ${n}`);
      if (!r.text || r.text < 300) add('심각', '화면', `${tag} 본문이 ${r.text}자 — 안 그려졌다`);
      if (r.imgs?.length) add('보통', '이미지', `${tag} 깨진 이미지 ${r.imgs.length}장: ${r.imgs[0]}`);
      for (const b of r.ld || []) {
        try { JSON.parse(b); } catch (e) { add('보통', '구조화데이터', `${tag}: ${String(e.message).slice(0, 60)}`); }
      }
      if (PUBLIC.includes(p)) {
        if (!r.title) add('보통', '노출', `${tag} 에 제목(title)이 없다`);
        if (!r.desc) add('보통', '노출', `${tag} 에 설명(description)이 없다`);
        if (!r.canonical) add('낮음', '노출', `${tag} 에 canonical 이 없다`);
        if (!r.og) add('낮음', '노출', `${tag} 에 og:image 가 없다`);
        if (r.h1 !== 1) add('낮음', '노출', `${tag} 의 h1 이 ${r.h1}개 (1개여야 한다)`);
      }
      // 광고가 떨어지는 자리에는 추적 태그가 반드시 있어야 한다. 없으면 전환을 못 센다.
      if (LANDING.includes(p)) {
        const t = r.tags || [];
        if (!t.some(x => x.startsWith('G-'))) add('심각', '광고', `${tag} 에 GA4 태그가 없다 — 유입을 못 센다`);
        if (!t.some(x => x.startsWith('AW-'))) add('심각', '광고', `${tag} 에 구글애즈 전환 태그가 없다`);
      }
      // 모바일 가로 넘침
      const m = await B.open(url, { width: 390, height: 844, wait: 11000 });
      if (m.overflowX) add('보통', '모바일', `${tag} 가 가로로 삐져나온다: ${(m.wide || []).join(', ')}`);
      if (m.errs?.length) add('심각', '자바스크립트', `${tag}(모바일): ${m.errs[0]}`.slice(0, 200));
    }
  } finally { B.stop(); }
}

// ── 4. 광고 ────────────────────────────────────────────────
async function adsPass() {
  // 네이버
  try {
    const api = await import(join(SITE, '..', '광고_네이버', 'api.mjs'));
    const camps = await api.get('/ncc/campaigns');
    const cmp = camps.find(c => c.name.includes('파워링크'));
    if (!cmp) { add('심각', '광고', '네이버 파워링크 캠페인을 못 찾았다'); }
    else {
      const bz = await api.get('/billing/bizmoney');
      const bal = Math.round(bz.bizmoney ?? bz.balance ?? 0);
      const days = cmp.dailyBudget ? bal / cmp.dailyBudget : 99;
      if (bal <= 0) add('심각', '광고', '네이버 비즈머니가 0원 — 광고가 안 나간다');
      else if (days < 2) add('심각', '광고', `네이버 잔액 ${bal.toLocaleString()}원 — ${days.toFixed(1)}일치뿐`);
      else if (days < 5) add('보통', '광고', `네이버 잔액 ${bal.toLocaleString()}원 — ${days.toFixed(1)}일치`);

      const groups = await api.get('/ncc/adgroups', { nccCampaignId: cmp.nccCampaignId });
      for (const g of groups) {
        const mine = /\[FVA\] [A-C]_/.test(g.name);
        const kws = await api.get('/ncc/keywords', { nccAdgroupId: g.nccAdgroupId });
        // 꺼 둔 그룹의 거절은 지금 손해가 아니다. 켜져 있는 그룹만 심각으로 본다.
        const bad = kws.filter(k => k.statusReason === 'KEYWORD_DISAPPROVED' && !k.userLock);
        if (bad.length) add(g.userLock ? '낮음' : '심각', '광고',
          `네이버 「${g.name}」${g.userLock ? '(꺼둠)' : ''}에 검수 거절된 검색어 ${bad.length}개: ${bad.slice(0, 5).map(k => k.keyword).join(', ')}`,
          '거절이면 아무리 켜둬도 안 나간다');
        // 켜져 있는데 우리가 짠 그룹이 아니면 알린다. 예전 대행사 그룹이 살아 있으면
        // 브랜드 검색까지 돈을 내고, 도착지도 우리가 정한 곳이 아니다.
        if (!mine && !g.userLock && g.status !== 'PAUSED_BY_USER')
          add('심각', '광고', `옛 그룹 「${g.name}」이 아직 켜져 있다 (키워드 ${kws.length}개)`,
            '같은 예산을 나눠 쓰고 도착지가 홈이다');
        const ads = await api.get('/ncc/ads', { nccAdgroupId: g.nccAdgroupId });
        const live = ads.filter(a => a.status === 'ELIGIBLE');
        if (mine && !live.length) add('심각', '광고', `네이버 「${g.name}」에 살아 있는 소재가 없다`);
        for (const a of live) {
          const url = a.ad?.pc?.final || '';
          if (!url) { add('심각', '광고', `네이버 「${g.name}」 소재에 도착 주소가 없다`); continue; }
          const r = await head(url);
          if (r.status !== 200) add('심각', '광고', `네이버 「${g.name}」 도착지 ${r.status}: ${url}`);
          if (mine && !/utm_source=naver/.test(url))
            add('보통', '광고', `네이버 「${g.name}」 도착 주소에 utm 이 없다 — 유입을 구분 못 한다`);
        }
        for (const a of ads.filter(x => x.inspectStatus === 'DISAPPROVED'))
          add('심각', '광고', `네이버 「${g.name}」 소재가 검수 거절됨`);
      }
    }
  } catch (e) { add('보통', '광고', '네이버 API 점검 실패: ' + String(e.message).slice(0, 90)); }

  // 구글 — 로그인된 크롬 화면에서 읽는다
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
    const tab = list.find(t => t.type === 'page' && /ads\.google\.com/.test(t.url));
    if (!tab) { add('낮음', '광고', '구글애즈 탭이 안 떠 있어 건너뜀'); return; }
    const w = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => w.onopen = r);
    let i = 0; const pd = new Map();
    w.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pd.has(m.id)) { const p = pd.get(m.id); pd.delete(m.id); p(m.result); } };
    const S = (m, p = {}) => new Promise(r => { const n = ++i; pd.set(n, r); w.send(JSON.stringify({ id: n, method: m, params: p })); });
    const js = async e => (await S('Runtime.evaluate', { returnByValue: true, expression: e }))?.result?.value;
    await js(`location.href='https://ads.google.com/aw/ads?ocid=8245188401'`);
    // 도착 주소는 행에 마우스를 올려야 생기는 연필의 aria-label 안에 들어 있다.
    let ok = false, len = 0;
    for (let n = 0; n < 10; n++) {
      const d = await js(`(()=>({len:(document.body.innerText||'').length,
        ok:(document.body.innerText||'').indexOf('반응형 검색 광고')>=0}))()`).catch(() => null);
      if (d) { len = d.len; if (d.ok) { ok = true; break; } }
      await sleep(5000);
    }
    if (!ok) { add('낮음', '광고', `구글애즈 화면이 안 그려짐(본문 ${len}자) — 크롬 창을 띄워두면 검사된다`); w.close(); return; }
    // 연필을 꺼내려면 진짜 마우스 움직임이 필요하다. JS 이벤트로는 안 나온다.
    for (const dx of [-80, -40, 0, 40]) {
      await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 607 + dx, y: 583, buttons: 0 });
      await sleep(300);
    }
    await sleep(1200);
    const info = await js(`(()=>{
      const t=(document.body.innerText||'').replace(/\\n+/g,'|');
      const el=[...document.querySelectorAll('[aria-label]')]
        .find(x=>/^이 광고 수정/.test(x.getAttribute('aria-label')));
      const lab = el ? el.getAttribute('aria-label') : '';
      return { url:(lab.match(/finalUrls: (\\S+)/)||[])[1]||'',
               거부: t.indexOf('비승인')>=0 || t.indexOf('거부됨')>=0,
               보류: t.indexOf('보류중')>=0,
               운영: t.indexOf('운영 가능')>=0 };
    })()`);
    if (info) {
      if (info.거부) add('심각', '광고', '구글 광고가 비승인 상태다');
      if (info.보류) add('보통', '광고', '구글 광고가 검토 대기중 — 보통 하루면 풀린다');
      if (!info.운영) add('심각', '광고', '구글에 운영 가능한 광고가 없다');
      if (info.url) {
        const r = await head(info.url);
        if (r.status !== 200) add('심각', '광고', `구글 광고 도착지 ${r.status}: ${info.url}`);
      } else add('낮음', '광고', '구글 광고 도착 주소를 못 읽었다(마우스를 올려야 나온다)');
    }
    w.close();
  } catch (e) { add('낮음', '광고', '구글애즈 점검 건너뜀: ' + String(e.message).slice(0, 80)); }
}

// ── 5. 수치 배관 ───────────────────────────────────────────
async function pipePass() {
  const raw = 'https://raw.githubusercontent.com/bowiestudioskr-hub/fva-site/data/data/ads-9c4e17.json';
  try {
    const j = await (await fetch(raw + '?t=' + Math.random())).json();
    const age = t => {
      const m = String(t || '').match(/(\d+)\. ?(\d+)\. ?(\d+)\. ?(AM|PM) ?(\d+):(\d+)/);
      if (!m) return null;
      let h = +m[5] % 12; if (m[4] === 'PM') h += 12;
      return (Date.now() - new Date(+m[1], +m[2] - 1, +m[3], h, +m[6]).getTime()) / 60000;
    };
    const a = age(j.updated);
    if (a == null) add('보통', '수치', `광고 JSON 시각을 못 읽는다: ${j.updated}`);
    else if (a > 60) add('심각', '수치', `광고 수치가 ${Math.round(a / 60)}시간째 멈춰 있다`);
    const g = age(j.google?.updated);
    if (g != null && g > 180) add('보통', '수치', `구글 수치가 ${Math.round(g / 60)}시간째 멈춰 있다 — 크롬 창을 띄워둘 것`);
    if (!j.naver?.byPeriod) add('보통', '수치', '광고 JSON 에 기간별 집계(byPeriod)가 없다');
  } catch (e) { add('심각', '수치', '광고 JSON 을 못 읽는다: ' + String(e.message).slice(0, 80)); }

  const FEED = 'https://script.google.com/macros/s/AKfycbxX5u3DZXo45__8_7a3XHPjIbD_utCHYeyK7l2lmuvA3b4dENQS_y4ncVgnSHb5RYA/exec';
  try {
    const t0 = Date.now();
    const f = await (await fetch(FEED)).json();
    const secs = (Date.now() - t0) / 1000;
    if (!f.ranges || !f.ranges['1']) add('심각', '수치', '유입 피드가 비어 있다');
    else if (secs > 12) add('낮음', '수치', `유입 피드가 ${secs.toFixed(1)}초 걸린다 — 캐시가 비었다`);
    const src = f.ranges?.['1']?.sources || [];
    const names = src.map(s => s.name);
    if (names.length !== new Set(names).size) add('보통', '수치', '유입 경로에 같은 이름이 두 줄 있다');
  } catch (e) { add('심각', '수치', '유입 피드를 못 읽는다: ' + String(e.message).slice(0, 80)); }

  try {
    const log = readFileSync(join(process.env.HOME, 'Library/Logs/fva-adssync.log'), 'utf8');
    const runs = log.split(/\n(?=── )/).slice(-4);
    const fails = runs.filter(r => r.includes('3회 실패')).length;
    if (fails >= 3) add('심각', '수치', `자동 동기화가 최근 ${fails}번 연속 실패`);
    else if (fails) add('낮음', '수치', `자동 동기화가 최근 ${fails}번 실패 (일시적 네트워크일 수 있다)`);
  } catch { add('낮음', '수치', '동기화 로그를 못 읽는다'); }
}

// ── 6. 캐시 버전 ───────────────────────────────────────────
function versionPass() {
  const files = ['index.html', 'curriculum.html', 'offline.html', 'works.html', 'online.html',
    'reviews.html', 'adlog.html', 'worklist.html', 'adminmonitor.html'];
  const seen = new Map();
  for (const f of files) {
    const p = join(SITE, f);
    if (!existsSync(p)) { add('보통', '빌드', `${f} 가 없다`); continue; }
    const s = readFileSync(p, 'utf8');
    for (const m of s.matchAll(/(?:css|js)\/[^"']+\?v=([a-z0-9-]+)/g)) {
      if (!seen.has(m[1])) seen.set(m[1], new Set());
      seen.get(m[1]).add(f);
    }
  }
  if (seen.size > 1) {
    const list = [...seen].map(([v, fs]) => `${v}(${[...fs].join(',')})`).join(' / ');
    add('보통', '빌드', `캐시 버전이 갈렸다: ${list}`, '옛 CSS 가 나갈 수 있다');
  }
}

// ── 실행 ──────────────────────────────────────────────────
console.log('점검 시작', new Date().toLocaleString('ko-KR'));
const pages = await httpPass();
console.log('  HTTP 확인');
const n = await linkPass(pages);
console.log(`  링크·자산 ${n}종 확인`);
versionPass();
await browserPass();
console.log('  브라우저 확인');
await pipePass();
console.log('  수치 배관 확인');
if (WANT_ADS) { await adsPass(); console.log('  광고 계정 확인'); }

const order = { 심각: 0, 보통: 1, 낮음: 2 };
issues.sort((a, b) => order[a.sev] - order[b.sev]);
console.log('\n' + '─'.repeat(58));
if (!issues.length) {
  console.log('문제 없음 ✓');
  process.exit(0);
}
const hard = issues.filter(i => i.sev !== '낮음').length;
for (const i of issues) {
  console.log(`[${i.sev}] ${i.area} — ${i.msg}`);
  if (i.hint) console.log(`        ${i.hint}`);
}
console.log('─'.repeat(58));
console.log(`심각 ${issues.filter(i => i.sev === '심각').length} · 보통 ${issues.filter(i => i.sev === '보통').length} · 낮음 ${issues.filter(i => i.sev === '낮음').length}`);
process.exit(hard ? 1 : 0);
