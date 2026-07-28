/**
 * 페이지별 본문. build.js 가 헤더·푸터·메타를 씌워 완성 HTML을 만든다.
 * 메인(index.html)과 커리큘럼(curriculum.html)은 손으로 정밀 조판했으므로 여기서 제외.
 */
module.exports = ({ PUBL, REVIEWS, KAKAO, SITE }) => [

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
        <div class="stills"><img src="assets/works/work2-kimboknam.jpg" width="1924" height="469" loading="lazy" alt="김복남 맥주 광고 영상 스틸컷"></div>
        <div class="banner"><h3>생맥주 프랜차이즈 광고 영상 공모전 대상 수상</h3><p>BRAND - 김복남 맥주 Kimboknam Beer</p></div>
        <p class="credit">* FVA 5기 [지OO], 7기[박OO], 8기[김OO, 정OO, 오OO, 이OO, 김OO, 김OO, 모OOO 아OO] 수강생 작품</p>
      </article>

      <article class="work">
        <div class="stills"><img src="assets/works/work3-shinhan.jpg" width="1924" height="522" loading="lazy" alt="제11회 신한 29초영화제 최우수상 수상작 스틸컷"></div>
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
      <p class="also-lede" data-build="youtube-placeholder">
        유튜브 채널의 <b>[FVA 수강생 우수작]</b> 영상을 자동으로 불러올 영역입니다.
        새 영상을 올리면 이 목록에 자동으로 추가됩니다.
      </p>
      <div class="hero-actions">
        <a class="btn-primary" href="https://www.youtube.com/@FVA-ACADEMY" target="_blank" rel="noopener">유튜브 채널 보기</a>
      </div>
    </div>
  </section>
`,
  },

  // ══════════════════════════════════════════════════════════
  // 피바뉴스
  // ══════════════════════════════════════════════════════════
  {
    file: 'news.html',
    active: '/news.html',
    title: '피바뉴스 — 촬영 워크샵·네트워킹 파티·초청 연사 | FVA 피바아카데미',
    desc: '촬영 & 조명 워크샵, 영상인들의 네트워킹 파티, 수강생 작품 촬영 비하인드, 초청 연사 아카이브. FVA 아카데미에서 실제로 벌어지는 일들을 기록합니다.',
    extraCss: ['sub.css'],
    body: `
  <section class="sub-hero">
    <div class="wrap">
      <p class="eyebrow-line">FVA NEWS</p>
      <h1>피바뉴스</h1>
      <p class="lede">FVA 아카데미에서 실제로 벌어지는 일들 — 워크샵, 파티, 촬영 현장, 초청 강연을 기록합니다.</p>
    </div>
  </section>

  <section class="news-list-sec">
    <div class="wrap">
      <div class="news-grid">

        <article class="news-card">
          <h2>촬영 &amp; 조명 워크샵</h2>
          <p class="news-date"><time datetime="2026-02-23">2026. 02. 23</time> · 포함된 포스트 4</p>
          <p>FVA 아카데미 오프라인 클래스에서는 기획 이론을 바탕으로 수강생들이 직접 현장을 만들어 볼 수 있는 촬영 &amp; 조명 워크샵이 매 분기 진행됩니다. 평소 눈여겨 보던 레퍼런스를 직접 구현해보거나 고가의 카메라/조명 장비를 직접 손으로 만져보면서 실무 중심적인 촬영 현장 프로세스를 경험해 보실 수 있습니다.</p>
        </article>

        <article class="news-card">
          <h2>네트워킹 파티</h2>
          <p class="news-date"><time datetime="2025-02-23">2025. 02. 23</time> · 포함된 포스트 4</p>
          <p>진행 중인 작품 기획을 공유하고 나만의 팀원을 모집할 수 있는 ‘영상인들의 비밀 파티’에 초대합니다! 아이디어와 레퍼런스를 공유할 수 있는 발표 시간, 감독님과 함께 고민 상담, 영상 현업자 초청 특강, 궁금했던 점들을 물어볼 수 있는 Q&amp;A 등 다양한 프로그램이 준비되어 있습니다.</p>
        </article>

        <article class="news-card">
          <h2>수강생 작품 촬영 비하인드</h2>
          <p class="news-date"><time datetime="2024-02-23">2024. 02. 23</time> · 포함된 포스트 1</p>
          <p>피바아카데미 오프라인 클래스 수강생들의 생생한 촬영 현장 Behind The Scene을 살펴보세요!</p>
        </article>

        <article class="news-card">
          <h2>초청 연사 아카이브</h2>
          <p class="news-date"><time datetime="2023-02-09">2023. 02. 09</time> · 포함된 포스트 4</p>
          <p>FVA 아카데미는 현장에서 실제 결과를 만들어내는 실무자들과 지식을 나누는 것을 중요하게 생각합니다. 각 분야의 감독, 제작자, 크리에이터들이 전한 작업 방식과 업계의 흐름을 통해, 배움이 한 번의 수업을 넘어 업계와 연결되는 경험으로 이어지기를 바랍니다.</p>
        </article>

      </div>
      <p class="cur-foot" data-build="news-todo">개별 글 상세 페이지는 퍼블에서 내용을 옮겨온 뒤 추가됩니다.</p>
    </div>
  </section>
`,
  },
];
