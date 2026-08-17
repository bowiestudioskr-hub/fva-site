/**
 * Code.gs 를 Apps Script 프로젝트에 올리고 웹앱을 새 버전으로 배포한다.
 *
 *   node deploy.mjs            올리고 배포까지
 *   node deploy.mjs --dry      올리지 않고 차이만 확인
 *
 * ⚠ clasp 는 쓰지 않는다. clasp 2.x 는 ~/.clasprc.json 의 새 형식(tokens.default)을
 *   못 읽어 「Cannot read properties of undefined」로 죽고, 3.x 는 명령이 바뀌었다.
 *   어차피 필요한 건 REST 호출 세 번뿐이라 직접 부른다.
 *
 * 토큰은 ~/.clasprc.json 의 refresh_token 을 그대로 쓴다. 이 파일은 로컬에만 있고
 * 저장소에는 올라가지 않는다 — 올리면 이 계정의 스크립트를 누구나 고칠 수 있다.
 *
 * 배포 후 웹앱 주소는 그대로다. adminmonitor.html 이 그 주소를 물고 있으므로
 * 새 배포를 만들지 말고 기존 배포의 버전만 올려야 한다.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_ID = '1ac9ewxyVofMiyMibRj335nYRsTNYPO8vEYddgBTRp1oUpGz_PxgxoT5W';
const DRY = process.argv.includes('--dry');

async function token() {
  const c = JSON.parse(readFileSync(process.env.HOME + '/.clasprc.json', 'utf8')).tokens.default;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.client_id, client_secret: c.client_secret,
      refresh_token: c.refresh_token, grant_type: 'refresh_token',
    }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error('토큰 발급 실패: ' + JSON.stringify(t).slice(0, 200));
  return t.access_token;
}

const api = (tok) => async (path, opt = {}) => {
  const r = await fetch('https://script.googleapis.com/v1/' + path, {
    ...opt,
    headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json', ...opt.headers },
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j).slice(0, 300));
  return j;
};

const tok = await token();
const call = api(tok);

// ── 현재 올라가 있는 내용 ───────────────────────────────────
const cur = await call(`projects/${SCRIPT_ID}/content`);
const local = readFileSync(join(HERE, 'Code.gs'), 'utf8');
const remote = (cur.files.find(f => f.name === 'Code') || {}).source || '';

if (remote === local) {
  console.log('올라간 내용과 같다. 배포 안 함.');
  process.exit(0);
}
console.log(`차이  원격 ${remote.length}자 → 로컬 ${local.length}자`);
if (DRY) process.exit(0);

// ── 올리기 ─────────────────────────────────────────────────
// manifest(appsscript.json)는 건드리지 않는다. 실행 권한 설정이 거기 들어 있다.
const files = cur.files.map(f => (f.name === 'Code' ? { ...f, source: local } : f));
await call(`projects/${SCRIPT_ID}/content`, { method: 'PUT', body: JSON.stringify({ files }) });
console.log('올림 완료');

// ── 기존 배포의 버전만 올리기 ────────────────────────────────
const ver = await call(`projects/${SCRIPT_ID}/versions`, {
  method: 'POST',
  body: JSON.stringify({ description: '자동 배포 ' + new Date().toISOString().slice(0, 16) }),
});
console.log('새 버전', ver.versionNumber);

const { deployments = [] } = await call(`projects/${SCRIPT_ID}/deployments`);
// HEAD 배포(@HEAD)는 편집기 미리보기용이라 건드릴 필요가 없다.
const live = deployments.filter(d => d.deploymentId && d.deploymentConfig?.versionNumber);
if (!live.length) {
  console.log('⚠ 올리긴 했는데 갱신할 배포가 없다. 편집기에서 「배포 관리」를 확인하라.');
  process.exit(0);
}
for (const d of live) {
  await call(`projects/${SCRIPT_ID}/deployments/${d.deploymentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber: ver.versionNumber,
        manifestFileName: 'appsscript',
        description: d.deploymentConfig.description || '',
      },
    }),
  });
  console.log(`배포 갱신  ${d.deploymentId.slice(0, 24)}…  →  v${ver.versionNumber}`);
}
