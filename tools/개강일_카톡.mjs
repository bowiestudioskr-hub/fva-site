/**
 * 카카오톡 채널 자동응답 「개강일이 궁금해요」의 본문을 바꾼다.
 *
 *   node tools/개강일_카톡.mjs            지금 등록된 문안을 읽어서 보여준다
 *   node tools/개강일_카톡.mjs --쓰기      개강일.mjs 가 만든 문안으로 갈아 끼운다
 *
 * ⚠ 카카오는 자동응답을 고치는 **공개 API 를 주지 않는다.** 그래서 파트너센터 화면을
 *   크롬으로 직접 조작한다. 그러려면 —
 *     · 맥이 켜져 있고
 *     · 디버그 크롬(9222)이 떠 있고
 *     · business.kakao.com 에 로그인돼 있어야 한다.
 *   세션이 만료되면 사람이 한 번 로그인해 줘야 한다.
 *
 * ⚠ 채팅방 메뉴 화면은 열자마자 「변경됨」으로 잡혀 나갈 때 팝업이 뜬다. 자동으로 받아넘긴다.
 *   (메뉴가 이미 등록된 상태라면 버리고 나가도 잃을 게 없다.)
 */
import { readFileSync } from 'fs';

const 채널 = 'https://business.kakao.com/space/10314961/channel/_nxhyhn';
const 목록 = 채널 + '/custom_menus/auto_replies';
const 발화 = '개강일이 궁금해요';
const 쓰기 = process.argv.includes('--쓰기');

async function 붙기() {
  let l;
  try { l = await (await fetch('http://127.0.0.1:9222/json/list')).json(); }
  catch { throw new Error('디버그 크롬(9222)이 안 떠 있다'); }
  const t = l.find(x => x.type === 'page' && /business\.kakao|kakao/.test(x.url))
         || l.find(x => x.type === 'page');
  if (!t) throw new Error('크롬에 열린 탭이 없다');
  const s = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const q = new Map();
  await new Promise(r => s.onopen = r);
  s.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && q.has(m.id)) { q.get(m.id)(m); q.delete(m.id); }
    /* 「나가시겠습니까?」를 받아넘긴다 */
    if (m.method === 'Page.javascriptDialogOpening')
      s.send(JSON.stringify({ id: ++id, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
  };
  const cmd = (mm, p = {}) => new Promise(r => { const i = ++id; q.set(i, r); s.send(JSON.stringify({ id: i, method: mm, params: p })); });
  await cmd('Runtime.enable'); await cmd('Page.enable');
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
  const 잠깐 = (ms) => new Promise(r => setTimeout(r, ms));
  const 가기 = async (u, ms = 10000) => { await cmd('Page.navigate', { url: u }); await 잠깐(ms); };
  const 누르기 = async (조건, ms = 3500) => {
    const p = await ev(`(()=>{const b=[...document.querySelectorAll('button,a')].filter(x=>x.offsetParent && (${조건}));
      if(!b.length)return null; b[0].scrollIntoView({block:'center'});
      const r=b[0].getBoundingClientRect(); return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)});})()`);
    if (!p) return false;
    await 잠깐(600);
    const { x, y } = JSON.parse(p);
    for (const ty of ['mouseMoved', 'mousePressed', 'mouseReleased'])
      await cmd('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', buttons: 1, clickCount: 1 });
    await 잠깐(ms); return true;
  };
  return { ev, 가기, 누르기, 잠깐 };
}

const { ev, 가기, 누르기, 잠깐 } = await 붙기();

await 가기(목록, 11000);
if (/accounts\.kakao|\/login/.test(String(await ev('location.href'))))
  { console.log('✗ 카카오 로그인이 풀렸다. 크롬에서 한 번 로그인해 줄 것.'); process.exit(1); }

/* 목록에서 그 줄을 연다 — 줄 전체가 링크다 */
if (!await 누르기(`x.tagName==='A' && x.innerText.includes('개강일 안내')`, 5000))
  { console.log('✗ 「개강일 안내」 자동응답을 목록에서 못 찾았다'); process.exit(1); }

const 지금 = await ev(`(()=>{const t=[...document.querySelectorAll('textarea')].filter(x=>x.offsetParent)[0];
  return t? t.value : null;})()`);
if (지금 == null) { console.log('✗ 응답 메시지 칸을 못 찾았다'); process.exit(1); }

console.log('── 지금 등록된 문안 (' + 지금.length + '자)');
console.log(지금.split('\n').map(l => '   ' + l).join('\n'));

if (!쓰기) { console.log('\n(바꾸려면 --쓰기)'); process.exit(0); }

/* 새 문안은 개강일.mjs 가 표준출력으로 준다 */
const { execFileSync } = await import('child_process');
const { fileURLToPath } = await import('url');
/* ⚠ new URL(...).pathname 은 한글을 %EA%B0%9C… 로 바꿔 버린다. fileURLToPath 로 풀어야 한다. */
const 나온것 = execFileSync('node', [fileURLToPath(new URL('./개강일.mjs', import.meta.url)), '--문안만'],
                            { encoding: 'utf8' }).trim();
if (나온것.length < 50) { console.log('✗ 새 문안이 비었다'); process.exit(1); }
if (나온것 === 지금) { console.log('\n○ 이미 같은 내용이다. 건드리지 않는다.'); process.exit(0); }

console.log('\n── 새 문안 (' + 나온것.length + '자)');
console.log(나온것.split('\n').map(l => '   ' + l).join('\n'));

/* ⚠ 리액트 폼이라 value 대입은 무시된다. 원래 setter 를 불러 주고 input 을 쏴야 먹는다. */
await ev(`(()=>{const t=[...document.querySelectorAll('textarea')].filter(x=>x.offsetParent)[0];
  const set=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
  set.call(t, ${JSON.stringify(나온것)});
  t.dispatchEvent(new Event('input',{bubbles:true})); t.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await 잠깐(900);

if (!await 누르기(`x.innerText.replace(/\\s+/g,'')==='저장하기'`, 4500))
  { console.log('✗ 저장하기 버튼을 못 찾았다'); process.exit(1); }
await 누르기(`x.innerText.replace(/\\s+/g,'')==='확인'`, 3000);

/* 되읽어 확인한다 — 저장됐다는 말만 믿지 않는다 */
await 가기(목록, 9000);
const 확인 = await ev(`(()=>{const a=[...document.querySelectorAll('a')].filter(x=>x.innerText.includes('개강일 안내'))[0];
  return a? a.innerText.replace(/\\s+/g,' ').slice(0,80) : null;})()`);
console.log('\n○ 저장 확인:', 확인 || '✗ 목록에서 못 찾음');
process.exit(0);
