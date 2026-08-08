/* <body> 안 텍스트 — script/style/noscript 제외, 공백 전부 제거하고 센다 */
const fs=require('fs');
const h=fs.readFileSync(process.argv[2],'utf8');
const body=h.slice(h.indexOf('<body'),h.lastIndexOf('</body>'));
const t=body.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
            .replace(/<!--[\s\S]*?-->/g,'')
            .replace(/<[^>]+>/g,' ')
            .replace(/&nbsp;/g,' ')
            .replace(/\s+/g,'');
console.log(process.argv[2],'→',t.length,'자 (공백 제거)');
