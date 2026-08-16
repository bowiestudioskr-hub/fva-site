/**
 * FVA 유입 현황 — 데이터 공급기
 *
 * GA4 와 서치콘솔에서 수치를 읽어 JSON 으로 내보낸다.
 * fva.co.kr/stats-8f2a41.html 이 이 주소를 그대로 fetch 한다.
 *
 * 서비스 계정도 키 파일도 쓰지 않는다. 이 스크립트를 배포한
 * 구글 계정(bowiestudios.kr@gmail.com)의 권한으로 그대로 조회한다.
 *
 * ── 설치 ────────────────────────────────────────────────
 * 1. script.google.com → 새 프로젝트
 * 2. 이 파일 내용을 통째로 붙여넣기
 * 3. 배포 → 새 배포 → 유형 「웹 앱」
 *      실행 계정  : 나
 *      액세스 권한: 모든 사용자   ← 「Google 계정이 있는」이 아니라 「모든」
 * 4. 나온 웹 앱 URL 을 대시보드에 넣으면 끝
 *
 * 고급 서비스(AnalyticsData/Searchconsole)는 쓰지 않는다. 편집기에서
 * 일일이 추가해야 하고 clasp 로 올린 매니페스트만으로는 안 붙는다.
 * 그래서 REST 를 UrlFetchApp 으로 직접 친다. 권한은 매니페스트의
 * oauthScopes 로 선언해 둔다.
 * ────────────────────────────────────────────────────────
 */

const GA4_PROPERTY = '550057103';        // fva.co.kr 속성 (측정 ID G-79SFDWBK3L)
const SC_SITE      = 'https://fva.co.kr/'; // 서치콘솔 속성 (URL 접두어, non-www)
const RANGES       = [1, 7, 28, 90];   // 1 = 오늘

function doGet() {
  const out = { updated: stamp(), ranges: {} };
  RANGES.forEach(function (d) {
    try { out.ranges[String(d)] = collect(d); }
    catch (err) { out.ranges[String(d)] = null; out.error = String(err).slice(0, 300); }
  });
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function stamp() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'M월 d일 HH:mm');
}

