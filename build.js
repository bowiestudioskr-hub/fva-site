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
const KAKAO = 'https://pf.kakao.com/_nxhyhn/chat';

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
  ['sns-kakao.svg',     '카카오톡 채널',      'https://pf.kakao.com/_nxhyhn/chat'],
  ['sns-blog.svg',      '네이버 블로그',      'https://blog.naver.com/bowiestudioskr'],
  ['sns-youtube.svg',   '유튜브',            'https://www.youtube.com/@FVA-ACADEMY'],
  ['sns-link.svg',      '피바아카데미 리틀리',  'https://litt.ly/bowiestudios'],
];

/* 피그마 1920 기준 실측
   헤더 높이 72 · 로고 x25 184x17.77 · 네비 x264 20px 간격50
   버튼 x1451 124x35 (Pretendard ExtraBold 14px, #06150a, radius 999)
   SNS  x1615~1885, 아이콘 16~22px                                    */
const header = (active) => `
<header class="site-header">
  <span class="top-bar" aria-hidden="true"></span>
  <div class="hd">
    <a class="hd-logo" href="/">
      <span class="sr-only">FVA ACADEMY</span><svg class="tlab-logo" aria-hidden="true" focusable="false" preserveAspectRatio="none" overflow="visible" style="display: block;" viewBox="0 0 184 17.7697" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Vector" d="M12.9107 3.72084V0.297209H0V17.4812H3.67108V11.8302H11.4918V8.40659H3.67108V3.72909H12.9107V3.72084Z" fill="currentColor"/>
<path id="Vector_2" d="M28.1398 0.297209L23.5365 12.5975L18.9331 0.297209H14.8166L21.276 17.4812H25.6814L32.1409 0.297209H28.1233H28.1398Z" fill="currentColor"/>
<path id="Vector_3" d="M41.6524 0.297209H37.1976L30.7381 17.4812H34.6567L35.7374 14.3958H42.9806L44.1026 17.4812H48.1202L41.6607 0.297209H41.6524ZM36.9006 11.0712L39.3508 4.1168L41.8009 11.0712H36.9089H36.9006Z" fill="currentColor"/>
<path id="Vector_4" d="M66.4753 0.297209H62.0205L55.6105 17.4812H59.5291L60.6098 14.3958H67.853L68.9337 17.4812H73.0007L66.4918 0.297209H66.4753ZM61.773 11.0712L64.2231 4.1168L66.6733 11.0712H61.7812H61.773Z" fill="currentColor"/>
<path id="Vector_5" d="M82.8757 14.2472C79.8398 14.2472 77.5381 11.9455 77.5381 8.86017C77.5381 5.7748 79.8398 3.52267 82.8757 3.52267C85.0784 3.52267 86.9428 4.74361 87.6275 6.70703H91.5956C90.7624 2.73894 87.1903 5.03481e-05 82.884 5.03481e-05C77.6949 5.03481e-05 73.7763 3.81963 73.7763 8.86017C73.7763 13.9007 77.6949 17.7697 82.884 17.7697C87.1903 17.7697 90.7624 15.0309 91.5956 11.0628H87.6275C86.9428 13.0179 85.0784 14.2472 82.8757 14.2472Z" fill="currentColor"/>
<path id="Vector_6" d="M103.195 0.297209H98.7399L92.2804 17.4812H96.199L97.2797 14.3958H104.572L104.506 14.3051L105.653 17.4812H109.671L103.211 0.297209H103.195ZM98.4429 11.0712L100.893 4.1168L103.343 11.0712H98.4511H98.4429Z" fill="currentColor"/>
<path id="Vector_7" d="M118.952 0.297209H112.196V17.4812H118.952C123.943 17.4812 127.713 13.7607 127.713 8.86862C127.713 3.97657 123.943 0.297209 118.952 0.297209ZM118.862 14.0081H115.875V3.72909H118.862C121.749 3.72909 123.952 5.93174 123.952 8.86862C123.952 11.8055 121.749 14.0081 118.862 14.0081Z" fill="currentColor"/>
<path id="Vector_8" d="M134.305 14.0079V10.5349H141.16V7.11124H134.305V3.73706H141.994V0.313534H130.683V17.4975H142.093V14.0245H134.305V14.0079Z" fill="currentColor"/>
<path id="Vector_9" d="M160.101 0.297209L155.11 9.40476L155.011 9.20678L150.16 0.297209H145.508V17.4812H149.179V5.48618L149.377 5.92343L155.102 16.4252L156.133 14.5444L161.075 5.48618V17.4812H164.696V0.297209H160.093H160.101Z" fill="currentColor"/>
<path id="Vector_10" d="M179.884 0.297209L175.676 7.83741L175.577 7.63942L171.419 0.297209H167.262L173.77 11.558V17.4812H177.442V11.558L184 0.297209H179.892H179.884Z" fill="currentColor"/>
</g>
</svg>

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
    <span class="sr-only">FVA ACADEMY</span><svg class="tlab-logo ft-logo" aria-hidden="true" focusable="false" preserveAspectRatio="none" overflow="visible" style="display: block;" viewBox="0 0 184 17.7697" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Group">
<path id="Vector" d="M12.9107 3.72084V0.297209H0V17.4812H3.67108V11.8302H11.4918V8.40659H3.67108V3.72909H12.9107V3.72084Z" fill="currentColor"/>
<path id="Vector_2" d="M28.1398 0.297209L23.5365 12.5975L18.9331 0.297209H14.8166L21.276 17.4812H25.6814L32.1409 0.297209H28.1233H28.1398Z" fill="currentColor"/>
<path id="Vector_3" d="M41.6524 0.297209H37.1976L30.7381 17.4812H34.6567L35.7374 14.3958H42.9806L44.1026 17.4812H48.1202L41.6607 0.297209H41.6524ZM36.9006 11.0712L39.3508 4.1168L41.8009 11.0712H36.9089H36.9006Z" fill="currentColor"/>
<path id="Vector_4" d="M66.4753 0.297209H62.0205L55.6105 17.4812H59.5291L60.6098 14.3958H67.853L68.9337 17.4812H73.0007L66.4918 0.297209H66.4753ZM61.773 11.0712L64.2231 4.1168L66.6733 11.0712H61.7812H61.773Z" fill="currentColor"/>
<path id="Vector_5" d="M82.8757 14.2472C79.8398 14.2472 77.5381 11.9455 77.5381 8.86017C77.5381 5.7748 79.8398 3.52267 82.8757 3.52267C85.0784 3.52267 86.9428 4.74361 87.6275 6.70703H91.5956C90.7624 2.73894 87.1903 5.03481e-05 82.884 5.03481e-05C77.6949 5.03481e-05 73.7763 3.81963 73.7763 8.86017C73.7763 13.9007 77.6949 17.7697 82.884 17.7697C87.1903 17.7697 90.7624 15.0309 91.5956 11.0628H87.6275C86.9428 13.0179 85.0784 14.2472 82.8757 14.2472Z" fill="currentColor"/>
<path id="Vector_6" d="M103.195 0.297209H98.7399L92.2804 17.4812H96.199L97.2797 14.3958H104.572L104.506 14.3051L105.653 17.4812H109.671L103.211 0.297209H103.195ZM98.4429 11.0712L100.893 4.1168L103.343 11.0712H98.4511H98.4429Z" fill="currentColor"/>
<path id="Vector_7" d="M118.952 0.297209H112.196V17.4812H118.952C123.943 17.4812 127.713 13.7607 127.713 8.86862C127.713 3.97657 123.943 0.297209 118.952 0.297209ZM118.862 14.0081H115.875V3.72909H118.862C121.749 3.72909 123.952 5.93174 123.952 8.86862C123.952 11.8055 121.749 14.0081 118.862 14.0081Z" fill="currentColor"/>
<path id="Vector_8" d="M134.305 14.0079V10.5349H141.16V7.11124H134.305V3.73706H141.994V0.313534H130.683V17.4975H142.093V14.0245H134.305V14.0079Z" fill="currentColor"/>
<path id="Vector_9" d="M160.101 0.297209L155.11 9.40476L155.011 9.20678L150.16 0.297209H145.508V17.4812H149.179V5.48618L149.377 5.92343L155.102 16.4252L156.133 14.5444L161.075 5.48618V17.4812H164.696V0.297209H160.093H160.101Z" fill="currentColor"/>
<path id="Vector_10" d="M179.884 0.297209L175.676 7.83741L175.577 7.63942L171.419 0.297209H167.262L173.77 11.558V17.4812H177.442V11.558L184 0.297209H179.892H179.884Z" fill="currentColor"/>
</g>
</svg>

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

  (function(){
    var v=document.getElementById('reel'), b=document.querySelector('.reel-sound');
    if(!v||!b)return;
    b.addEventListener('click',function(){
      v.muted=!v.muted;
      b.textContent=v.muted?'\uD83D\uDD07':'\uD83D\uDD0A';
      b.setAttribute('aria-pressed',String(!v.muted));
      b.setAttribute('aria-label',v.muted?'소리 켜기':'소리 끄기');
      if(!v.muted) v.play();
    });
  })();

  /* 스크롤 진행 바 */
  (function(){
    var bar=document.querySelector('.top-bar'); if(!bar)return;
    var tick=function(){
      var d=document.documentElement, max=d.scrollHeight-d.clientHeight;
      bar.style.setProperty('--scroll', (max>0 ? (d.scrollTop/max*100) : 0)+'%');
    };
    addEventListener('scroll',tick,{passive:true}); addEventListener('resize',tick); tick();
  })();

  /* 피바뉴스 — 시리즈 목록에서 글을 누르면 팝업으로 연다.
     주소는 그대로 바뀌므로 뒤로가기·새로고침·링크공유가 모두 정상 동작한다. */
  (function(){
    var grid=document.querySelector('.post-grid'); if(!grid)return;
    var modal=document.createElement('div');
    modal.className='modal'; modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true'); modal.hidden=true;
    modal.innerHTML='<div class="modal-inner"><button class="modal-close" type="button" aria-label="닫기">&times;</button><div class="modal-body"><p class="modal-loading">불러오는 중…</p></div></div>';
    document.body.appendChild(modal);
    var body=modal.querySelector('.modal-body');

    function close(){
      modal.classList.remove('on'); modal.hidden=true;
      document.body.classList.remove('modal-open');
      if(location.pathname!==openerPath) history.pushState({},'',openerPath);
    }
    var openerPath=location.pathname;

    function open(href){
      modal.hidden=false; modal.classList.add('on');
      document.body.classList.add('modal-open');
      body.innerHTML='<p class="modal-loading">불러오는 중…</p>';
      history.pushState({modal:href},'',href);
      fetch(href).then(function(r){return r.text()}).then(function(html){
        var doc=new DOMParser().parseFromString(html,'text/html');
        var art=doc.querySelector('.post-detail');
        body.innerHTML=''; if(art) body.appendChild(art);
        modal.querySelector('.modal-close').focus();
      }).catch(function(){ location.href=href; });
    }

    grid.addEventListener('click',function(e){
      var a=e.target.closest('a[href]'); if(!a)return;
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;   // 새 탭은 그대로
      e.preventDefault(); open(a.getAttribute('href'));
    });
    modal.addEventListener('click',function(e){
      if(e.target===modal||e.target.closest('.modal-close')) close();
    });
    addEventListener('keydown',function(e){ if(e.key==='Escape'&&!modal.hidden) close(); });
    addEventListener('popstate',function(){ if(!modal.hidden) { modal.classList.remove('on'); modal.hidden=true; document.body.classList.remove('modal-open'); } });
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
<link rel="stylesheet" href="css/mobile.css">
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

/* ⚠ 손으로 정밀 조판한 페이지는 빌드가 덮어쓰면 안 된다.
   pages/ 안의 본문이 실제 파일보다 낡아 있어서, 빌드를 돌리는 순간
   피그마 1:1 로 짜둔 조판이 통째로 옛 버전으로 되돌아간다.
   (2026-08-02 에 실제로 curriculum.html·offline.html 이 이렇게 날아갔다.)
   손보려면 pages/ 쪽 본문을 먼저 최신으로 맞춘 뒤 이 목록에서 빼라. */
const HANDMADE = new Set(['index.html', 'curriculum.html', 'offline.html']);

let built = 0, skipped = 0;
for (const p of pages({ PUBL, REVIEWS, KAKAO, SITE, read })) {
  if (HANDMADE.has(p.file)) {
    console.log(`  – ${p.file} (손조판 — 건너뜀)`);
    skipped++;
    continue;
  }
  fs.writeFileSync(path.join(__dirname, p.file), page(p));
  console.log(`  ✓ ${p.file}`);
  built++;
}

// ── sitemap.xml ──────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const ND = require('./pages/news-data');
const NEWS_SLUGS = [...ND.map(n => `news-${n.slug}.html`),
                    ...ND.flatMap(n => n.posts.map((_, i) => `news-${n.slug}-${i+1}.html`))];
const urls = ['', 'online.html', 'offline.html', 'curriculum.html', 'news.html', 'works.html', 'reviews.html', ...NEWS_SLUGS];
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

/* 후기 134건을 reviews.html 안에 정적으로 심는다.
   reviews.json 만 갈아 끼우고 이 빌드를 돌리면 HTML 이 따라온다. */
require('./tools/build_reviews')();
console.log(`\n${built}개 페이지 생성 완료` + (skipped ? ` (손조판 ${skipped}개는 그대로 뒀다)` : ''));
