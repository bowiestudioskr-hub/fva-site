/**
 * 리틀리 개강일 그림을 원본으로 삼아 사이트(베이직·마스터)와 카톡 자동응답을 맞춘다.
 *
 *   node tools/개강일_감시.mjs           보기만 한다 (다르면 알려주고 끝)
 *   node tools/개강일_감시.mjs --적용     다르면 사이트를 고쳐 밀어넣고 카톡까지 갱신한다
 *
 * 리틀리의 개강일은 **그림(JPEG)** 이다. 켜져 있는 갤러리 그림을 받아 맥 글자 인식(tools/ocr.swift)으로 읽는다.
 *   읽는 줄 모양:  「금 저녁반 | 19:00 -21:00 | 개강일 :1월 8일(금)」  · 마스터 기수: 「21기 수강 신청중」
 *
 * ⚠ 하나라도 의심스러우면 **아무것도 하지 않는다**(반쯤 맞은 날짜를 올리느니 가만히 있는 게 낫다).
 *   - BASIC CLASS·MASTER CLASS 두 덩어리가 다 있어야 하고 각각 반이 1개 이상
 *   - 반 이름은 요일로 시작해야 하고, 그 요일 = 날짜의 실제 요일 = 괄호 속 요일 (글자 인식 오류를 거른다)
 *   - 시각은 HH:MM, 시작 < 끝
 * ⚠ 글자 인식은 그림이 바뀌었을 때만 돈다(그림 번호를 기억해 둔다).
 * ⚠ 밀어넣기는 bowiestudioskr-hub 계정 토큰으로 한 번만 쓴다 — gh 의 기본 계정은 건드리지 않는다.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..');
const 폴더 = join(process.env.HOME, 'Library', 'Application Support', 'fva');
const 기록 = join(폴더, '개강일_감시.log');
const 적용 = process.argv.includes('--적용') || process.argv.includes('--미리');
const 이제 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const 남기기 = (s) => { console.log(s); try { appendFileSync(기록, `[${이제}] ${s}\n`); } catch {} };
const 요일 = ['일', '월', '화', '수', '목', '금', '토'];
const 리틀리주소 = 'https://litt.ly/bowiestudios';

/* ── 1. 리틀리 블록 ─────────────────────────────── */
const F = join(폴더, 'littly.env');
if (!existsSync(F)) { 남기기('건너뜀: 리틀리 토큰이 없다'); process.exit(0); }
const env = Object.fromEntries(readFileSync(F, 'utf8').split('\n').filter(l => l.includes('='))
  .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
let 블록;
try {
  const r = await fetch(`https://api.litt.ly/v0/page/${env.LITTLY_PAGE_ID || '62819'}`,
                        { headers: { Authorization: 'Bearer ' + env.LITTLY_TOKEN } });
  if (!r.ok) { 남기기(`건너뜀: 리틀리 ${r.status} — 토큰이 죽었을 수 있다`); process.exit(0); }
  블록 = ((await r.json()).data || {}).blocks || [];
} catch (e) { 남기기('건너뜀: 리틀리를 못 읽었다 — ' + String(e.message).slice(0, 60)); process.exit(0); }

/* ── 2. 켜진 갤러리 그림을 읽어 개강표를 찾는다 ───── */
const 그림들 = 블록.filter(b => b.type === 'gallery' && b.use).flatMap(b => b.images || []);
const 캐시파일 = join(폴더, '개강일_그림캐시.json');
const 캐시 = existsSync(캐시파일) ? JSON.parse(readFileSync(캐시파일, 'utf8')) : {};
let 글 = null, 그림번호 = null;
for (const g of 그림들) {
  const 키 = String(g.mediaId || g.url);
  let t = 캐시[키];
  if (t == null) {
    try {
      const r = await fetch('https://cdn.litt.ly' + g.url);
      if (!r.ok) continue;
      mkdirSync(폴더, { recursive: true });
      const p = join(폴더, '_리틀리그림.jpg');
      writeFileSync(p, Buffer.from(await r.arrayBuffer()));
      t = execFileSync('/usr/bin/swift', [join(HERE, 'ocr.swift'), p], { encoding: 'utf8', timeout: 180000 });
      캐시[키] = t; writeFileSync(캐시파일, JSON.stringify(캐시));
    } catch (e) { 남기기('건너뜀: 그림 글자 인식 실패 — ' + String(e.message).slice(0, 60)); process.exit(0); }
  }
  if (/BASIC\s*CLASS/i.test(t) && /MASTER\s*CLASS/i.test(t)) { 글 = t; 그림번호 = 키; break; }
}
if (!글) { 남기기('건너뜀: 리틀리에 개강일 그림(BASIC·MASTER)이 없다'); process.exit(0); }

/* ── 3. 풀기 + 검증 ─────────────────────────────── */
const 덩어리 = (이름, 다음) => {
  const a = 글.search(new RegExp(이름 + '\\s*CLASS', 'i'));
  const b = 다음 ? 글.search(new RegExp(다음 + '\\s*CLASS', 'i')) : -1;
  return a < 0 ? '' : 글.slice(a, b > a ? b : undefined);
};
const 오늘 = new Date(Date.now() + 9 * 3600e3); 오늘.setUTCHours(0, 0, 0, 0);
function 날짜(월, 일) {          // 오늘 기준 60일 전 이후의 가장 가까운 그 월·일
  for (const y of [오늘.getUTCFullYear() - 1, 오늘.getUTCFullYear(), 오늘.getUTCFullYear() + 1]) {
    const d = new Date(Date.UTC(y, 월 - 1, 일));
    if (d.getUTCMonth() === 월 - 1 && d >= new Date(오늘 - 60 * 864e5)) return d;
  }
  return null;
}
const 문제 = [];
function 반들(조각, 판이름) {
  const 줄규칙 = /^\s*(.+?반)\s*\|?\s*(\d{1,2}):(\d{2})\s*[-–~]\s*(\d{1,2}):(\d{2})\s*\|?\s*개강일\s*[:：]?\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*\(\s*(.)\s*\)/;
  const 결과 = [];
  for (const 줄 of 조각.split('\n')) {
    const m = 줄.match(줄규칙); if (!m) continue;
    const 반 = m[1].replace(/\s+/g, ' ').trim();
    const d = 날짜(+m[6], +m[7]);
    const 첫 = 반[0];
    if (!d) { 문제.push(`${판이름} ${반}: 날짜 이상`); continue; }
    const 실제 = 요일[d.getUTCDay()];
    if (!요일.includes(첫)) 문제.push(`${판이름} ${반}: 반 이름이 요일로 시작하지 않음`);
    if (첫 !== 실제 || m[8] !== 실제) 문제.push(`${판이름} ${반}: 요일 불일치(이름 ${첫}·괄호 ${m[8]}·실제 ${실제})`);
    const 시작 = (+m[2]) * 60 + (+m[3]), 끝 = (+m[4]) * 60 + (+m[5]);
    if (!(시작 < 끝) || +m[2] > 23 || +m[4] > 23) 문제.push(`${판이름} ${반}: 시각 이상`);
    결과.push({ 반, 때: `${m[2].padStart(2, '0')}:${m[3]} – ${m[4].padStart(2, '0')}:${m[5]}`,
               날: d.toISOString().slice(0, 10), 한글: `${+m[6]}월 ${+m[7]}일 (${실제})` });
  }
  if (!결과.length) 문제.push(`${판이름}: 반을 하나도 못 읽음`);
  return 결과;
}
const 베이직 = 반들(덩어리('BASIC', 'MASTER'), 'BASIC');
const 마스터조각 = 덩어리('MASTER', 'PROFESSIONAL');
const 마스터 = 반들(마스터조각, 'MASTER');
const 기수 = ((마스터조각.match(/(\d{1,3})\s*기\s*수강\s*신청\s*중/) || [])[1]);
if (!기수) 문제.push('MASTER: 기수(「NN기 수강신청중」)를 못 읽음');
/* 프로페셔널(캠프): 「CAMP 1기 모집중」 + 「기간 :12월 19일 오전 9시 ~ 12월 20일 22시」. 덩어리가 없으면 건너뛴다(필수 아님). */
const 프로조각 = 덩어리('PROFESSIONAL', null);
let 프로 = null;
if (프로조각) {
  const 기 = (프로조각.match(/CAMP\s*(\d{1,3})\s*기/i) || [])[1];
  const m = 프로조각.match(/기간\s*[:：]?\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*(오전|오후)?\s*(\d{1,2})\s*시\s*[~∼-]\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*(오전|오후)?\s*(\d{1,2})\s*시/);
  if (!기 || !m) 문제.push('PROFESSIONAL: 기수나 기간을 못 읽음');
  else {
    const 시 = (오후, h) => (오후 === '오후' && +h < 12 ? +h + 12 : +h);
    const d1 = 날짜(+m[1], +m[2]), d2 = 날짜(+m[5], +m[6]);
    const h1 = 시(m[3], m[4]), h2 = 시(m[7], m[8]);
    if (!d1 || !d2 || d2 < d1 || h1 > 23 || h2 > 24) 문제.push('PROFESSIONAL: 기간 이상');
    else 프로 = { 기: 기, 반목록: [{ 반: '주말 캠프', 때: `${String(h1).padStart(2, '0')}:00 – ${String(h2).padStart(2, '0')}:00`,
      날: d1.toISOString().slice(0, 10), 한글: `${+m[1]}월 ${+m[2]}일 (${요일[d1.getUTCDay()]})` }] };
  }
}
if (문제.length) { 남기기('멈춤: 그림을 확실히 못 읽었다 — ' + 문제.join(' / ')); process.exit(0); }

/* 카톡 문안의 원본 — 날짜는 여기(리틀리)에서만 가져간다 */
writeFileSync(join(폴더, '개강일_리틀리.json'), JSON.stringify({ 읽은때: 이제, 베이직, 마스터: { 기수, 반목록: 마스터 }, 프로 }, null, 1));

/* ── 4. 사이트에 쓰기(메모리 안에서) ─────────────── */
/* ⚠ 2026-11-16 정주: 사이트에는 개강일을 적지 않는다(헷갈림 방지, 개강일은 리틀리 한 곳에서만).
     사이트에는 반 이름·시간만 맞추고, 날짜는 카톡 자동응답에만 넣는다. */
const 칸 = (r) =>
`        <div class="nt-row">
          <span class="cls">${r.반}</span>
          <span class="time">${r.때.replace(' – ', ' &ndash; ')}</span>
        </div>`;
const 배열 = () => 'var 개강 = [];';
function 고치기(파일, 반목록, 기수값) {
  const p = join(SITE, 파일); let s = readFileSync(p, 'utf8'); const 원래 = s;
  const 표 = /(<div class="nt-table">\s*\n)([\s\S]*?)(\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<div class="nt-how">|\n\s{4}<\/div>\s*\n\s{2}<\/div>)/;
  if (!표.test(s)) throw new Error(파일 + ': 개강 표 자리를 못 찾음');
  s = s.replace(표, (_, a, 몸, c) => {
    const 주석 = (몸.match(/^\s*<!--[\s\S]*?-->\s*\n/) || [''])[0];
    return a + 주석 + 반목록.map(칸).join('\n') + c;
  });
  const 배열규칙 = /var 개강 = \[[\s\S]*?\];/;
  if (!배열규칙.test(s)) throw new Error(파일 + ': 개강 배열을 못 찾음');
  s = s.replace(배열규칙, 배열());
  if (기수값) {
    s = s.replace(/(<strong id="nt-h">)\d+기( 수강신청중<\/strong>)/, `$1${기수값}기$2`)
         .replace(/(<strong id="nt-say">)\d+기( 수강생)/, `$1${기수값}기$2`)
         .replace(/var 기수 = '\d+기';/, `var 기수 = '${기수값}기';`);
  }
  return { p, s, 바뀜: s !== 원래 };
}
let 결과;
try {
  결과 = [고치기('basic.html', 베이직, null), 고치기('offline.html', 마스터, 기수)];
  if (프로 && existsSync(join(SITE, 'professional.html'))) {
    const r = 고치기('professional.html', 프로.반목록, null);
    r.s = r.s.replace(/(CAMP\s*)\d+(기)/g, `$1${프로.기}$2`); r.바뀜 = r.s !== readFileSync(r.p, 'utf8');
    결과.push(r);
  }
}
catch (e) { 남기기('멈춤: ' + e.message); process.exit(0); }

const 요약 = `BASIC ${베이직.map(r => r.반 + ' ' + r.날).join(', ')} · MASTER ${기수}기 ${마스터.map(r => r.반 + ' ' + r.날).join(', ')}` + (프로 ? ` · CAMP ${프로.기}기 ${프로.반목록[0].날} ${프로.반목록[0].때}` : '');
if (!결과.some(x => x.바뀜)) {
  남기기('○ 리틀리 = 사이트. (' + 요약 + ')');
  /* 사이트는 같아도 카톡만 어긋나 있을 수 있다 — 적용 모드면 카톡도 대조한다(같으면 안 건드림) */
  if (적용 && !process.argv.includes('--미리')) {
    try { const 답 = execFileSync(process.execPath, [join(HERE, '개강일_카톡.mjs'), '--쓰기'], { cwd: SITE, encoding: 'utf8', timeout: 240000 });
          남기기('  카톡 ' + (/이미 같은/.test(답) ? '같음' : /저장 확인/.test(답) ? '갱신됨' : '결과 확인 필요')); }
    catch (e) { 남기기('  ⚠ 카톡 확인 실패 — ' + String((e.stdout||'')+e.message).split('\n').filter(Boolean).pop().slice(0,120)); }
  }
  process.exit(0);
}
남기기('▲ 달라졌다 → ' + 요약);
if (!적용) { 남기기('  (--적용 을 붙이면 사이트와 카톡을 맞춘다)'); process.exit(0); }

/* ── 5. 저장·밀어넣기 ───────────────────────────── */
const 미리 = execFileSync('git', ['status', '--porcelain'], { cwd: SITE, encoding: 'utf8' }).trim();
if (미리) { 남기기('멈춤: 사이트 폴더에 커밋 안 된 손작업이 있다 — 사람이 정리할 것'); process.exit(0); }
for (const x of 결과) if (x.바뀜) writeFileSync(x.p, x.s);
if (process.argv.includes('--미리')) { 남기기('  (--미리: 파일만 고쳐 두고 멈춤)'); process.exit(0); }
execFileSync('python3', [join(HERE, 'bust.py')], { cwd: SITE, encoding: 'utf8' });
const 손댄것 = execFileSync('git', ['diff', '--name-only'], { cwd: SITE, encoding: 'utf8' }).split('\n').filter(Boolean);
const 남는것 = 손댄것.filter(f => !['basic.html', 'offline.html', 'professional.html'].includes(f));
if (남는것.length) { execFileSync('git', ['checkout', '--', ...손댄것], { cwd: SITE });
  남기기('멈춤: 예상 밖 파일이 바뀌어 되돌렸다 — ' + 남는것.join(', ')); process.exit(1); }
execFileSync('git', ['add', ...손댄것], { cwd: SITE });
execFileSync('git', ['commit', '-q', '-m', '개강일 갱신 — 리틀리 그림에서 자동으로\n\n' + 요약], { cwd: SITE });
try {
  const 토큰 = execFileSync('/opt/homebrew/bin/gh', ['auth', 'token', '--user', 'bowiestudioskr-hub'], { encoding: 'utf8' }).trim();
  execFileSync('git', ['push', '-q', `https://x-access-token:${토큰}@github.com/bowiestudioskr-hub/fva-site.git`, 'HEAD:main'], { cwd: SITE, stdio: 'pipe' });
  execFileSync('git', ['fetch', '-q', 'origin'], { cwd: SITE });
  남기기('  사이트 밀어넣음');
} catch (e) { 남기기('  ⚠ 밀어넣기 실패(커밋은 남음) — ' + String(e.message).replace(/x-access-token:[^@]+@/, '***@').slice(0, 120)); }

/* ── 6. 카톡 자동응답 ───────────────────────────── */
try {
  const 답 = execFileSync(process.execPath, [join(HERE, '개강일_카톡.mjs'), '--쓰기'], { cwd: SITE, encoding: 'utf8', timeout: 240000 });
  남기기('  카톡 ' + (/저장 확인|이미 같은/.test(답) ? '갱신됨' : '결과 확인 필요: ' + 답.trim().split('\n').pop()));
} catch (e) {
  남기기('  ⚠ 카톡은 못 바꿨다(어사이드 꺼짐/카카오 로그인 풀림). 맥에서 `node tools/개강일_카톡.mjs --쓰기` 한 번 돌릴 것.');
}
남기기('끝');