function collect(days) {
  // days=1 은 「오늘 하루」. GA4 는 today~today 로 받는다.
  const start = days === 1 ? 'today' : days + 'daysAgo';
  const r = {};

  // 「최근 7일」만 적어두면 그게 언제부터 언제까지인지 알 수 없다. 날짜를 같이 내보낸다.
  const to = new Date(), from = new Date();
  if (days > 1) from.setDate(to.getDate() - (days - 1));
  r.from = ymd(from);
  r.to   = ymd(to);
  r.label = days === 1
    ? label(to)
    : label(from) + ' ~ ' + label(to);

  // ── 전체 요약 ──────────────────────────────────────────
  const tot = ga({
    dateRanges: [{ startDate: start, endDate: 'today' }],
    metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' },
              { name: 'userEngagementDuration' }],
  });
  const t = (tot.rows && tot.rows[0]) ? tot.rows[0].metricValues.map(numOf) : [0, 0, 0];
  r.users = t[0];
  r.views = t[1];
  r.avgEngagement = r.users ? t[2] / r.users : 0;

  // ── 페이지별 ───────────────────────────────────────────
  const pg = ga({
    dateRanges: [{ startDate: start, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' },
              { name: 'totalUsers' }],
    orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }],
    limit: 12,
  });
  r.pages = (pg.rows || []).map(function (row) {
    const v = row.metricValues.map(numOf);
    const p = row.dimensionValues[0].value;
    return { path: p, name: pageName(p), views: v[0],
             avgEngagement: v[2] ? v[1] / v[2] : 0 };
  });

  // ── 버튼 클릭 ──────────────────────────────────────────
  // build.js 에서 심은 이름표. 이름이 바뀌면 여기도 같이 고칠 것.
  const LABEL = {
    online_class_click:  '온라인 강의 (구매·맛보기)',
    kakao_consult_click: '즉시 상담 (카카오톡)',
  };
  const ev = ga({
    dateRanges: [{ startDate: start, endDate: 'today' }],
    dimensions: [{ name: 'eventName' }, { name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: Object.keys(LABEL) },
      },
    },
    orderBys: [{ desc: true, metric: { metricName: 'eventCount' } }],
    limit: 50,
  });
  const acc = {};
  (ev.rows || []).forEach(function (row) {
    const name = row.dimensionValues[0].value;
    const page = row.dimensionValues[1].value;
    const n = numOf(row.metricValues[0]);
    if (!acc[name]) acc[name] = { label: LABEL[name] || name, count: 0, topPage: page, topN: 0 };
    acc[name].count += n;
    if (n > acc[name].topN) { acc[name].topN = n; acc[name].topPage = page; }
  });
  r.events = Object.keys(acc).map(function (k) { return acc[k]; })
                   .sort(function (a, b) { return b.count - a.count; });
  r.onlineClicks = acc.online_class_click ? acc.online_class_click.count : 0;
  r.kakaoClicks  = acc.kakao_consult_click ? acc.kakao_consult_click.count : 0;

  // ── 유입 경로 ──────────────────────────────────────────
  const src = ga({
    dateRanges: [{ startDate: start, endDate: 'today' }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'totalUsers' }],
    orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
    limit: 10,
  });
  const rows = (src.rows || []).map(function (row) {
    return { name: pretty(row.dimensionValues[0].value), users: numOf(row.metricValues[0]) };
  });
  const sum = rows.reduce(function (a, b) { return a + b.users; }, 0) || 1;
  r.sources = rows.map(function (x) {
    x.share = Math.round(x.users / sum * 100); return x;
  });

  // ── 광고 유입 ──────────────────────────────────────────
  // 네이버는 utm_* 를 붙여야 자연 검색과 갈린다. 구글은 자동 태깅(gclid)이 처리한다.
  r.ads = { naver: [], google: [], spendNote: '' };
  try {
    const nv = ga({
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: 'sessionManualTerm' }],
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
      dimensionFilter: { filter: { fieldName: 'sessionSourceMedium',
        stringFilter: { matchType: 'CONTAINS', value: 'naver / cpc' } } },
      orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
      limit: 20,
    });
    r.ads.naver = (nv.rows || []).map(function (row) {
      const k = row.dimensionValues[0].value;
      return { keyword: (k && k !== '(not set)') ? k : '검색어 미확인',
               users: numOf(row.metricValues[0]), sessions: numOf(row.metricValues[1]) };
    });
  } catch (e) { r.ads.naverError = String(e).slice(0, 160); }

  try {
    const gg = ga({
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: 'sessionGoogleAdsKeyword' }],
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
      orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
      limit: 20,
    });
    r.ads.google = (gg.rows || []).filter(function (row) {
      const k = row.dimensionValues[0].value;
      return k && k !== '(not set)' && k !== '(organic)';
    }).map(function (row) {
      return { keyword: row.dimensionValues[0].value,
               users: numOf(row.metricValues[0]), sessions: numOf(row.metricValues[1]) };
    });
  } catch (e) { r.ads.googleError = String(e).slice(0, 160); }

  // ── 누가 보고 있나 (성별·연령·지역) ──────────────────────
  // 성별·연령은 「Google 신호 데이터」를 켜야 값이 들어온다. 안 켜면 전부 (not set).
  r.who = { gender: [], age: [], country: [], city: [] };
  const demo = [
    ['gender',  'userGender'],
    ['age',     'userAgeBracket'],
    ['country', 'country'],
    ['city',    'city'],
  ];
  demo.forEach(function (pair) {
    try {
      const d = ga({
        dateRanges: [{ startDate: start, endDate: 'today' }],
        dimensions: [{ name: pair[1] }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
        limit: 12,
      });
      const rows = (d.rows || []).map(function (row) {
        return { name: human(pair[0], row.dimensionValues[0].value),
                 users: numOf(row.metricValues[0]) };
      });
      const tot = rows.reduce(function (a, b) { return a + b.users; }, 0) || 1;
      r.who[pair[0]] = rows.map(function (x) {
        x.share = Math.round(x.users / tot * 100); return x;
      });
    } catch (e) { r.who[pair[0]] = []; }
  });

  // ── 서치콘솔 검색어 ────────────────────────────────────
  try {
    const to = new Date(), from = new Date();
    if (days > 1) from.setDate(to.getDate() - days);
    const q = sc({
      startDate: ymd(from), endDate: ymd(to),
      dimensions: ['query'], rowLimit: 12,
    });
    r.queries = (q.rows || []).map(function (row) {
      return { query: row.keys[0], clicks: row.clicks, impressions: row.impressions };
    });
  } catch (e) {
    r.queries = [];   // 서치콘솔은 등록 직후 며칠간 비어 있다
  }

  return r;
}

