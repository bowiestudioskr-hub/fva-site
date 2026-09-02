/**
 * 개강일 한 곳에서 관리하기 — 사이트·리틀리·카톡 자동응답을 맞춘다.
 *
 *   node tools/개강일.mjs              지금 상태를 보고 카톡 문안을 뽑는다
 *   node tools/개강일.mjs --set "화·목=2026-10-27,토·일=2026-11-01,일요일=2026-11-15,수요일=2026-11-18"
 *                                       사이트(basic·offline)의 날짜를 한 번에 갈아 끼운다
 *
 * ⚠ 카카오톡 자동응답은 **공개 API가 없다.** 프로그램으로 못 바꾼다.
 *   그래서 여기서 문안을 완성해 주고, 관리자센터에 붙여넣는 것만 사람이 한다.
 *
 * ⚠ 리틀리의 개강일은 **그림(JPEG)** 이라 기계가 못 읽는다.
 *   리틀리에 개강일 텍스트 블록을 만들면 이 도구가 그걸 원본으로 삼는다(아래 리틀리읽기 참고).
 *   그전까지는 사이트(basic.html·offline.html)의 개강 배열이 원본이다.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..');
const 요일 = ['일', '월', '화', '수', '목', '금', '토'];

const 판 = [
  { 파일: 'basic.html',   반이름: 'BASIC CLASS',  꼬리: '왕초보 · 주 2회',
    터: '서울 서대문구 연희로8길 18' },
  { 파일: 'offline.html', 반이름: 'MASTER CLASS', 꼬리: null,      // 기수를 파일에서 읽어 붙인다
    터: '서울 마포구 독막로6길 6 현영빌딩 5F' },
];

/* ── 사이트에서 읽기 ─────────────────────────────────
   화면에 적힌 문구(개강 9월 29일 (화))와 스크립트 배열(2026-09-29)이 **둘 다** 있다.
   둘이 어긋나면 카운트다운이 거짓말을 한다 — 그래서 같이 읽어 대조한다. */
function 읽기(파일) {
  const s = readFileSync(join(SITE, 파일), 'utf8');
  const 배열 = [...s.matchAll(/\{\s*반:\s*'([^']+)'\s*,\s*날:\s*'(\d{4}-\d{2}-\d{2})'\s*\}/g)]
    .map(m => ({ 반: m[1], 날: m[2] }));
  const 줄 = [...s.matchAll(
    /<span class="cls">([^<]+)<\/span>\s*<span class="time">([^<]+)<\/span>\s*<span class="start">개강\s*([^<]+)<\/span>/g)]
    .map(m => ({ 반: m[1].replace(/&middot;/g, '·').trim(),
                 때: m[2].replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ').trim(),
                 적힌개강: m[3].trim() }));
  const 기수 = (s.match(/id="nt-h">\s*([^<]*?)\s*수강신청중/) || [])[1] || '';
  return { s, 배열, 줄, 기수 };
}

function 한글날(iso) {
  const d = new Date(iso + 'T00:00:00+09:00');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${요일[d.getDay()]})`;
}
function 짧은날(iso) {
  const d = new Date(iso + 'T00:00:00+09:00');
  return `${d.getMonth() + 1}/${d.getDate()}(${요일[d.getDay()]})`;
}

/* ── 리틀리에 개강일 텍스트 블록이 있으면 그걸 원본으로 ──
   블록 본문에 「개강」과 날짜가 들어 있는 text 블록을 찾는다. 없으면 null. */
async function 리틀리읽기() {
  const F = join(process.env.HOME, 'Library', 'Application Support', 'fva', 'littly.env');
  if (!existsSync(F)) return null;
  const env = Object.fromEntries(readFileSync(F, 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
  if (!env.LITTLY_TOKEN) return null;
  try {
    const r = await fetch(`https://api.litt.ly/v0/page/${env.LITTLY_PAGE_ID || '62819'}`,
                          { headers: { Authorization: 'Bearer ' + env.LITTLY_TOKEN } });
    if (!r.ok) return { 오류: 'HTTP ' + r.status };
    const j = await r.json();
    const 블록 = (j.data && j.data.blocks) || [];
    const 글 = 블록.filter(b => b.type === 'text' && b.use && /개강/.test(b.body || ''))
                   .map(b => b.body).join('\n');
    const 공지 = 블록.filter(b => b.type === 'text' && b.use && /워크샵|파티/.test(b.body || ''))
                     .map(b => b.body).join('\n');
    const 그림 = 블록.filter(b => b.type === 'gallery' && b.use).length;
    return { 개강글: 글 || null, 공지, 그림 };
  } catch (e) { return { 오류: String(e.message).slice(0, 80) }; }
}

/* ── 카톡 자동응답 문안 ──────────────────────────────
   ⚠ 카카오 자동응답은 400자 제한이다. 넘으면 잘린다 — 마지막에 세어 본다. */
