#!/usr/bin/env node
/**
 * 후기 134건을 reviews.html 안에 정적 HTML 로 미리 그려 넣는다.
 *
 * 왜: #grid 를 자바스크립트로만 채우면 HTML 본문이 400자뿐이라 검색엔진이
 *     후기를 하나도 못 읽는다. 화면에 보이는 결과는 그대로 두고, 같은 카드
 *     HTML 을 빌드 시점에 한 번 더 만들어 문서에 심는다.
 *
 * 카드 틀은 js/review-card.js 한 곳에서만 만든다 — 브라우저와 여기가 같은 코드를 쓴다.
 * 그래서 「엑셀 주면 reviews.json 만 갱신」 흐름이 그대로 유지된다.
 *   assets/data/reviews.json 갱신 → node build.js  (또는 node tools/build_reviews.js)
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const RC = require(path.join(SITE, 'js/review-card.js'));

const START = '<!-- BUILD:REVIEWS — tools/build_reviews.js 가 채운다. 손으로 고치지 말 것 -->';
const END = '<!-- /BUILD:REVIEWS -->';

function build() {
  const reviews = JSON.parse(fs.readFileSync(path.join(SITE, 'assets/data/reviews.json'), 'utf8'));
  const file = path.join(SITE, 'reviews.html');
  let html = fs.readFileSync(file, 'utf8');

  const cards = RC.list(reviews);
  const block = `${START}\n${cards}\n${END}`;

  const s = html.indexOf(START);
  if (s !== -1) {
    // 이미 심어져 있으면 그 구간만 갈아 끼운다
    const e = html.indexOf(END, s) + END.length;
    html = html.slice(0, s) + block + html.slice(e);
  } else {
    const anchor = '<div class="grid" id="grid">';
    const at = html.indexOf(anchor);
    if (at === -1) throw new Error('reviews.html 에서 <div class="grid" id="grid"> 를 찾지 못했다');
    const close = html.indexOf('</div>', at);
    html = html.slice(0, at + anchor.length) + '\n' + block + '\n' + html.slice(close);
  }

  fs.writeFileSync(file, html);

  const withPhoto = reviews.filter(r => r.photo).length;
  console.log(`  ✓ reviews.html — 후기 ${reviews.length}건 정적 렌더 (사진 ${withPhoto}건)`);
  return reviews.length;
}

if (require.main === module) build();
module.exports = build;
