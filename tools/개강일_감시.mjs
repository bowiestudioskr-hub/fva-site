/**
 * 리틀리를 원본으로 삼아 사이트·카톡을 자동으로 맞춘다.
 *
 *   node tools/개강일_감시.mjs           보기만 한다 (다르면 알려주고 끝)
 *   node tools/개강일_감시.mjs --적용     다르면 사이트를 고쳐 밀어넣고 카톡까지 갱신한다
 *
 * 리틀리 텍스트 블록은 이 꼴이어야 한다 (한 줄에 하나, 네 줄):
 *   BASIC 화·목 평일반 19:30-21:30 2026-09-29
 *   MASTER 일요일 반 13:00-15:00 2026-10-18
 *
 * ⚠ 리틀리 API 는 읽기만 된다. 원본은 사람이 리틀리 화면에서 고친다.
 * ⚠ 형식이 조금이라도 어긋나면 **아무것도 하지 않는다.** 반쯤 맞은 날짜를 사이트에 올리는 것보다
 *   가만히 있다가 사람이 보는 편이 낫다.
 * ⚠ 카톡은 맥이 켜져 있고 크롬(9222)이 로그인돼 있어야 한다. 안 되면 사이트만 하고 알려준다.
 */
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..');
const 기록 = join(process.env.HOME, 'Library', 'Application Support', 'fva', '개강일_감시.log');
const 적용 = process.argv.includes('--적용');
const 이제 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const 남기기 = (s) => { console.log(s); try { appendFileSync(기록, `[${이제}] ${s}\n`); } catch {} };

/* ── 리틀리에서 원본 읽기 ───────────────────────── */
const F = join(process.env.HOME, 'Library', 'Application Support', 'fva', 'littly.env');
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

const 글 = 블록.filter(b => b.type === 'text' && b.use && /^\s*(BASIC|MASTER)\s/m.test(b.body || ''))
                .map(b => b.body).join('\n');
if (!글) { 남기기('건너뜀: 리틀리에 개강일 텍스트 블록이 없다'); process.exit(0); }

/* ⚠ 형식을 엄격히 본다. 네 줄이 다 맞아야 움직인다. */
const 규칙 = /^(BASIC|MASTER)\s+(.+?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+(\d{4}-\d{2}-\d{2})$/;
const 줄 = 글.split('\n').map(x => x.trim()).filter(Boolean).map(x => x.match(규칙)).filter(Boolean);
if (줄.length !== 4) {
  남기기(`멈춤: 개강일 줄이 4개여야 하는데 ${줄.length}개다. 리틀리 형식을 확인할 것.`);
  process.exit(0);
}
const 원본 = Object.fromEntries(줄.map(m => [m[2], m[5]]));

/* ── 사이트와 대조 ─────────────────────────────── */
const 사이트 = {};
for (const f of ['basic.html', 'offline.html'])
  for (const m of readFileSync(join(SITE, f), 'utf8')
        .matchAll(/\{\s*반:\s*'([^']+)'\s*,\s*날:\s*'(\d{4}-\d{2}-\d{2})'\s*\}/g))
    사이트[m[1]] = m[2];

const 다른것 = Object.entries(원본).filter(([반, iso]) => 사이트[반] !== iso);
if (!Object.keys(원본).every(반 => 반 in 사이트)) {
  남기기('멈춤: 리틀리의 반 이름이 사이트에 없다 — ' +
         Object.keys(원본).filter(r => !(r in 사이트)).join(', '));
  process.exit(0);
}
if (!다른것.length) { 남기기('○ 리틀리 = 사이트. 할 일 없음.'); process.exit(0); }

남기기('▲ 달라졌다: ' + 다른것.map(([반, iso]) => `${반} ${사이트[반]}→${iso}`).join(' · '));
if (!적용) { 남기기('  (--적용 을 붙이면 사이트와 카톡을 맞춘다)'); process.exit(0); }

/* ── 사이트 고치고 밀어넣기 ─────────────────────── */
const 도구 = (n, a) => execFileSync('node', [join(HERE, n), ...a], { cwd: SITE, encoding: 'utf8' });
도구('개강일.mjs', ['--set', 다른것.map(([반, iso]) => `${반}=${iso}`).join(',')]);
execFileSync('python3', [join(HERE, 'bust.py')], { cwd: SITE, encoding: 'utf8' });

/* ⚠ 날짜 말고 딴 게 섞여 들어가면 밀어넣지 않는다. */
const 손댄것 = execFileSync('git', ['diff', '--name-only'], { cwd: SITE, encoding: 'utf8' })
  .split('\n').filter(Boolean);
const 허용 = new Set(['basic.html', 'offline.html']);
const 남는것 = 손댄것.filter(f => !허용.has(f) && !/^css\//.test(f));
if (남는것.length) {
  남기기('멈춤: 예상 밖 파일이 바뀌었다 — ' + 남는것.join(', ') + ' (사람이 볼 것)');
  process.exit(1);
}
execFileSync('git', ['add', ...손댄것], { cwd: SITE });
execFileSync('git', ['commit', '-q', '-m',
  '개강일 갱신 — 리틀리에서 자동으로\n\n' + 다른것.map(([반, iso]) => `· ${반} ${사이트[반]} → ${iso}`).join('\n')],
  { cwd: SITE });
execFileSync('git', ['push', '-q', 'origin', 'HEAD'], { cwd: SITE });
남기기('  사이트 밀어넣음');

/* ── 카톡 ─────────────────────────────────────── */
try {
  const 답 = 도구('개강일_카톡.mjs', ['--쓰기']);
  남기기('  카톡 ' + (/저장 확인/.test(답) ? '갱신됨' : '결과 확인 필요'));
} catch (e) {
  남기기('  ⚠ 카톡은 못 바꿨다 (크롬이 꺼졌거나 로그인이 풀림). ' +
         '맥에서 `node tools/개강일_카톡.mjs --쓰기` 를 한 번 돌릴 것.');
}
남기기('끝');