function 카톡문안(모음) {
  const 토막 = 모음.map(({ 판, 정보 }) => {
    /* 두 반의 머리글 모양을 맞춘다 — 한쪽만 괄호를 쓰면 눈에 걸린다. */
    const 머리 = 판.꼬리 ? `${판.반이름} · ${판.꼬리}`
                          : `${판.반이름} ${정보.기수} · 주 1회`;
    const 줄 = 정보.줄.map((r, i) => {
      const 날 = (정보.배열[i] || {}).날;
      return `· ${r.반} ${r.때.replace(/–/g, '-')} → ${날 ? 짧은날(날) : r.적힌개강} 개강`;
    });
    return [`▪ ${머리}`, 판.터, ...줄].join('\n');
  });
  return ['📅 개강일 안내', '', ...토막.join('\n\n').split('\n'), '',
          '두 반 모두 다른 요일로 보강 가능합니다.', '',
          '자세히 보기 ▶ fva.co.kr'].join('\n');
}

/* ── --set 으로 날짜 갈아 끼우기 ─────────────────────
   화면 문구와 스크립트 배열을 **같이** 바꾼다. 하나만 바꾸면 카운트다운이 어긋난다. */
function 갈아끼우기(고칠것) {
  for (const 판하나 of 판) {
    const p = join(SITE, 판하나.파일);
    let s = readFileSync(p, 'utf8');
    let 손댐 = 0;
    for (const [키, iso] of Object.entries(고칠것)) {
      const 앞 = s;
      /* ⚠ 화면 마크업에는 가운뎃점이 `&middot;` 로 들어 있고 스크립트 배열에는 `·` 그대로다.
           키를 한쪽에만 맞추면 **스크립트만 바뀌고 화면 문구는 남아** 카운트다운이 거짓말을 한다
           (2026-09-02 실측 — 아래 대조 검사가 잡아냈다). 둘 다 받도록 푼다. */
      const K = 키.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/·/g, '(?:·|&middot;)');
      s = s.replace(new RegExp(`(\\{\\s*반:\\s*'[^']*${K}[^']*'\\s*,\\s*날:\\s*')\\d{4}-\\d{2}-\\d{2}(')`, 'g'),
                    `$1${iso}$2`);
      s = s.replace(new RegExp(`(<span class="cls">[^<]*${K}[^<]*</span>\\s*<span class="time">[^<]*</span>\\s*<span class="start">개강\\s*)[^<]+(</span>)`, 'g'),
                    `$1${한글날(iso)}$2`);
      if (s !== 앞) 손댐++;
    }
    if (손댐) { writeFileSync(p, s); console.log(`  ${판하나.파일} — ${손댐}개 반 갱신`); }
  }
}

/* ── 실행 ───────────────────────────────────────── */
const set아규 = process.argv.find(a => a.startsWith('--set='))
             || (process.argv[process.argv.indexOf('--set') + 1] || '');
if (process.argv.includes('--set') || set아규.startsWith('--set=')) {
  const 값 = set아규.replace(/^--set=/, '') || process.argv[process.argv.indexOf('--set') + 1];
  const 고칠것 = Object.fromEntries(String(값).split(',').map(x => {
    const [k, v] = x.split('='); return [k.trim(), v.trim()];
  }));
  console.log('날짜 갈아 끼우는 중…');
  갈아끼우기(고칠것);
  console.log('');
}

const 모음 = 판.map(판하나 => ({ 판: 판하나, 정보: 읽기(판하나.파일) }));

console.log('══ 사이트에 적힌 개강일');
let 어긋남 = 0;
for (const { 판: 판하나, 정보 } of 모음) {
  console.log(`  ${판하나.파일}  ${정보.기수 ? '['+정보.기수+']' : ''}`);
  정보.줄.forEach((r, i) => {
    const 날 = (정보.배열[i] || {}).날;
    const 맞나 = 날 && 한글날(날).replace(/\s/g, '') === r.적힌개강.replace(/\s/g, '');
    if (!맞나) 어긋남++;
    console.log(`    ${r.반.padEnd(9)} ${r.때.padEnd(15)} 화면「${r.적힌개강}」 · 스크립트「${날 || '없음'}」 ${맞나 ? '○' : '✗ 어긋남'}`);
  });
}

const L = await 리틀리읽기();
console.log('\n══ 리틀리');
if (!L) console.log('  토큰이 없어 못 읽었다 (광고_네이버/littly_report.mjs --refresh-token)');
else if (L.오류) console.log('  못 읽음:', L.오류);
else {
  console.log('  개강일 텍스트 블록:', L.개강글 ? '○ 있음' : '✗ 없음 — 개강일이 그림 안에만 있다');
  if (L.개강글) console.log('   ', L.개강글.replace(/\n/g, ' / ').slice(0, 160));
  console.log('  공지 블록:', (L.공지 || '(없음)').replace(/\n/g, ' / ').slice(0, 120));
  console.log('  쓰는 그림 블록:', L.그림, '개');
}

const 문안 = 카톡문안(모음);
console.log('\n══ 카카오톡 자동응답 문안  (' + 문안.length + '자 / 한도 400자)' +
            (문안.length > 400 ? '  ✗ 넘침!' : '  ○'));
console.log('─'.repeat(46));
console.log(문안);
console.log('─'.repeat(46));
console.log('\n붙여넣을 곳: 카카오톡 채널 관리자센터 → 채팅 → 자동응답(또는 채팅방 메뉴)');
if (어긋남) console.log(`\n⚠ 화면 문구와 스크립트 날짜가 ${어긋남}군데 어긋난다. 먼저 맞출 것.`);
