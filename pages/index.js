/**
 * 페이지별 본문. build.js 가 헤더·푸터·메타를 씌워 완성 HTML을 만든다.
 * 메인(index.html)과 커리큘럼(curriculum.html)은 손으로 정밀 조판했으므로 여기서 제외.
 */
const NEWS = require('./news-data');
const PHOTOS = require('./post-photos.json');
const YT = require('./youtube.json');

module.exports = ({ PUBL, REVIEWS, KAKAO, SITE, read }) => [

  // ══════════════════════════════════════════════════════════
  // 메인 — 피그마 3398:146 실측 조판
  // ══════════════════════════════════════════════════════════
  {
    file: 'index.html',
    active: '/',
    title: 'FVA 피바아카데미 — 영상 기획·연출 학원 | 서울 마포 합정',
    desc: '현역 뮤직비디오·광고 감독이 기획부터 촬영·편집까지 1:1로 가르치는 영상 아카데미. ARRI ALEXA·FX6 시네마 장비 실전 촬영, 팀 단위 포트폴리오 제작. 영상 공모전 5연속 대상 수상. 서울 마포구 합정동.',
    jsonld: {
      '@context':'https://schema.org','@type':'EducationalOrganization',
      name:'FVA ACADEMY 피바아카데미', alternateName:'Film Visual Art Academy',
      url: SITE + '/',
      description:'영상 기획·연출·촬영 실무 아카데미. 현역 뮤직비디오·광고 감독이 직접 지도합니다.',
      address:{'@type':'PostalAddress',streetAddress:'독막로6길 6, 5층 (합정동, 현영빌딩)',
        addressLocality:'마포구',addressRegion:'서울특별시',postalCode:'04072',addressCountry:'KR'},
      telephone:'+82-10-8108-3530', email:'bowiestudios.kr@gmail.com',
      parentOrganization:{'@type':'Organization',name:'보위스튜디오 (bowie studios)'},
      sameAs:['https://www.instagram.com/fvaacademy/','https://www.youtube.com/@FVA-ACADEMY','https://smartstore.naver.com/bowiestudios'],
      aggregateRating:{'@type':'AggregateRating',ratingValue:'4.99',bestRating:'5',ratingCount:'134'},
    },
    body: read('_home.html'),
  },

  // ══════════════════════════════════════════════════════════
  // 커리큘럼
  // ══════════════════════════════════════════════════════════
  {
    file: 'curriculum.html',
    active: '/curriculum.html',
    title: '커리큘럼 — 12주 영상 기획·연출 과정 | FVA 피바아카데미',
    desc: '1개월·2개월·3개월 골라듣는 수강권. 1-4주차 기획과 연출, 4-8주차 비주얼 디렉팅, 9-12주차 포트폴리오 제작. AI 스토리보드·데모 영상 특강 포함. 13개 회차 전체 커리큘럼을 확인하세요.',
    extraCss: ['curriculum.css'],
    jsonld: {
      '@context':'https://schema.org','@type':'Course',
      name:'FVA 영상 기획·연출 12주 과정',
      description:'영상 기획과 연출부터 비주얼 디렉팅, 포트폴리오 작품 제작까지 다루는 12주 오프라인 과정. AI 스토리보드·데모 영상 제작 실습 포함.',
      provider:{'@type':'EducationalOrganization',name:'FVA ACADEMY 피바아카데미',url:SITE+'/'},
      inLanguage:'ko',
      hasCourseInstance:[
        {'@type':'CourseInstance',name:'1개월 수강권',courseMode:'onsite',courseWorkload:'P4W'},
        {'@type':'CourseInstance',name:'2개월 수강권',courseMode:'onsite',courseWorkload:'P8W'},
        {'@type':'CourseInstance',name:'3개월 풀코스 수강권',courseMode:'onsite',courseWorkload:'P12W'},
      ],
    },
    body: read('_curriculum.html'),
  },


  // ══════════════════════════════════════════════════════════
  // 온라인 강의 — 피그마에 없던 페이지. 결제는 퍼블로 넘긴다.
  // ══════════════════════════════════════════════════════════
  {
    file: 'online.html',
    active: '/online.html',
    title: '온라인 강의 — 기획부터 촬영까지, 프리프로덕션의 모든 것 | FVA 피바아카데미',
    desc: '현역 뮤직비디오·광고 감독 정주의 온라인 클래스. 기획부터 촬영까지 프리프로덕션 전 과정을 24개 세션으로. 언제 어디서나 반복 수강 가능합니다.',
    extraCss: ['sub.css'],
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: '[FVA] 기획부터 촬영까지, 프리프로덕션의 모든 것',
      description: '영상 기획과 프리프로덕션 전 과정을 다루는 온라인 클래스. 현역 뮤직비디오·광고 감독 정주가 직접 강의합니다.',
      provider: { '@type': 'EducationalOrganization', name: 'FVA ACADEMY 피바아카데미', url: SITE + '/' },
      inLanguage: 'ko',
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        instructor: { '@type': 'Person', name: '정주' },
      },
    },
    body: `
  <section class="sub-hero">
    <div class="wrap">
      <p class="eyebrow-line">ONLINE CLASS</p>
      <h1>기획부터 촬영까지,<br>프리프로덕션의 모든 것</h1>
      <p class="lede">현장에서 10년 이상 쌓은 노하우를 온라인으로. 시간과 장소에 구애받지 않고, 필요한 회차만 골라 반복해서 볼 수 있습니다.</p>
      <div class="hero-actions">
        <a class="btn-primary" href="${PUBL}/C00007" target="_blank" rel="noopener">수강 신청하기</a>
        <a class="btn-ghost" href="${KAKAO}" target="_blank" rel="noopener">먼저 상담받기</a>
      </div>
    </div>
  </section>

  <section class="course-card-sec">
    <div class="wrap">
      <article class="course-card">
        <div class="course-info">
          <p class="badge-row"><span class="badge-hot">프로모션 진행 중</span></p>
          <h2>[FVA] 기획부터 촬영까지, 프리프로덕션의 모든 것</h2>
          <dl class="course-meta">
            <div><dt>강사</dt><dd>정주 감독</dd></div>
            <div><dt>구성</dt><dd>총 24개 세션</dd></div>
            <div><dt>수강 방식</dt><dd>온라인 · 기간 내 무제한 반복 수강</dd></div>
          </dl>
        </div>
        <div class="course-buy">
          <p class="price-off">43%</p>
          <p class="price-was">350,000원</p>
          <p class="price-now">199,000<span>원</span></p>
          <a class="btn-primary block" href="${PUBL}/C00007" target="_blank" rel="noopener">수강 신청하기</a>
          <p class="buy-note">신청·결제는 FVA 수강 페이지에서 진행됩니다</p>
        </div>
      </article>
    </div>
  </section>

  <section class="why">
    <div class="wrap">
      <h2 class="sec-title">온라인 클래스는 이런 분께</h2>
      <div class="why-grid">
        <article><h3>기획이 늘 막히는 분</h3><p>카메라와 편집보다 먼저 배워야 할 건 기획입니다. 설득력 있는 기획서를 쓰는 법부터 다룹니다.</p></article>
        <article><h3>현장에 나가기 전인 분</h3><p>촬영 현장이 어떻게 돌아가는지, 무엇을 준비해야 하는지 미리 익히고 갈 수 있습니다.</p></article>
        <article><h3>오프라인 수강이 어려운 분</h3><p>지역이나 일정 때문에 합정 오프라인 수업이 어려우신 분도 같은 내용을 들을 수 있습니다.</p></article>
      </div>
    </div>
  </section>

  <section class="also">
    <div class="wrap">
      <h2 class="sec-title">오프라인 과정이 궁금하시다면</h2>
      <p class="also-lede">시네마 장비로 실제 촬영 현장을 만들고, 팀을 꾸려 포트폴리오 작품까지 완성하는 12주 과정도 있습니다.</p>
      <div class="hero-actions">
        <a class="btn-primary" href="/curriculum.html">커리큘럼 보기</a>
        <a class="btn-ghost" href="/offline.html">오프라인 강의 소개</a>
      </div>
    </div>
  </section>
`,
  },

  // ══════════════════════════════════════════════════════════
  // 오프라인 강의
  // ══════════════════════════════════════════════════════════
  {
    file: 'offline.html',
    active: '/offline.html',
    title: '오프라인 강의 — 포트폴리오 워크샵 | FVA 피바아카데미 서울 합정',
    desc: 'ARRI ALEXA·FX6·FX3 시네마 장비로 실제 촬영 현장을 만드는 12주 오프라인 과정. 팀 단위 작품 제작, 촬영·조명 워크샵, 네트워킹 파티. 서울 마포구 합정동.',
    extraCss: ['sub.css'],
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'FVA 오프라인 클래스 — 포트폴리오 워크샵',
      description: '시네마 장비 실전 촬영과 팀 단위 포트폴리오 제작을 다루는 12주 오프라인 과정.',
      provider: { '@type': 'EducationalOrganization', name: 'FVA ACADEMY 피바아카데미', url: SITE + '/' },
      inLanguage: 'ko',
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'onsite', courseWorkload: 'P12W' },
    },
    body: `
  <section class="sub-hero">
    <div class="wrap">
      <p class="eyebrow-line">OFFLINE CLASS</p>
      <h1>직접 팀을 꾸려서<br>완성하는 작품</h1>
      <p class="lede">서울 마포구 합정동. 현역 감독과 함께 실제 촬영 현장을 만들고, 12주 뒤에는 완성된 포트폴리오 작품을 손에 쥡니다.</p>
      <div class="hero-actions">
        <a class="btn-primary" href="${KAKAO}" target="_blank" rel="noopener">수강 문의하기</a>
        <a class="btn-ghost" href="/curriculum.html">커리큘럼 보기</a>
      </div>
    </div>
  </section>

  <section class="why">
    <div class="wrap">
      <h2 class="sec-title">오프라인에서만 가능한 것</h2>
      <div class="why-grid">
        <article><h3>시네마 장비 실전 촬영</h3><p>ARRI ALEXA·FX6·FX3 등 고가 시네마 장비를 직접 만지며 실제 촬영 현장을 만들어봅니다.</p></article>
        <article><h3>현역 감독의 현장 코칭</h3><p>작품 촬영에 감독이 직접 나와 현장에서 코칭합니다. 3개월 수강권은 수료 후에도 작품 피드백 3회를 받습니다.</p></article>
        <article><h3>워크샵과 네트워킹 파티</h3><p>촬영·조명 워크샵이 매 분기 열리고, 영상인들이 모여 팀을 꾸리는 네트워킹 파티에 참여할 수 있습니다.</p></article>
      </div>
    </div>
  </section>

  <section class="course-card-sec">
    <div class="wrap">
      <article class="course-card">
        <div class="course-info">
          <h2>수강 안내</h2>
          <dl class="course-meta">
            <div><dt>과정</dt><dd>12주 (1개월 · 2개월 · 3개월 수강권 선택)</dd></div>
            <div><dt>장소</dt><dd>서울특별시 마포구 독막로6길 6, 5층 (합정동 현영빌딩)</dd></div>
            <div><dt>개강</dt><dd>기수별 상이 — 카카오 채널로 문의</dd></div>
            <div><dt>결제</dt><dd>네이버 스마트스토어</dd></div>
          </dl>
        </div>
        <div class="course-buy">
          <p class="buy-lead">지금 모집 중인 기수를<br>카카오 채널로 안내해 드립니다</p>
          <a class="btn-primary block" href="${KAKAO}" target="_blank" rel="noopener">수강 문의하기</a>
          <a class="btn-ghost block" href="https://smartstore.naver.com/bowiestudios" target="_blank" rel="noopener">스마트스토어에서 보기</a>
        </div>
      </article>
    </div>
  </section>

  <section class="also">
    <div class="wrap">
      <h2 class="sec-title">수강생들이 만든 작품</h2>
      <p class="also-lede">영상 공모전 5연속 수상. 수강생 팀이 만든 작품이 실제로 상을 받고 있습니다.</p>
      <div class="hero-actions">
        <a class="btn-primary" href="/works.html">수강생 작품 보기</a>
        <a class="btn-ghost" href="${REVIEWS}" target="_blank" rel="noopener">수강 후기 134건</a>
      </div>
    </div>
  </section>
`,
  },

  // ══════════════════════════════════════════════════════════
  // 수강생 작품
  // ══════════════════════════════════════════════════════════
  {
    file: 'works.html',
    active: '/works.html',
    title: '수강생 작품 — 영상 공모전 5연속 대상 수상 | FVA 피바아카데미',
    desc: '2024 BCU 콘텐츠리그 대상, 제11회 신한 29초영화제 최우수상, 김복남 맥주·얌샘김밥 광고 공모전 대상. FVA 수강생 팀이 제작한 수상작을 확인하세요.',
    extraCss: ['sub.css'],
    jsonld: {
      '@context':'https://schema.org','@type':'ItemList',
      name:'FVA 수강생 작품',
      itemListElement: YT.students.map((v, i) => ({
        '@type':'ListItem', position:i+1,
        item:{'@type':'VideoObject', name:v.title, description:v.desc||v.title,
              thumbnailUrl:v.thumb, uploadDate:v.published, contentUrl:v.url, embedUrl:`https://www.youtube.com/embed/${v.id}`},
      })),
    },
    body: `
  <section class="sub-hero">
    <div class="wrap">
      <p class="eyebrow-line">STUDENT WORKS</p>
      <h1>영상 공모전에 나가기만 하면<br>대상을 받아오는</h1>
      <p class="lede">아래 작품은 모두 FVA 수강생이 팀을 꾸려 직접 제작한 것입니다. 기획부터 촬영, 편집까지 수업에서 배운 과정 그대로입니다.</p>
    </div>
  </section>

  <section class="works">
    <div class="wrap">
      <article class="work">
        <div class="stills"><img src="assets/works/work1-joyfools.jpg" width="1924" height="550" loading="lazy" alt="The Joyfools - Loser’s Love 뮤직비디오 스틸컷"></div>
        <div class="banner"><h3>2024 BCU 콘텐츠리그 대상 수상</h3><p>The Joyfools-Loser’s Love (Official Music Video)</p></div>
        <p class="credit">* FVA 5기 [양OO, 유OO, 박OO, 이OO, 김OO] 수강생 작품</p>
      </article>

      <article class="work">
        <div class="stills"><img src="assets/works/work2-kimboknam.webp" width="1924" height="469" loading="lazy" alt="김복남 맥주 광고 영상 스틸컷"></div>
        <div class="banner"><h3>생맥주 프랜차이즈 광고 영상 공모전 대상 수상</h3><p>BRAND - 김복남 맥주 Kimboknam Beer</p></div>
        <p class="credit">* FVA 5기 [지OO], 7기[박OO], 8기[김OO, 정OO, 오OO, 이OO, 김OO, 김OO, 모OOO 아OO] 수강생 작품</p>
      </article>

      <article class="work">
        <div class="stills"><img src="assets/works/work3-shinhan.webp" width="1924" height="522" loading="lazy" alt="제11회 신한 29초영화제 최우수상 수상작 스틸컷"></div>
        <div class="banner"><h3>제 11회 신한 29초영화제 최우수상 수상</h3></div>
        <p class="credit">* FVA 8기 [남OO, 김OO, 김OO, 김OO, 김OO, 오OO] 수강생 작품</p>
      </article>

      <article class="work">
        <div class="stills"><img src="assets/works/work4-yamsem.jpg" width="1924" height="988" loading="lazy" alt="얌샘김밥 숏폼 광고 영상 스틸컷"></div>
        <div class="banner"><h3>김밥 프랜차이즈 숏폼 영상 공모전 대상 수상</h3><p>BRAND - 얌샘김밥</p></div>
        <p class="credit">* FVA 9기 [방OO, 김OO, 송OO, 조OO, 조OO, 정OO, 정OO, 지OO, 김OO, 엄OO, 이OO] 수강생 작품</p>
      </article>
    </div>
  </section>

  <section class="yt" id="yt" aria-labelledby="yt-h">
    <div class="wrap">
      <h2 id="yt-h" class="sec-title">유튜브에 올라온 수강생 작품</h2>
      <p class="also-lede">유튜브 채널에 올라오는 <b>[FVA 수강생 우수작]</b> 영상입니다. 새 영상을 올리면 여기에 자동으로 추가됩니다.</p>
      <ul class="yt-grid">
${YT.students.map(v => `        <li class="yt-card">
          <a href="${v.url}" target="_blank" rel="noopener">
            <figure><img src="${v.thumb}" loading="lazy" width="480" height="360" alt="${v.title}"><span class="yt-play" aria-hidden="true">▶</span></figure>
            <h3>${v.title.replace(/\[FVA 수강생 우수작\]\s*/,'')}</h3>
            <p class="yt-meta"><time datetime="${v.published}">${v.published.replace(/-/g,'. ')}</time>${v.views ? ` · 조회 ${v.views.toLocaleString()}회` : ''}</p>
          </a>
        </li>`).join('\n')}
      </ul>

      <h2 class="sec-title yt-more-h">FVA 유튜브 최신 영상</h2>
      <ul class="yt-list">
${YT.latest.slice(0,8).map(v => `        <li>
          <a href="${v.url}" target="_blank" rel="noopener">
            <img src="${v.thumb}" loading="lazy" width="480" height="360" alt="">
            <div><h3>${v.title}</h3><p class="yt-meta"><time datetime="${v.published}">${v.published.replace(/-/g,'. ')}</time>${v.views ? ` · 조회 ${v.views.toLocaleString()}회` : ''}</p></div>
          </a>
        </li>`).join('\n')}
      </ul>

      <div class="hero-actions">
        <a class="btn-primary" href="${YT.channel}" target="_blank" rel="noopener">유튜브 채널 전체 보기</a>
      </div>
    </div>
  </section>
`,
  },

  // ══════════════════════════════════════════════════════════
  // 피바뉴스 — 피그마 3뎁스 구조
  //  1뎁스 3405:231353  목록 (좌 텍스트 / 우 사진)
  //  2뎁스 3453:241927  시리즈 (뒤로가기 + 헤더 + 글 2열)
  //  3뎁스 3455:142     글 상세 (모달 형태 1140 컬럼)
  //  서체 실측: 제목 Pretendard JP Bold 59.63/89.44 자간 -1.2356
  //            설명 Pretendard Regular 26.83/40.25 자간 -1.46
  //            메타 Pretendard JP Medium 20.87/31.30 #A5A5AB
  // ══════════════════════════════════════════════════════════
  {
    file: 'news.html',
    active: '/news.html',
    title: '피바뉴스 — 촬영 워크샵·네트워킹 파티·초청 연사 | FVA 피바아카데미',
    desc: '촬영 & 조명 워크샵, 영상인들의 네트워킹 파티, 수강생 작품 촬영 비하인드, 초청 연사 아카이브. FVA 아카데미에서 실제로 벌어지는 일들을 기록합니다.',
    extraCss: ['news.css'],
    body: `
  <!-- 이 페이지는 시리즈 카드만 있고 큰 제목이 없어 h1 이 비어 있었다.
       디자인을 건드리지 않도록 사이트 공통 .sr-only 방식으로만 넣는다. -->
  <h1 class="sr-only">피바뉴스 — 촬영 &amp; 조명 워크샵, 네트워킹 파티, 수강생 작품 촬영 비하인드, 초청 연사 아카이브</h1>

  <section class="news-index">
${NEWS.map(s => `    <article class="series-row">
      <div class="series-copy">
        ${s.kicker ? `<p class="series-kicker">${s.kicker}</p>` : s.kickerImg ? `<p class="series-kicker img"><img src="assets/icons/${s.kickerImg}" alt="" aria-hidden="true"></p>` : ''}
        <h2><a href="/news-${s.slug}.html">${s.title}</a></h2>
        <p class="series-desc">${s.desc}</p>
        <p class="series-meta"><time datetime="${s.date}">${s.dateLabel}</time><span>포함된 포스트 ${s.posts.length}</span></p>
        <a class="btn-more" href="/news-${s.slug}.html">더보기</a>
      </div>
      <a class="series-photo" href="/news-${s.slug}.html" tabindex="-1" aria-hidden="true">
        <img src="assets/news/${s.hero}" loading="lazy" alt="${s.title}">
      </a>
    </article>`).join('\n')}
  </section>
`,
  },

  // 2뎁스 — 시리즈
  ...NEWS.map(s => ({
    file: `news-${s.slug}.html`,
    active: '/news.html',
    title: `${s.title} — 피바뉴스 | FVA 피바아카데미`,
    desc: s.desc.replace(/&amp;/g, '&').slice(0, 155),
    extraCss: ['news.css'],
    jsonld: {
      '@context':'https://schema.org','@type':'CollectionPage',
      name: s.title, description: s.desc.replace(/&amp;/g,'&'),
      url: `${SITE}/news-${s.slug}.html`,
      isPartOf:{'@type':'WebSite',name:'FVA ACADEMY',url:SITE+'/'},
      hasPart: s.posts.map((x,i) => ({'@type':'Article', headline:x.title, description:x.sub,
        url:`${SITE}/news-${s.slug}-${i+1}.html`})),
    },
    body: `
  <a class="back-link" href="/news.html"><span aria-hidden="true">←</span> 뒤로가기</a>

  <header class="series-head">
    <div class="series-copy">
      ${s.kicker ? `<p class="series-kicker">${s.kicker}</p>` : s.kickerImg ? `<p class="series-kicker img"><img src="assets/icons/${s.kickerImg}" alt="" aria-hidden="true"></p>` : ''}
      <h1>${s.title}</h1>
      <p class="series-desc">${s.desc}</p>
      <p class="series-meta"><time datetime="${s.date}">${s.dateLabel}</time><span>포함된 포스트 ${s.posts.length}</span></p>
    </div>
    <div class="series-photo"><img src="assets/news/${s.hero}" alt="${s.title}"></div>
  </header>

  <section class="post-grid">
${s.posts.map((x,i) => `    <article class="post-card">
      <a href="/news-${s.slug}-${i+1}.html">
        <figure>
          <img src="assets/news/${x.img}" loading="lazy" alt="${x.title.replace(/"/g,'&quot;')}">
          ${x.likes ? `<figcaption class="likes"><span aria-hidden="true">♥</span> ${x.likes}</figcaption>` : ''}
        </figure>
        <h2>${x.title}</h2>
        <p class="post-sub">${x.sub}</p>
      </a>
    </article>`).join('\n')}
  </section>
`,
  })),

  // 3뎁스 — 글 상세
  ...NEWS.flatMap(s => s.posts.map((x, i) => ({
    file: `news-${s.slug}-${i+1}.html`,
    active: '/news.html',
    title: `${x.title.replace(/[🎥🎬🎄]/g,'').trim()} — ${s.title} | FVA 피바아카데미`,
    desc: `${x.sub} · ${s.title} · FVA 피바아카데미`,
    extraCss: ['news.css'],
    jsonld: {
      '@context':'https://schema.org','@type':'Article',
      headline: x.title, description: x.sub,
      datePublished: s.date,
      image: `${SITE}/assets/news/${x.img}`,
      publisher:{'@type':'Organization',name:'FVA ACADEMY 피바아카데미',url:SITE+'/'},
      isPartOf:{'@type':'CollectionPage',name:s.title,url:`${SITE}/news-${s.slug}.html`},
    },
    body: `
  <a class="back-link" href="/news-${s.slug}.html"><span aria-hidden="true">←</span> ${s.title}</a>

  <article class="post-detail">
    <figure class="post-cover">
      <img src="assets/news/${x.img}" alt="${x.title.replace(/"/g,'&quot;')}">
    </figure>
    <div class="post-body">
      <p class="post-eyebrow">${x.title}</p>
      <h1>${s.title}</h1>
      <p class="post-sub">${x.sub}</p>
      ${x.topic ? `<p class="post-topic"><b>강연 주제</b> 〈${x.topic}〉</p>` : ''}
      <p class="post-meta"><time datetime="${s.date}">${s.dateLabel}</time></p>
      ${(PHOTOS[`${s.slug}-${i+1}`] || []).length ? `<div class="post-gallery">
${(PHOTOS[`${s.slug}-${i+1}`]).map((f, k) => `        <img src="assets/news/posts/${f}" loading="lazy" alt="${x.title.replace(/"/g,'&quot;')} 현장 사진 ${k+1}">`).join('\n')}
      </div>` : ''}
    </div>
  </article>

  <nav class="post-nav">
    <a class="btn-more" href="/news-${s.slug}.html">${s.title} 전체 보기</a>
  </nav>
`,
  }))),

  // ══════════════════════════════════════════════════════════
  // 개인정보처리방침
  // 통신판매업 신고 사업자는 게시 의무가 있고(개인정보 보호법 제30조),
  // GA4 의 Google 신호 데이터를 켜려면 「필요한 사항을 공개했다」는 확약을 해야 한다.
  // 그 확약을 사실로 만들려면 실제로 어떤 도구가 무엇을 가져가는지 여기 적혀 있어야 한다.
  // ⚠ 아래 수집 도구 목록은 build.js 에 실제로 심긴 것과 일치해야 한다.
  //    추적을 추가하거나 뺐으면 이 표도 같이 고칠 것.
  // ══════════════════════════════════════════════════════════
  {
    file: 'privacy.html',
    active: '',
    title: '개인정보처리방침 | FVA 피바아카데미',
    desc: 'FVA 피바아카데미(보위스튜디오)가 수집하는 개인정보의 항목과 이용 목적, 보관 기간, 이용자의 권리를 안내합니다.',
    extraCss: ['sub.css'],
    body: `
  <section class="sub-hero">
    <div class="wrap">
      <p class="eyebrow">PRIVACY</p>
      <h1>개인정보처리방침</h1>
      <p class="sub-lede">보위스튜디오(FVA 피바아카데미)는 이용자의 개인정보를 소중히 다루며,
        아래와 같이 수집·이용하고 있습니다.</p>
    </div>
  </section>

  <section class="doc">
    <div class="wrap">

      <h2>1. 수집하는 항목과 목적</h2>
      <p>홈페이지를 둘러보는 것만으로는 이름·연락처를 받지 않습니다.
         상담이나 수강 신청을 하실 때 아래 정보를 받습니다.</p>
      <ul>
        <li><b>카카오톡 상담</b> — 카카오톡 프로필에 표시되는 이름. 상담 응대 목적.</li>
        <li><b>수강 신청·결제</b> — 이름, 연락처, 이메일, 결제 정보.
            수강 안내와 환불 처리 목적. 결제 정보는 결제대행사가 처리하며 당사는 보관하지 않습니다.</li>
      </ul>

      <h2>2. 자동으로 수집되는 정보</h2>
      <p>어떤 페이지가 도움이 되는지 확인하고 광고가 헛되이 나가지 않도록,
         아래 도구가 방문 기록을 남깁니다. 이름이나 연락처는 이 도구들로 수집하지 않습니다.</p>
      <ul>
        <li><b>Google 애널리틱스 (GA4)</b> — 방문한 페이지, 머문 시간, 접속 지역, 유입 경로,
            대략의 성별·연령대. <b>Google 신호 데이터</b>가 켜져 있어, 광고 개인 최적화에 동의하고
            Google 계정에 로그인한 이용자의 경우 Google이 보유한 정보와 연결되어
            집계된 형태의 인구통계가 제공됩니다.
            <a href="https://myaccount.google.com/activitycontrols" target="_blank" rel="noopener">Google 계정 활동 설정</a>에서
            언제든 거부하거나 자료를 삭제하실 수 있습니다.</li>
        <li><b>Google Ads</b> — 광고를 보고 오신 분이 상담 버튼을 눌렀는지 여부.</li>
        <li><b>Meta 픽셀</b> — 인스타그램·페이스북 광고를 보고 오신 분의 사이트 내 행동.</li>
        <li><b>네이버 애널리틱스</b> — 네이버에서 어떤 검색어로 들어오셨는지.</li>
      </ul>
      <p>이 기록은 쿠키로 남습니다. 브라우저 설정에서 쿠키를 차단하시면 수집되지 않으며,
         그래도 사이트 이용에는 지장이 없습니다.</p>

      <h2>3. 보관 기간</h2>
      <ul>
        <li>상담·수강 관련 정보 — 목적 달성 후 지체 없이 파기합니다.</li>
        <li>전자상거래법에 따라 보관 의무가 있는 기록 — 계약·청약철회 5년,
            대금 결제 5년, 소비자 불만·분쟁 처리 3년.</li>
        <li>방문 기록(GA4) — 14개월 후 자동 삭제됩니다.</li>
      </ul>

      <h2>4. 제3자 제공과 위탁</h2>
      <p>개인정보를 판매하거나 제3자에게 제공하지 않습니다.
         다만 서비스 운영을 위해 아래 업체가 처리 업무를 맡고 있습니다.</p>
      <ul>
        <li>Google LLC — 방문 분석 및 광고 성과 측정</li>
        <li>Meta Platforms, Inc. — 광고 성과 측정</li>
        <li>네이버㈜ — 방문 분석, 스마트스토어 결제</li>
        <li>㈜카카오 — 상담 채널 운영</li>
      </ul>

      <h2>5. 이용자의 권리</h2>
      <p>본인의 개인정보를 언제든 열람·정정·삭제·처리정지 요청하실 수 있습니다.
         아래 연락처로 요청하시면 지체 없이 처리합니다.
         개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118)에
         문의하실 수 있습니다.</p>

      <h2>6. 개인정보 보호책임자</h2>
      <ul>
        <li>상호 — 보위스튜디오(bowie studios)</li>
        <li>대표자 · 책임자 — 정주영</li>
        <li>이메일 — <a href="mailto:bowiestudios.kr@gmail.com">bowiestudios.kr@gmail.com</a></li>
        <li>전화 — 010-8108-3530</li>
        <li>주소 — 서울특별시 마포구 독막로6길 6, 5층(합정동, 현영빌딩)</li>
      </ul>

      <p class="doc-date">시행일 2026년 8월 17일</p>
    </div>
  </section>
`,
  },
];