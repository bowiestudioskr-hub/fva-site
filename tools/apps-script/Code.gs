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

/* 기간 네 개를 매번 새로 계산하면 GA4 를 스무 번 넘게 부르게 되어 8~10초가 걸린다.
   대시보드는 3분마다 다시 읽으므로 그 사이에는 같은 값을 줘도 된다. 캐시로 받아둔다.
   ?fresh=1 을 붙이면 캐시를 건너뛴다 — 방금 고친 게 반영됐는지 확인할 때 쓴다. */
const CACHE_KEY  = 'feed-v9';
// 캐시가 비면 처음 연 사람이 15초를 그대로 기다린다. 그래서 짧게 두지 않고,
// 맥에서 15분마다 도는 자동 갱신(ads_sync.sh)이 ?fresh=1 로 미리 데워둔다.
// 20분으로 잡아 그 주기보다 넉넉히 길게 —— 한 번 걸러도 캐시가 안 비도록.
const CACHE_SECS = 1200;

function doGet(e) {
  const fresh = !!(e && e.parameter && e.parameter.fresh);
  const cache = CacheService.getScriptCache();

  if (!fresh) {
    const hit = cache.get(CACHE_KEY);
    if (hit) return json(hit);
  }

  const out = { updated: stamp(), ranges: {} };
  RANGES.forEach(function (d) {
    try { out.ranges[String(d)] = collect(d); }
    catch (err) { out.ranges[String(d)] = null; out.error = String(err).slice(0, 300); }
  });

  const body = JSON.stringify(out);
  // 캐시 한 칸은 100KB 까지다. 넘치면 넣지 않고 그냥 내보낸다.
  if (body.length < 95000) {
    try { cache.put(CACHE_KEY, body, CACHE_SECS); } catch (err) { /* 캐시 실패는 무시 */ }
  }
  return json(body);
}

