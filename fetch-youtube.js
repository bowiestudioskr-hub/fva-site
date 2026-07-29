#!/usr/bin/env node
/**
 * 유튜브 최신 영상을 가져와 pages/youtube.json 으로 저장한다.
 * RSS 라 API 키가 필요 없다.  node fetch-youtube.js
 *
 * 제목·설명·날짜를 진짜 텍스트로 심는 게 목적이다.
 * 임베드(iframe)만으로는 검색에 잡히지 않는다.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CHANNEL = 'UCDBwtcf2azG4ghIBqXPnymQ'; // @FVA-ACADEMY
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL}`;
const STUDENT_TAG = /\[FVA\s*수강생\s*우수작\]/;

const get = (url) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      return get(r.headers.location).then(res, rej);
    }
    let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});

const unesc = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = (s) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  const xml = await get(FEED);
  const entries = xml.split('<entry>').slice(1);
  const videos = entries.map((e) => {
    const pick = (tag) => {
      const m = e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? unesc(m[1].trim()) : '';
    };
    const id = pick('yt:videoId');
    const views = (e.match(/views="(\d+)"/) || [])[1] || null;
    const desc = pick('media:description').split('\n').filter(Boolean)[0] || '';
    return {
      id,
      title: esc(pick('title')),
      desc: esc(desc.slice(0, 160)),
      published: pick('published').slice(0, 10),
      views: views ? Number(views) : null,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  }).filter((v) => v.id);

  const out = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    channel: `https://www.youtube.com/channel/${CHANNEL}`,
    students: videos.filter((v) => STUDENT_TAG.test(unesc(v.title))),
    latest: videos.filter((v) => !STUDENT_TAG.test(unesc(v.title))),
  };

  fs.writeFileSync(path.join(__dirname, 'pages', 'youtube.json'), JSON.stringify(out, null, 2));
  console.log(`  수강생 우수작 ${out.students.length}개 / 그 외 최신 ${out.latest.length}개`);
  out.students.forEach((v) => console.log(`    · ${unesc(v.title).slice(0, 52)}`));
})();
