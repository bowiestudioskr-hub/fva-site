/* FVA ACADEMY 측정 스크립트
 * - GA4 / 네이버 / Meta 픽셀 로더 (ID만 채우면 즉시 작동)
 * - 외부 이동 클릭 추적: 퍼블(수강신청)·스마트스토어·카카오상담·SNS
 * - ID가 비어 있어도 클릭은 localStorage 에 누적되므로 데이터가 유실되지 않는다.
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 1) 여기에 ID만 채우면 됩니다. 비워두면 수집만 하고 전송은 하지 않습니다.
  var CFG = {
    GA4: '',            // 예: 'G-XXXXXXXXXX'   (Google Analytics 4)
    META: '',           // 예: '1234567890'     (Meta 픽셀)
    NAVER: ''           // 예: 's_xxxxxxxx'     (네이버 애널리틱스)
  };
  // ─────────────────────────────────────────────

  // 목적지 분류 — 어디로 나갔는지 사람이 읽을 수 있게
  /* ⚠ 이벤트 이름을 따로 준다.
     GA4 Data API 는 이벤트 「매개변수」(destination 같은)를 맞춤 측정기준으로 등록해야만
     읽을 수 있다. 등록을 안 해두면 outbound_click 이 한 덩어리로만 잡혀
     「스마트스토어로 몇 명 갔나」를 영영 못 센다. 이름을 나눠 두면 등록 없이도 센다. */
  /* ⚠ 여기에 스마트스토어·퍼블·카카오를 넣으면 안 된다.
     그 셋은 페이지 안에 박힌 스크립트(build.js 가 심는다)가 이미
     offline_store_click / online_class_click / kakao_consult_click 으로 쏘고 있다.
     같은 이름을 여기서 또 쏘면 한 번 누른 것이 두 번으로 잡힌다. */
  var EVENT_NAME = {
    '리틀리_링크모음': 'littly_click'
  };

  var DEST = [
    /* 퍼블 수강페이지. 도메인을 옮기면 fva.co.kr/channels 가 죽으므로
       퍼블 기본 주소(app.publr.co)도 같이 잡아야 집계가 끊기지 않는다. */
    { re: /app\.publr\.co\/channels|fva\.co\.kr\/channels|class\.fva\.co\.kr/i, name: '온라인강의_신청', kind: '퍼블' },
    { re: /smartstore\.naver\.com/i,                   name: '스마트스토어_수강권', kind: '구매' },
    { re: /pf\.kakao\.com/i,                           name: '카카오_즉시상담', kind: '상담' },
    { re: /litt\.ly/i,                                 name: '리틀리_링크모음', kind: 'SNS' },
    { re: /instagram\.com/i,                           name: '인스타그램', kind: 'SNS' },
    { re: /blog\.naver\.com/i,                         name: '네이버블로그', kind: 'SNS' },
    { re: /youtube\.com|youtu\.be/i,                   name: '유튜브', kind: 'SNS' }
  ];

  function classify(url) {
    for (var i = 0; i < DEST.length; i++) if (DEST[i].re.test(url)) return DEST[i];
    return null;
  }

  /* ⚠ 자동 점검 도구(헤드리스 크롬)를 방문자로 세면 수치가 오염된다.
     2026-08-19 에 그날 방문 89명 중 57명이 내 점검 창이었다.
     페이지에 박힌 태그(build.js)와 여기 둘 다 막아야 한다. */
  var IS_BOT = /HeadlessChrome|bot|crawler|spider|Lighthouse|PhantomJS/i.test(navigator.userAgent)
               || navigator.webdriver === true;
  if (IS_BOT) return;

  // ── GA4 ──
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  if (CFG.GA4) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GA4;
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', CFG.GA4);
  }

  // ── Meta 픽셀 ──
  if (CFG.META) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.META);
    window.fbq('track', 'PageView');
  }

  // ── 네이버 애널리틱스 ──
  if (CFG.NAVER) {
    var n = document.createElement('script');
    n.async = true; n.src = '//wcs.naver.net/wcslog.js';
    n.onload = function () {
      if (!window.wcs_add) window.wcs_add = {};
      window.wcs_add.wa = CFG.NAVER;
      if (window.wcs) { window.wcs_do(); }
    };
    document.head.appendChild(n);
  }

  // ── 로컬 누적 (ID 없어도 데이터가 남도록) ──
  var KEY = 'fva_outbound_v1';
  function bump(name) {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || '{}');
      d[name] = (d[name] || 0) + 1;
      d._updated = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) { /* 프라이빗 모드 등 */ }
  }

  // 콘솔에서 fvaStats() 로 확인 가능
  window.fvaStats = function () {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  };

  // ── 외부 이동 클릭 추적 ──
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) return;

    var d = classify(href);
    if (!d) return;

    bump(d.name);

    if (CFG.GA4) {
      gtag('event', 'outbound_click', {
        destination: d.name,
        destination_kind: d.kind,
        link_url: href,
        page_path: location.pathname
      });
      // 목적지별 전용 이벤트도 같이 쏜다(위 주석 참고)
      var en = EVENT_NAME[d.name];
      if (en) gtag('event', en, { page_path: location.pathname, link_url: href });
      // 퍼블·스마트스토어로 나가는 것은 별도 전환 이벤트로도 기록
      if (d.kind === '퍼블' || d.kind === '구매' || d.kind === '상담') {
        gtag('event', 'lead_exit', { destination: d.name, page_path: location.pathname });
      }
    }
    if (CFG.META && window.fbq) {
      if (d.kind === '상담') window.fbq('track', 'Contact');
      else if (d.kind === '구매' || d.kind === '퍼블') window.fbq('track', 'InitiateCheckout');
    }
  }, true);
})();
