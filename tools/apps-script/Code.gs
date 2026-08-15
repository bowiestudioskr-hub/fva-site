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
 * 3. 왼쪽 「서비스 +」 → Google Analytics Data API 추가 (식별자 AnalyticsData)
 *                    → Search Console API 추가        (식별자 Searchconsole)
 * 4. 배포 → 새 배포 → 유형 「웹 앱」
 *      실행 계정  : 나
 *      액세스 권한: 링크가 있는 모든 사용자
 * 5. 나온 웹 앱 URL 을 대시보드에 넣으면 끝
 * ────────────────────────────────────────────────────────
 */

const GA4_PROPERTY = '550057103';        // fva.co.kr 속성 (측정 ID G-79SFDWBK3L)
const SC_SITE      = 'https://fva.co.kr/'; // 서치콘솔 속성 (URL 접두어, non-www)
const RANGES       = [7, 28, 90];

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
  const start = days + 'daysAgo';
  const r = {};

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
    return { path: row.dimensionValues[0].value, views: v[0],
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

  // ── 서치콘솔 검색어 ────────────────────────────────────
  try {
    const to = new Date(), from = new Date();
    from.setDate(to.getDate() - days);
    const sc = Searchconsole.Searchanalytics.query({
      startDate: ymd(from), endDate: ymd(to),
      dimensions: ['query'], rowLimit: 12,
    }, SC_SITE);
    r.queries = (sc.rows || []).map(function (row) {
      return { query: row.keys[0], clicks: row.clicks, impressions: row.impressions };
    });
  } catch (e) {
    r.queries = [];   // 서치콘솔은 등록 직후 며칠간 비어 있다
  }

  return r;
}

/* GA4 Data API 한 방 호출 */
function ga(body) {
  return AnalyticsData.Properties.runReport(body, 'properties/' + GA4_PROPERTY);
}

function numOf(mv) { return Number(mv.value) || 0; }

function ymd(d) { return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd'); }

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
  };
  return m[v] || v;
}
