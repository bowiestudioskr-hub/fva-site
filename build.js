#!/usr/bin/env node
/**
 * 페이지 조립기.
 * 헤더·푸터·메타를 한 곳에서 관리하고, pages/*.js 의 본문을 끼워 완성 HTML을 만든다.
 * 의존성 없음 —  node build.js  로 실행.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://fva.co.kr';
const PUBL = 'https://www.fva.co.kr/channels/L2NoYW5uZWxzLzIyMDkw'; // 도메인 이전 시 class.fva.co.kr 로 교체
const REVIEWS = 'https://bowiestudioskr-hub.github.io/fva-reviews/';
const KAKAO = 'http://pf.kakao.com/_nxhyhn';

const NAV = [
  ['/',               '홈'],
  ['/online.html',    '온라인 강의'],
  ['/offline.html',   '오프라인 강의'],
  ['/curriculum.html','커리큘럼'],
  ['/news.html',      '피바뉴스'],
  ['/works.html',     '수강생 작품'],
  [REVIEWS,           '강의후기'],
];

const SNS = [
  ['sns-naver.svg',     '네이버 스마트스토어', 'https://smartstore.naver.com/bowiestudios'],
  ['sns-instagram.svg', '인스타그램',        'https://www.instagram.com/fvaacademy/'],
  ['sns-kakao.svg',     '카카오톡 채널',      'http://pf.kakao.com/_nxhyhn'],
  ['sns-blog.svg',      '네이버 블로그',      'https://blog.naver.com/bowiestudios'],
  ['sns-youtube.svg',   '유튜브',            'https://www.youtube.com/@FVA-ACADEMY'],
  ['sns-link.svg',      '수강 후기',          'https://bowiestudioskr-hub.github.io/fva-reviews/'],
];

/* 피그마 1920 기준 실측
   헤더 높이 72 · 로고 x25 184x17.77 · 네비 x264 20px 간격50
   버튼 x1451 124x35 (Pretendard ExtraBold 14px, #06150a, radius 999)
   SNS  x1615~1885, 아이콘 16~22px                                    */
const header = (active) => `
<header class="site-header">
  <div class="hd">
    <a class="hd-logo" href="/" aria-label="FVA ACADEMY 홈">
      <img src="assets/icons/logo-nav.svg" width="184" height="18" alt="FVA ACADEMY">
    </a>
    <button class="nav-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="gnb">☰</button>
    <nav class="gnb" id="gnb" aria-label="주 메뉴">
${NAV.map(([href, label]) => {
  const ext = href.startsWith('http');
  const cur = href === active ? ' aria-current="page"' : '';
  return `      <a href="${href}"${cur}${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
}).join('\n')}
    </nav>
    <a class="btn-cta" href="${KAKAO}" target="_blank" rel="noopener">즉시 상담하기</a>
    <ul class="sns">
${SNS.map(([f, label, href]) =>
`      <li><a href="${href}" target="_blank" rel="noopener" aria-label="${label}"><img src="assets/icons/${f}" alt="" aria-hidden="true"></a></li>`
).join('\n')}
    </ul>
  </div>
</header>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap">
    <img class="ft-logo" src="assets/icons/logo-nav.svg" width="184" height="18" alt="FVA ACADEMY">
    <p>보위스튜디오(bowie studios) ㅣ 대표자 : 정주영 ㅣ 주소 : 서울특별시 마포구 독막로6길 6, 5층(합정동, 현영빌딩) ㅣ 이메일 : bowiestudios.kr@gmail.com</p>
    <p>통신판매업 신고번호 : 2024-서울마포-1965호 ㅣ 사업자 등록 번호 : 285-37-00494 ㅣ 대표 전화번호 : 010-8108-3530</p>
    <p>Copyright ⓒ 2024 FVA ACADEMY. All rights reserved.</p>
  </div>
</footer>

<script>
  (function(){
    var btn=document.querySelector('.nav-toggle'), nav=document.getElementById('gnb');
    if(!btn||!nav)return;
    btn.addEventListener('click',function(){
      var open=nav.getAttribute('data-open')==='true';
      nav.setAttribute('data-open',String(!open));
      btn.setAttribute('aria-expanded',String(!open));
      btn.textContent=open?'☰':'✕';
    });
  })();
</script>`;

function page({ file, title, desc, active, extraCss = [], jsonld = null, body }) {
  const url = `${SITE}/${file === 'index.html' ? '' : file}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FVA ACADEMY">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/img/og.jpg">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
${extraCss.map(c => `<link rel="stylesheet" href="css/${c}">`).join('\n')}
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>` : ''}
</head>
<body>
${header(active)}

<main>
${body}
</main>
${footer()}
</body>
</html>
`;
}

// ── 페이지 정의 ───────────────────────────────────────────
const fsx = require('fs');
const read = (f) => fsx.readFileSync(path.join(__dirname, 'pages', f), 'utf8');
const pages = require('./pages');

let built = 0;
for (const p of pages({ PUBL, REVIEWS, KAKAO, SITE, read })) {
  fs.writeFileSync(path.join(__dirname, p.file), page(p));
  console.log(`  ✓ ${p.file}`);
  built++;
}

// ── sitemap.xml ──────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'online.html', 'offline.html', 'curriculum.html', 'news.html', 'works.html'];
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}/${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${u === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`);

fs.writeFileSync(path.join(__dirname, 'robots.txt'),
`User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`  ✓ sitemap.xml (${urls.length} URL)`);
console.log(`  ✓ robots.txt`);
console.log(`\n${built}개 페이지 생성 완료`);
