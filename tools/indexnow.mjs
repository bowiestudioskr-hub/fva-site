/**
 * IndexNow — 검색엔진에 「이 주소들 봐달라」고 직접 알린다.
 * 빙(=ChatGPT 웹검색의 뒷단)·Yandex·Seznam·Naver 가 이 규격을 받는다.
 * 구글은 안 받는다 (구글은 서치콘솔/사이트맵으로 간다).
 *
 * 키 파일이 사이트 루트에 그대로 있어야 인증된다. 지우면 전부 거부된다.
 *   https://fva.co.kr/f00cd97c0ae0470f921060c135f7a3bd.txt
 *
 *   node tools/indexnow.mjs
 */
import { readFileSync } from 'node:fs';
const KEY = 'f00cd97c0ae0470f921060c135f7a3bd';
const HOST = 'fva.co.kr';

const xml = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (!urls.length) { console.error('sitemap 에서 URL 을 못 읽었다'); process.exit(1); }

console.log(`제출 대상 ${urls.length}개`);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY,
                         keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
const txt = await res.text().catch(() => '');
console.log(`응답 ${res.status} ${res.statusText}`, txt.slice(0, 200));
// 200/202 면 접수. 색인 여부는 빙이 따로 판단한다.
console.log(res.status === 200 || res.status === 202
  ? '→ 접수됨. 빙이 크롤링해 색인하기까지는 며칠 걸린다.'
  : '→ 거부됨. 키 파일이 살아있는지 확인할 것.');