function json(body) {
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
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
  /* 몇 명 왔는지만으로는 채널을 비교할 수 없다. 싸게 많이 데려와도 3초 만에
     나가면 소용이 없고, 적게 와도 상담을 누르면 값어치가 있다.
     그래서 경로마다 「얼마나 머물렀나 · 몇 장 봤나 · 뭘 눌렀나 · 어디로 들어왔나」를 같이 낸다.
     ⚠ 세션 단위 지표(averageSessionDuration 등)를 써야 한다. 사용자 단위 지표는
        sessionSourceMedium 과 궁합이 안 맞아 0 으로 돌아온다. 한 번 겪었다. */
  const src = ga({
    dateRanges: [{ startDate: start, endDate: 'today' }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' },
              { name: 'averageSessionDuration' }, { name: 'screenPageViewsPerSession' },
              { name: 'engagementRate' }, { name: 'bounceRate' }],
    orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
    limit: 12,
  });

  // 경로별로 무엇을 눌렀나
  const srcHits = {};
  try {
    const eh = ga({
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: 'sessionSourceMedium' }, { name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName',
        inListFilter: { values: ['online_class_click', 'kakao_consult_click'] } } },
      limit: 60,
    });
    (eh.rows || []).forEach(function (row) {
      const k = row.dimensionValues[0].value;
      const n = row.dimensionValues[1].value;
      if (!srcHits[k]) srcHits[k] = { online: 0, kakao: 0 };
      if (n === 'online_class_click') srcHits[k].online += numOf(row.metricValues[0]);
      else srcHits[k].kakao += numOf(row.metricValues[0]);
    });
  } catch (e) { /* 눌린 게 없으면 그냥 비어 있다 */ }

  // 경로별로 어디에 도착했나 — 광고가 어느 페이지로 보내고 있는지 드러난다
  const srcLand = {};
  try {
    const lp = ga({
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: 'sessionSourceMedium' }, { name: 'landingPage' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
      limit: 60,
    });
    (lp.rows || []).forEach(function (row) {
      const k = row.dimensionValues[0].value;
      if (srcLand[k]) return;                 // 정렬돼 있으므로 첫 줄이 가장 많은 곳
      srcLand[k] = pageName(row.dimensionValues[1].value);
    });
  } catch (e) { /* 도착 페이지는 없어도 나머지는 낸다 */ }

  const rows = (src.rows || []).map(function (row) {
    const raw = row.dimensionValues[0].value;
    const v = row.metricValues.map(numOf);
    const h = srcHits[raw] || { online: 0, kakao: 0 };
    return {
      name: pretty(raw), raw: raw,
      users: v[0], sessions: v[1],
      engage: v[2],            // 세션당 평균 체류(초)
      pages: v[3],             // 세션당 본 페이지 수
      engaged: v[4],           // 참여 세션 비율 (0~1)
      bounce: v[5],            // 바로 나간 비율 (0~1)
      kakao: h.kakao, online: h.online,
      landing: srcLand[raw] || '',
    };
  });
  const sum = rows.reduce(function (a, b) { return a + b.users; }, 0) || 1;
  r.sources = rows.map(function (x) {
    x.share = Math.round(x.users / sum * 100); return x;
  });

  // ── 광고 유입 ──────────────────────────────────────────
  // 네이버는 utm_* 를 붙여야 자연 검색과 갈린다. 구글은 자동 태깅(gclid)이 처리한다.
  r.ads = { naver: [], google: [], spendNote: '' };

  /* 검색어별로 몇 명 왔는지만 봐서는 그 검색어가 쓸모 있는지 알 수 없다.
     들어와서 30초 만에 나갔는지, 커리큘럼을 읽고 상담을 눌렀는지가 판단 근거다.
     그래서 사람 수와 함께 「머문 시간」과 「무엇을 눌렀나」를 같이 뽑는다.
     ⚠ 광고 검색어 차원은 세션 단위라 이벤트와 붙일 때 표본이 작으면 GA4 가 값을 가린다.
        그 경우 conv 는 0 으로 온다 — 실제로 0인 것과 구분되지 않으니 단정하지 말 것. */
  function adKeywords(dim, filter) {
    const q = {
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: dim }],
      // ⚠ userEngagementDuration·screenPageViews 는 사용자 단위라 광고 검색어(세션 단위)와
      //   같이 뽑으면 GA4 가 0 을 준다. 세션 단위 지표로 물어야 값이 들어온다.
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' },
                { name: 'averageSessionDuration' }, { name: 'screenPageViewsPerSession' },
                { name: 'engagementRate' }],
      orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }],
      limit: 20,
    };
    if (filter) q.dimensionFilter = filter;
    const d = ga(q);

    // 같은 조건으로 「무엇을 눌렀나」를 따로 센다. 한 번에 뽑으면 이벤트가 있는 세션만 남는다.
    const hits = {};
    try {
      const e = ga({
        dateRanges: [{ startDate: start, endDate: 'today' }],
        dimensions: [{ name: dim }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: filter ? {
          andGroup: { expressions: [filter, {
            filter: { fieldName: 'eventName',
              inListFilter: { values: ['online_class_click', 'kakao_consult_click'] } } }] },
        } : {
          filter: { fieldName: 'eventName',
            inListFilter: { values: ['online_class_click', 'kakao_consult_click'] } },
        },
        limit: 50,
      });
      (e.rows || []).forEach(function (row) {
        const k = row.dimensionValues[0].value;
        const name = row.dimensionValues[1].value;
        if (!hits[k]) hits[k] = { online: 0, kakao: 0 };
        if (name === 'online_class_click') hits[k].online += numOf(row.metricValues[0]);
        else hits[k].kakao += numOf(row.metricValues[0]);
      });
    } catch (err) { /* 이벤트 조인이 실패해도 사람 수는 내보낸다 */ }

    return (d.rows || []).filter(function (row) {
      const k = row.dimensionValues[0].value;
      return k && k !== '(organic)';
    }).map(function (row) {
      const k = row.dimensionValues[0].value;
      const v = row.metricValues.map(numOf);
      const h = hits[k] || { online: 0, kakao: 0 };
      return {
        keyword: (k && k !== '(not set)') ? k : '검색어 미확인',
        users: v[0], sessions: v[1],
        engage: v[2],          // 세션당 평균 체류(초) — GA4 가 이미 나눠서 준다
        pages: v[3],           // 세션당 본 페이지 수
        engaged: v[4],         // 참여 세션 비율(0~1). 낮으면 들어오자마자 나간 것
        kakao: h.kakao, online: h.online,
      };
    });
  }

  try {
    r.ads.naver = adKeywords('sessionManualTerm',
      { filter: { fieldName: 'sessionSourceMedium',
                  stringFilter: { matchType: 'CONTAINS', value: 'naver / cpc' } } });
  } catch (e) { r.ads.naverError = String(e).slice(0, 160); }

  try {
    // ⚠ 필터를 안 걸면 구글 광고가 아닌 방문까지 전부 「(not set)」으로 딸려온다.
    //   그러면 「검색어 미확인 86명」처럼 사이트 전체 방문이 광고 성과처럼 보인다.
    //   반드시 google / cpc 로 좁힐 것.
    r.ads.google = adKeywords('sessionGoogleAdsKeyword',
      { filter: { fieldName: 'sessionSourceMedium',
                  stringFilter: { matchType: 'CONTAINS', value: 'google / cpc' } } });
  } catch (e) { r.ads.googleError = String(e).slice(0, 160); }

  // ── 시간 흐름 ────────────────────────────────────────────
  // 숫자 하나만 보면 늘었는지 줄었는지를 알 수 없다. 「오늘」은 시간대별,
  // 나머지 기간은 날짜별로 뽑아 대시보드에서 막대로 그린다.
  // 값이 0 인 칸도 채워서 내보낸다. 빈 칸을 빼면 그래프가 실제보다 고르게 보인다.
  r.series = { unit: days === 1 ? 'hour' : 'day', points: [] };
  try {
    const dim = days === 1 ? 'hour' : 'date';
    const s = ga({
      dateRanges: [{ startDate: start, endDate: 'today' }],
      dimensions: [{ name: dim }],
      metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: dim } }],
      limit: 200,
    });
    const got = {};
    (s.rows || []).forEach(function (row) {
      const v = row.metricValues.map(numOf);
      got[row.dimensionValues[0].value] = { users: v[0], views: v[1] };
    });

    if (days === 1) {
      const nowH = Number(Utilities.formatDate(new Date(), 'Asia/Seoul', 'HH'));
      for (let h = 0; h <= nowH; h++) {
        const k = (h < 10 ? '0' : '') + h;
        const g = got[k] || { users: 0, views: 0 };
        r.series.points.push({ k: k, t: h + '시', users: g.users, views: g.views });
      }
    } else {
      const d = new Date(from.getTime());
      while (ymd(d) <= r.to) {
        const k = Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd');
        const g = got[k] || { users: 0, views: 0 };
        r.series.points.push({ k: k, t: label(d), users: g.users, views: g.views });
        d.setDate(d.getDate() + 1);
      }
    }
  } catch (e) { r.series.points = []; }

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
    } catch (e) {
      r.who[pair[0]] = [];
      // 빈 칸만 보이면 「방문자가 없어서」인지 「설정이 꺼져서」인지 구분이 안 된다.
      // GA4 가 돌려준 말을 그대로 실어 보내 대시보드가 이유를 적게 한다.
      r.who[pair[0] + 'Note'] = String(e).slice(0, 200);
    }
  });
  // 성별·연령은 Google 신호 데이터가 있어야 채워진다. 데이터 API 로는 그 설정이
  // 켜졌는지 알 수 없고, 켠 직후에도 며칠은 빈 칸으로 온다. 그래서 「꺼졌다」고
  // 단정하지 않고 「아직 안 들어왔다」고만 알린다. 단정했다가 틀리면 엉뚱한 데를 뒤지게 된다.
  ['gender', 'age'].forEach(function (k) {
    if (!r.who[k].length && !r.who[k + 'Note'] && r.users > 0) {
      r.who[k + 'Note'] = '아직 값 없음';
    }
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

/* GA4 가 주는 로마자 도시명 → 한글.
   전국 시·군을 담았다. 표가 길어 보여도 이게 없으면 「Hamyang-gun」이 그대로 뜬다.
   접미사(-si/-gun)가 붙은 형태와 안 붙은 형태를 둘 다 넣는다 — GA4 가 섞어서 준다. */
const CITY_KO = (function () {
  const m = {
    Seoul: '서울', Busan: '부산', Daegu: '대구', Incheon: '인천', Gwangju: '광주',
    Daejeon: '대전', Ulsan: '울산', Sejong: '세종', Jeju: '제주', Seogwipo: '서귀포',

    Suwon: '수원', Seongnam: '성남', Uijeongbu: '의정부', Anyang: '안양', Bucheon: '부천',
    Gwangmyeong: '광명', Pyeongtaek: '평택', Dongducheon: '동두천', Ansan: '안산',
    Goyang: '고양', Gwacheon: '과천', Guri: '구리', Namyangju: '남양주', Osan: '오산',
    Siheung: '시흥', Gunpo: '군포', Uiwang: '의왕', Hanam: '하남', Yongin: '용인',
    Paju: '파주', Icheon: '이천', Anseong: '안성', Gimpo: '김포', Hwaseong: '화성',
    Yangju: '양주', Pocheon: '포천', Yeoju: '여주', Yeoncheon: '연천', Gapyeong: '가평',
    Yangpyeong: '양평',

    Chuncheon: '춘천', Wonju: '원주', Gangneung: '강릉', Donghae: '동해', Taebaek: '태백',
    Sokcho: '속초', Samcheok: '삼척', Hongcheon: '홍천', Hoengseong: '횡성',
    Yeongwol: '영월', Pyeongchang: '평창', Jeongseon: '정선', Cheorwon: '철원',
    Hwacheon: '화천', Yanggu: '양구', Inje: '인제', Goseong: '고성', Yangyang: '양양',

    Cheongju: '청주', Chungju: '충주', Jecheon: '제천', Boeun: '보은', Okcheon: '옥천',
    Yeongdong: '영동', Jeungpyeong: '증평', Jincheon: '진천', Goesan: '괴산',
    Eumseong: '음성', Danyang: '단양',

    Cheonan: '천안', Gongju: '공주', Boryeong: '보령', Asan: '아산', Seosan: '서산',
    Nonsan: '논산', Gyeryong: '계룡', Dangjin: '당진', Geumsan: '금산', Buyeo: '부여',
    Seocheon: '서천', Cheongyang: '청양', Hongseong: '홍성', Yesan: '예산', Taean: '태안',

    Jeonju: '전주', Gunsan: '군산', Iksan: '익산', Jeongeup: '정읍', Namwon: '남원',
    Gimje: '김제', Wanju: '완주', Jinan: '진안', Muju: '무주', Jangsu: '장수',
    Imsil: '임실', Sunchang: '순창', Gochang: '고창', Buan: '부안',

    Mokpo: '목포', Yeosu: '여수', Suncheon: '순천', Naju: '나주', Gwangyang: '광양',
    Damyang: '담양', Gokseong: '곡성', Gurye: '구례', Goheung: '고흥', Boseong: '보성',
    Hwasun: '화순', Jangheung: '장흥', Gangjin: '강진', Haenam: '해남', Yeongam: '영암',
    Muan: '무안', Hampyeong: '함평', Yeonggwang: '영광', Jangseong: '장성',
    Wando: '완도', Jindo: '진도', Sinan: '신안',

    Pohang: '포항', Gyeongju: '경주', Gimcheon: '김천', Andong: '안동', Gumi: '구미',
    Yeongju: '영주', Yeongcheon: '영천', Sangju: '상주', Mungyeong: '문경',
    Gyeongsan: '경산', Gunwi: '군위', Uiseong: '의성', Cheongsong: '청송',
    Yeongyang: '영양', Yeongdeok: '영덕', Cheongdo: '청도', Goryeong: '고령',
    Seongju: '성주', Chilgok: '칠곡', Yecheon: '예천', Bonghwa: '봉화', Uljin: '울진',
    Ulleung: '울릉',

    Changwon: '창원', Jinju: '진주', Tongyeong: '통영', Sacheon: '사천', Gimhae: '김해',
    Miryang: '밀양', Geoje: '거제', Yangsan: '양산', Uiryeong: '의령', Haman: '함안',
    Changnyeong: '창녕', Namhae: '남해', Hadong: '하동', Sancheong: '산청',
    Hamyang: '함양', Geochang: '거창', Hapcheon: '합천',
  };
  // 「-si」 「-gun」 이 붙은 형태도 같은 값으로 등록해 둔다.
  const out = {};
  Object.keys(m).forEach(function (k) {
    out[k] = m[k];
    out[k + '-si'] = m[k];
    out[k + '-gun'] = m[k];
  });
  return out;
})();

/* GA4 가 주는 값은 영어이거나 (not set) 이다. 사람이 읽는 말로 바꾼다. */
function human(kind, v) {
  if (!v || v === '(not set)' || v === 'unknown') return '알 수 없음';
  if (kind === 'gender') return { male: '남성', female: '여성' }[v] || v;
  if (kind === 'age')    return v.replace('age', '').replace('_', '~') + '세';
  if (kind === 'country') return {
    'South Korea': '대한민국', 'United States': '미국', 'Japan': '일본',
    'China': '중국', 'Taiwan': '대만', 'Hong Kong': '홍콩', 'Singapore': '싱가포르',
    'Canada': '캐나다', 'Australia': '호주', 'Vietnam': '베트남', 'Thailand': '태국',
    'Philippines': '필리핀', 'Indonesia': '인도네시아', 'Malaysia': '말레이시아',
    'India': '인도', 'United Kingdom': '영국', 'Germany': '독일', 'France': '프랑스',
    'Netherlands': '네덜란드', 'Spain': '스페인', 'Italy': '이탈리아',
    'United Arab Emirates': '아랍에미리트', 'Russia': '러시아', 'Brazil': '브라질',
    'Mexico': '멕시코', 'New Zealand': '뉴질랜드',
  }[v] || v;

  if (kind === 'city') {
    // GA4 는 도시를 로마자로 준다. 「Hamyang-gun」 「Chuncheon-si」 같은 식이다.
    // 접미사만 한글로 바꾸면 「Hamyang군」이 되어 더 이상해진다. 이름째로 대조한다.
    const K = CITY_KO[v];
    if (K) return K;
    // 접미사를 뗀 이름으로 한 번 더 찾는다. GA4 가 「Bucheon」처럼 줄 때가 있다.
    const bare = String(v).replace(/-(si|gun|gu|eup|myeon|do)$/, '');
    if (CITY_KO[bare]) return CITY_KO[bare];
    return v;   // 외국 도시는 그대로 둔다
  }
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
  if (/^\/adminmonitor/.test(base)) return '통계 대시보드';
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
