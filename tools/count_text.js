/* <body> 안 텍스트 글자수 — script/style/noscript 는 뺀다.
   SSR 전후 비교용. 공백만 있는 노드는 세지 않는다. */
const fs = require('fs');
const file = process.argv[2];
let h = fs.readFileSync(file, 'utf8');
const body = h.slice(h.indexOf('<body'), h.lastIndexOf('</body>'));
const txt = body
  .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
console.log(file, '→', txt.length, '자');