/* GA4 Data API — 고급 서비스 대신 REST 직접 호출 */
function ga(body) {
  return post('https://analyticsdata.googleapis.com/v1beta/properties/'
              + GA4_PROPERTY + ':runReport', body);
}

/* 서치콘솔 Search Analytics */
function sc(body) {
  return post('https://searchconsole.googleapis.com/webmasters/v3/sites/'
              + encodeURIComponent(SC_SITE) + '/searchAnalytics/query', body);
}

function post(url, body) {
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error('HTTP ' + code + ' ' + text.slice(0, 200));
  return JSON.parse(text);
}

function numOf(mv) { return Number(mv.value) || 0; }

function ymd(d) { return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd'); }

function label(d) { return Utilities.formatDate(d, 'Asia/Seoul', 'M월 d일'); }

/* GA4 가 주는 값은 영어이거나 (not set) 이다. 사람이 읽는 말로 바꾼다. */
function human(kind, v) {
  if (!v || v === '(not set)' || v === 'unknown') return '알 수 없음';
  if (kind === 'gender') return { male: '남성', female: '여성' }[v] || v;
  if (kind === 'age')    return v.replace('age', '').replace('_', '~') + '세';
  if (kind === 'country') return { 'South Korea': '대한민국', 'United States': '미국',
    'Japan': '일본', 'China': '중국', 'Canada': '캐나다', 'Vietnam': '베트남' }[v] || v;
  if (kind === 'city') return { Seoul: '서울', Incheon: '인천', Busan: '부산', Daegu: '대구',
    Daejeon: '대전', Gwangju: '광주', Suwon: '수원', Seongnam: '성남',
    Goyang: '고양', Yongin: '용인', Bucheon: '부천' }[v] || v;
  return v;
}

/* 경로만 봐서는 어느 페이지인지 안 보인다. 한글 이름을 붙인다. */
function pageName(p) {
  const base = String(p).split('?')[0].replace(/\/index\.html$/, '/');
  const m = {
    '/': '홈',
    '/online.html': '온라인 강의',
    '/offline.html': '오프라인 강의',
    '/curriculum.html': '커리큘럼',
    '/reviews.html': '수강 후기',
    '/works.html': '수강생 작품',
    '/news.html': '피바뉴스',
  };
  if (m[base]) return m[base];
  if (/^\/news-/.test(base)) return '피바뉴스 · ' + base.replace(/^\/news-|\.html$/g, '');
  if (/^\/stats-/.test(base)) return '통계 대시보드';
  return base;
}

/* sessionSourceMedium 은 'naver / organic' 같은 모양이라 사람이 읽게 다듬는다 */
function pretty(v) {
  const m = {
    'naver / organic':    '네이버 검색',
    'google / organic':   '구글 검색',
    'daum / organic':     '다음 검색',
    '(direct) / (none)':  '직접 유입 · 즐겨찾기',
    'instagram / referral': '인스타그램',
    'l.instagram.com / referral': '인스타그램',
    'm.blog.naver.com / referral': '네이버 블로그',
    'blog.naver.com / referral':   '네이버 블로그',
    'youtube.com / referral': '유튜브',
    'litt.ly / referral': '리틀리',
    // UTM 을 붙인 링크는 여기로 들어온다 (~/Documents/FVA/광고_링크/utm_링크.md)
    'instagram / bio': '인스타 프로필 링크',
    'instagram / story': '인스타 스토리',
    'instagram / post': '인스타 게시물',
    'instagram / paid_social': '인스타 광고',
    'littly / referral': '리틀리',
    'youtube / social': '유튜브',
    'naverblog / social': '네이버 블로그',
    'kakao / social': '카카오톡 채널',
    'filmmakers / display': '필름메이커스 광고',
    'bowiestudioskr-hub.github.io / referral': '옛 후기 페이지(리다이렉트)',
    'pf.kakao.com / referral': '카카오톡 채널',
    'app.publr.co / referral': '퍼블 수강 페이지',
    '(not set)': '경로 불명',
    '(direct) / (not set)': '직접 유입 · 즐겨찾기',
  };
  if (m[v]) return m[v];
  // 'xxx / organic' 같은 미등록 조합도 읽기 쉽게 풀어준다
  const parts = String(v).split(' / ');
  const kind = { organic: '검색', referral: '링크 타고', cpc: '광고', social: 'SNS', none: '직접' }[parts[1]];
  return kind ? parts[0] + ' ' + kind : v;
}
