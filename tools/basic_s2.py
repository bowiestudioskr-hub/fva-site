#!/usr/bin/env python3
"""왕초보반 basic.html 의 「상페2」(CLASS FEATURE ~ 혜택)를 피그마 1:1 로 짠다.

  피그마 3684:261 (860 x 10449). 방식은 tools/basic_s1.py 와 같다(절대 좌표 판).

  ■ 사진 띠 3장은 노드가 여러 겹(마스크+사진 여러 장)이라 낱개로 옮기면 어긋난다.
    피그마 합성 렌더에서 띠를 통째로 잘라 AI 업스케일한 것을 한 장으로 쓴다.
  ■ TLAB 제목은 렌더에서 잰 '잉크' 좌표를 쓴다.
  ■ ⚠ 「FVA CURRICULUM」은 TLAB 이 아니라 아웃라인 벡터(773.48 폭)다.
  ■ ⚠ 「FVA만의 특별한 혜택」·Monthly Themes 의 달 표기도 TLAB 이다.

  python3 tools/basic_s2.py && python3 tools/bust.py
"""
import io, json, os, re

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
META = json.load(open(os.path.join(SITE, 'assets/tlab/meta.json'), encoding='utf-8'))
판 = 10449.0


def u(v):
    return f'calc(var(--u) * {round(float(v), 3)}/860)'


def 자리(x=None, y=None, w=None, h=None):
    ㄱ = []
    if y is not None: ㄱ.append('top:' + u(y))
    if x is not None: ㄱ.append('left:' + u(x))
    if w is not None: ㄱ.append('width:' + u(w))
    if h is not None: ㄱ.append('height:' + u(h))
    return '; '.join(ㄱ)


def tl(key, 글):
    svg = io.open(os.path.join(SITE, 'assets/tlab', key + '.svg'), encoding='utf-8').read().strip()
    svg = svg.replace('<svg ', f'<svg class="bs-tl bs-{key}" aria-hidden="true" focusable="false" ', 1)
    return f'<span class="sr-only">{글}</span>{svg}'


def 폭(key):
    return META[key]['ink_px'][0]


# ── 표 ────────────────────────────────────────────────────────────
# CLASS FEATURE 세 덩이 (번호 잉크 x/y, 제목 x/y/w, 구분선 y, 본문 x/y/w)
특징 = [
    ('b-n01', 47, 720,  190, 723, 648, 840.5,
     '현업 프로듀서가 처음부터 끝까지<br><b>영상 한 편을 완성할 때까지 함께합니다.</b>',
     191, 858, 640, -0.0333,
     '영상 해보고 싶다는 사람은 많습니다. 근데 장비부터 사야 하나 뭘 배우고 시작해야 하나 재다가 시작을 못 해요. 겁먹고 미루다 흐지부지된 겁니다.<br>'
     '그거 재지 말라고 프로듀서가 옆에 붙어 있습니다. 몰라서 온 거니까요.<br>'
     '현업 프로듀서가 첫 한 편이 끝날 때까지 같이 갑니다.<br>'
     '<b>“이런 것도 물어봐도 되나?” 싶은 질문일수록 환영이에요!</b>'),
    ('b-n02', 47, 1503, 190, 1506, 673, 1623.33,
     '영상은 비싼 장비로 시작하는 게 아닙니다.<br><b>실패해도 일단 만들어보는 게 먼저예요.</b>',
     191, 1641, 640, -0.04,
     '처음부터 잘 만들 필요 없습니다. 뭘 찍어야 할지도 모르겠고 결과물이<br>'
     '마음에 안 들 수도 있습니다. 그런데 일단 해봐야 알 수 있습니다.<br>'
     '<b>찍어보고 편집해보고 망쳐보면서 내가 좋아하는 것도 찾게 됩니다.</b>'),
    ('b-n03', 47, 2228, 190, 2230.826, 631, 2348.33,
     '한 달마다 주제가 바뀝니다.<br><b>그래서 다음 달에 또 오게 돼요.</b>',
     191, 2366, 603, -0.04,
     'FVA x 21스튜디오 베이직 클래스에서는 <b>한 달 동안 하나의 테마를<br>'
     '집중해서 배웁니다.</b> 영화부터 숏폼, AI, 뮤직비디오까지 매달 다른<br>'
     '방식으로 영상을 만들어봅니다. 한 달만 듣고 끝내도 괜찮습니다.<br>'
     '재밌었다면 다음 달에 또 오세요. 새로운 테마를 배우고 새로운<br>'
     '사람들과도 만나게 될 거예요.'),
]
# Monthly Themes 표 — (TLAB 달 key, 달 잉크 y, 테마, 만드는 것, 글 y)
달표 = [
    ('b-m0',  2882, '테마',      '만드는 것',      2869),
    ('b-m9',  2959, '영화',      '1분짜리 단편',    2946),
    ('b-m10', 3030, '세로 숏폼',  '세로 영상 한 편',  3017),
    ('b-m11', 3101, 'AI',       'AI로 만든 영상',  3088),
    ('b-m12', 3172, '뮤직비디오', 'MV 한 편',      3159),
    ('b-m1',  3243, '시나리오',   '1분 시나리오',    3230),
]
# 커리큘럼 8강 — (주차 TLAB, 주차 잉크 x/y, 회차 TLAB, 회차 y, 주제 y, 주제)
강 = [
    ('b-w1', 61, 3853, 'b-e1', 3850, 3855, '오리엔테이션 : 서로 알기 / 진입장벽 낮추는 기초 지식'),
    (None,   0,  0,    'b-e2', 3895, 3900, '앵글과 구도 : 명화부터 최신 영화까지 / 야외 촬영 실습'),
    ('b-w2', 61, 3966, 'b-e3', 3966, 3971, '기획안 &amp; 시나리오 : 이야기의 기초 문법 / 1분짜리 이야기 설계'),
    (None,   0,  0,    'b-e4', 4011, 4016, '콘티 &amp; 촬영 계획 : 스토리보드 / 브레이크다운 / 일일촬영계획표'),
    ('b-w3', 61, 4085, 'b-e5', 4083, 4089, 'AI 기초 이론과 실습 : AI 맛보기 / 트렌드 탐색 / 파이프라인 이해'),
    (None,   0,  0,    'b-e6', 4128, 4133, '프로덕션 · 촬영 : 휴대폰으로 진짜 촬영 해보기'),
    ('b-w4', 61, 4196, 'b-e7', 4199, 4204, '포스트 프로덕션 · 편집 후반 : 컷 편집 / 자막 달고 사운드 입히기'),
    (None,   0,  0,    'b-e8', 4244, 4249, '상영회 &amp; 수료 : 다같이 보고 피드백 / 수료증 증정'),
]
# 추천 대상 — (캐릭터 파일/x/y/w/h, 제목 정렬·x/y/w·글, 설명 x/y/w·글)
추천 = [
    ('ch1', 39, 5025, 214, 293, 'left',  264, 5108, 410, '보는 건 좋아하는데<br>만들어본 적은 없는 분',
     277, 5227, 547, '편집인지 연출인지 색보정인지, 영상 제작이 어떤 역할로<br>나뉘는지부터 내가 뭘 좋아하는지까지 함께 찾아드립니다.'),
    ('ch2', 579, 5322, 266, 342, 'right', 42, 5399, 552, '새로운 취미가 필요했는데<br>이왕이면 남는걸로!',
     36, 5514, 547, '처음엔 그냥 한번 해보고 싶었던 영상 만들기,<br>한 달 동안 배우고 직접 찍고 편집하다 보면<br>어느새 내 이름으로 된 작품 한 편이 완성됩니다.'),
    ('ch3', 30, 5673, 230, 307, 'left',  262, 5723, 412, '포트폴리오는 급한데<br>상급반은 무서운 분',
     257, 5842, 481, '아이디어는 있는데 어떻게 완성해야 할지 막막했다면<br>이번에 끝까지 만들어보세요. 중간중간 현업 PD의<br>피드백도 받으면서 부족한 부분을 채워나갑니다.'),
    ('ch4', 513, 5919, 345, 418, 'right', 40, 6059, 540, '이 수업 들으면 나도 씨네필?<br>나만의 시선을 가지고 싶으신 분',
     62, 6178, 547, '‘이 영화 좋다’까진 누구나 말해요. 왜 좋은지, 어떻게 만든 건지<br>짚을 수 있게 되면 그때부터 보는 눈이 달라집니다.'),
    ('ch5', 15, 6264, 253, 339, 'left',  255, 6329, 438, '퇴근하고 뭐라도 하나<br>남기고 싶은 직장인',
     275, 6453, 547, '퇴근하고 집에 가면 하루가 그냥 끝나버리죠.<br>이번엔 4주 동안 내 것을 하나 만들어보세요.<br>주 2회, 하루 2시간이면 충분합니다.'),
    ('ch6', 558, 6585, 285, 355, 'right', 61, 6680.173, 507, '아이/반려동물/여행 영상을<br>‘제대로’ 남기고 싶으신 분',
     17, 6799, 586, '같은 휴대폰으로 찍어도 결과는 달라집니다.<br>찍는 법부터 고르는 법 그리고 붙이는 법까지,<br>평범한 기록도 조금 더 오래 보고 싶은 영상이 됩니다.'),
]


def html():
    ㅅ = []; A = ㅅ.append
    A('<!-- ══ 상페2 (3684:261) — tools/basic_s2.py 가 만든다. 손대지 말 것 ══ -->')
    A('<section class="bs-s2 bs-board" aria-labelledby="bs-h-feat">')
    A('  <img class="s2-lock bs-rv" src="assets/img/basic/ico/lock-hero.svg" width="515" height="102" '
      'loading="lazy" alt="FVA ACADEMY × 21STUDIOS">')
    A(f'  <h2 class="s2-hfeat bs-rv" id="bs-h-feat">{tl("b-feature", "CLASS FEATURE")}</h2>')
    for n, (nk, nx, ny, tx, ty, tw, ry, 제목, px, py, pw, 자간, 본문) in enumerate(특징, 1):
        A(f'  <img class="s2-band s2-band{n}" src="assets/img/basic/cf-band{n}.webp" '
          f'width="860" height="{[378,374,374][n-1]}" loading="lazy" alt="수업·촬영 현장 사진">')
        A(f'  <p class="s2-no s2-no{n} bs-rv">{tl(nk, "0%d" % n)}</p>')
        A(f'  <p class="s2-ft s2-ft{n} bs-rv">{제목}</p>')
        A(f'  <hr class="s2-rl s2-rl{n}a"><hr class="s2-rl s2-rl{n}b">')
        A(f'  <p class="s2-fp s2-fp{n} bs-rv">{본문}</p>')
    A('  <p class="s2-note bs-rv">※ 테마 순서는 운영에 따라 조정될 수 있습니다.</p>')
    A('  <div class="s2-mbox bs-rv" aria-hidden="true"></div>')
    A(f'  <h3 class="s2-mh bs-rv">{tl("b-monthly", "Monthly Themes")}</h3>')
    A('  <hr class="s2-mrule">')
    A('  <table class="s2-mtable"><caption class="sr-only">달마다 바뀌는 테마</caption><tbody>')
    for k, my, 테마, 만듦, gy in 달표:
        A(f'    <tr><th class="s2-m-{k}">{tl(k, META[k]["text"])}</th>'
          f'<td class="s2-mt s2-mt-{k}">{테마}</td><td class="s2-mm s2-mm-{k}">{만듦}</td></tr>')
    A('  </tbody></table>')
    A('  <p class="s2-when bs-rv">주 2회 · 하루 2시간 · 4주 8강</p>')
    A('  <img class="s2-curw bs-rv" src="assets/img/basic/ico/curriculum-word.svg" '
      'width="773" height="118" loading="lazy" alt="FVA CURRICULUM">')
    A('  <p class="s2-game bs-rv"><b>매 시간 게임으로 시작합니다.</b> 앉아서 듣기만 하는 수업이 아니에요! (극내향인 가능)</p>')
    A('  <img class="s2-thead" src="assets/img/basic/ico/table-head.svg" '
      'width="774" height="114" loading="lazy" alt="" aria-hidden="true">')
    A('  <p class="s2-th1">주차</p><p class="s2-th2">학습 주제</p><p class="s2-th3">회차</p>')
    A('  <ol class="s2-cur">')
    for i, (wk, wx, wy, ek, ey, sy, 주제) in enumerate(강, 1):
        A(f'    <li class="s2-cu{i}">')
        if wk:
            A(f'      <span class="s2-w s2-w-{wk}">{tl(wk, META[wk]["text"])}</span>')
        A(f'      <span class="s2-e s2-e{i}">{tl(ek, META[ek]["text"])}</span>')
        A(f'      <span class="s2-s s2-s{i}">{주제}</span>')
        A('    </li>')
    A('  </ol>')
    A('  <hr class="s2-cend">')
    A('  <p class="s2-laika bs-rv">4주 뒤, 드디어 <b>라이카 시네마</b> 개봉!</p>')
    A('  <img class="s2-lmark" src="assets/img/basic/ico/laika-mark2.webp" width="63" height="63" '
      'loading="lazy" alt="" aria-hidden="true">')
    A('  <p class="s2-screen bs-rv">내가 만든 영화를 진짜 극장 스크린에 걸어요.</p>')
    A('  <p class="s2-cfeat bs-rv">클래스 특징</p>')
    A(f'  <h2 class="s2-whoh bs-rv" id="bs-h-who">{tl("b-whoh", "이런 분들에게 추천드려요!")}</h2>')
    A('  <ul class="s2-who">')
    for i, (ch, cx, cy, cw, chh, 정렬, tx, ty, tw, 제목, dx, dy, dw, 설명) in enumerate(추천, 1):
        A(f'    <li class="s2-wi{i}">')
        A(f'      <img class="s2-wc" src="assets/img/basic/ico/{ch}.webp" alt="" aria-hidden="true">')
        A(f'      <span class="s2-wt">{제목}</span>')
        A(f'      <span class="s2-wd">{설명}</span>')
        A('    </li>')
    A('  </ul>')
    A('  <img class="s2-crowd bs-rv" src="assets/img/basic/benefit-ss.webp" width="775" height="417" '
      'loading="lazy" alt="수강생들이 다 같이 모여 찍은 단체 사진">')
    A('  <p class="s2-crowd1 bs-rv">그리고 무엇보다도...</p>')
    A('  <p class="s2-crowd2 bs-rv"><b>영상 좋아하는 사람들</b>이랑<br>어울리고 싶으신 분!</p>')
    A('  <p class="s2-perk1 bs-rv">수강생 모두에게 드리는</p>')
    A(f'  <h2 class="s2-perkh bs-rv" id="bs-h-perk">{tl("b-perkh", "FVA만의 특별한 혜택")}</h2>')
    # ── 혜택 캡슐 주황 (3697:33232) ─────────────────────────
    A('  <div class="s2-cap s2-capO bs-rv" aria-hidden="true"></div>')
    A('  <img class="s2-capOlock" src="assets/img/basic/ico/laika-word.svg" width="421" height="41" '
      'loading="lazy" alt="LAIKA CINEMA">')
    A('  <img class="s2-capOlogo" src="assets/img/basic/ico/laika-logo.webp" width="333" height="93" '
      'loading="lazy" alt="" aria-hidden="true">')
    A('  <p class="s2-capOsub bs-rv">FVA BASIC반 등록 시 &lt;라이카 시네마&gt;</p>')
    A(f'  <p class="s2-capOa bs-rv">{tl("b-theater", "극장 상영 기회 제공")}</p>')
    A(f'  <p class="s2-capOb bs-rv">{tl("b-ticket", "& 관람 티켓 2매 증정")}</p>')
    # ── 혜택 캡슐 초록 (3697:33341) ─────────────────────────
    A('  <div class="s2-cap s2-capG bs-rv" aria-hidden="true"></div>')
    A('  <p class="s2-capGsub bs-rv">FVA BASIC반 우수 수강생에 한하여</p>')
    A('  <img class="s2-capGlock" src="assets/img/basic/ico/slr-word.svg" width="369" height="36" '
      'loading="lazy" alt="SLRRENT">')
    A('  <p class="s2-capGmaster bs-rv">마스터 클래스</p>')
    A('  <p class="s2-capGa bs-rv">'
      f'<span class="s2-ws1">{tl("b-ws1", "촬영")}</span>'
      f'<span class="s2-ws2">{tl("b-ws2", "&")}</span>'
      f'<span class="s2-ws3">{tl("b-ws3", "조명 워크샵")}</span></p>')
    A(f'  <p class="s2-capGb bs-rv">{tl("b-party", "네트워킹 파티 초대권 증정")}</p>')
    A('  <img class="s2-capGpic1" src="assets/img/basic/workshop.webp" width="633" height="356" '
      'loading="lazy" alt="촬영·조명 워크샵 현장">')
    A('  <p class="s2-capGcap1">촬영&amp;조명 워크샵 with SLRRENT</p>')
    A('  <img class="s2-capGpic2" src="assets/img/basic/party.webp" width="633" height="356" '
      'loading="lazy" alt="네트워킹 파티 현장">')
    A('  <p class="s2-capGcap2">영상인들의 비밀 파티</p>')
    A('</section>')
    return '\n'.join(ㅅ) + '\n'


머리 = '/* ══ 상페2 (3684:261) — tools/basic_s2.py 가 만든다. 손대지 말 것 ══ */'
꼬리 = '/* ══ 상페2 끝 ══ */'


def css():
    L = []; A = L.append
    A(머리)
    A('.bs .bs-s2{ height:' + u(판) + ' }')
    A('.bs .s2-lock{ ' + 자리(252, 70, 356.476) + ' }')
    A('/* 3684:348 — TLAB 136 -4.08 흰색 (잉크 x76 y165) */')
    A('.bs .s2-hfeat{ ' + 자리(76, 165, 폭('b-feature')) + '; color:#fff }')
    A('')
    A('/* 사진 띠 3장 — 피그마 합성 렌더에서 통째로 잘라 업스케일한 것 */')
    for n, y, h in [(1, 309, 378), (2, 1093, 374), (3, 1811, 374)]:
        A(f'.bs .s2-band{n}{{ {자리(0, y, 860)} }}')
    A('/* 3684:352 외 — TLAB 121 +2.42 #2CFF05 */')
    A('.bs .s2-no{ color:var(--green) }')
    A('/* 3684:358 외 — Bold 40/54 -1.6px 흰색, 둘째 줄만 #2CFF05 */')
    A('.bs .s2-ft{ color:#fff; font-weight:700; font-size:' + u(40) + ';'
      ' line-height:' + u(54) + '; letter-spacing:-.04em }')
    A('.bs .s2-ft b{ font-weight:inherit; color:var(--green) }')
    A('/* 3684:354 외 — Regular 24/1.513 #EFEFEF, 강조만 ExtraBold */')
    A('.bs .s2-fp{ color:#EFEFEF; font-weight:400; font-size:' + u(24) + '; line-height:1.513 }')
    A('.bs .s2-fp b{ font-weight:800 }')
    A('.bs .s2-rl{ border:0; height:' + u(1) + '; background:#3A3A3A }')
    for n, (nk, nx, ny, tx, ty, tw, ry, 제목, px, py, pw, 자간, 본문) in enumerate(특징, 1):
        A(f'.bs .s2-no{n}{{ {자리(nx, ny, 폭(nk))} }}')
        A(f'.bs .s2-ft{n}{{ {자리(tx, ty, tw)} }}')
        A(f'.bs .s2-rl{n}a{{ {자리(42.64, ry, 125.61)} }}')
        A(f'.bs .s2-rl{n}b{{ {자리(188.32, ry, 628.22)} }}')
        A(f'.bs .s2-fp{n}{{ {자리(px, py, pw)}; letter-spacing:{자간}em }}')
    A('/* 3687:28860 — SemiBold 22 -0.88 #A0A0A0 */')
    A('.bs .s2-note{ ' + 자리(188, 2568, 456) + '; color:#A0A0A0; font-weight:600;'
      ' font-size:' + u(22) + '; line-height:1.3; letter-spacing:-.04em }')
    A('')
    A('/* Monthly Themes 3697:32973 — 760x658 r100 테두리 4px.')
    A('   ⚠ get_design_context 는 테두리를 #EBEBFF 라 하지만 렌더는 #2CFF05 다. */')
    A('.bs .s2-mbox{ ' + 자리(50, 2694, 760, 658) + '; border:' + u(4) + ' solid var(--green);'
      ' border-radius:' + u(100) + ';'
      ' background:linear-gradient(155.689deg, #063908 6.66%, #000 41.33%, #063908 94.95%) }')
    A('.bs .s2-mh{ ' + 자리(430 - 폭('b-monthly') / 2, 2747, 폭('b-monthly')) + '; color:var(--green) }')
    A('.bs .s2-mrule{ ' + 자리(100, 2936, 659, 1) + '; border:0; background:#3A3A3A }')
    A('.bs .s2-mtable{ inset:0; border-collapse:collapse }')
    A('.bs .s2-mtable th,.bs .s2-mtable td{ position:absolute; padding:0; text-align:left;'
      ' font-weight:600; color:#ECECEC; font-size:' + u(31.689) + '; line-height:' + u(60.179)
      + '; letter-spacing:-.02em; white-space:nowrap }')
    A('.bs .s2-mtable th{ color:#fff }')
    A('.bs .s2-mtable .bs-tl{ margin-inline:0 }')
    for k, my, 테마, 만듦, gy in 달표:
        A(f'.bs .s2-m-{k}{{ {자리(130, my, 폭(k))} }}')
        A(f'.bs .s2-mt-{k}{{ {자리(325.664, gy, 200)} }}')
        A(f'.bs .s2-mm-{k}{{ {자리(539.325, gy, 260)} }}')
    A('')
    A('/* ── 커리큘럼 ── */')
    A('/* 3684:28824 — SemiBold 50/60 -2.5px #7B7B7B */')
    A('.bs .s2-when{ ' + 자리(139, 3471, 581) + '; text-align:center; color:#7B7B7B;'
      ' font-weight:600; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.05em }')
    A('/* 3684:410 — 아웃라인 벡터. TLAB 아님 */')
    A('.bs .s2-curw{ ' + 자리(38, 3549, 773.48) + ' }')
    A('/* 3684:425 — SemiBold 22 -0.88, 앞 구절만 #2CFF05 */')
    A('.bs .s2-game{ ' + 자리(143, 3689, 718) + '; color:#fff; font-weight:600;'
      ' font-size:' + u(22) + '; line-height:1.3; letter-spacing:-.04em }')
    A('.bs .s2-game b{ font-weight:inherit; color:var(--green) }')
    A('/* 3684:426 표 머리 — 왼쪽 위가 파인 벡터다. 네모로 그리면 다르다 */')
    A('.bs .s2-thead{ ' + 자리(38, 3695.303, 774.04) + ' }')
    A('.bs .s2-th1,.bs .s2-th2,.bs .s2-th3{ color:#000; font-weight:600;'
      ' font-size:' + u(27.01) + '; line-height:1.2 }')
    A('.bs .s2-th1{ ' + 자리(55.38, 3761.404, 50) + ' }')
    A('.bs .s2-th2{ ' + 자리(373.22, 3761.404, 106) + ' }')
    A('.bs .s2-th3{ ' + 자리(749, 3761.404, 50) + ' }')
    A('.bs .s2-cur{ list-style:none; inset:0 }')
    A('.bs .s2-cur li{ position:static }')
    A('.bs .s2-w,.bs .s2-e,.bs .s2-s{ position:absolute }')
    A('.bs .s2-w{ color:#fff }')
    A('.bs .s2-e{ color:#fff }')
    A('/* 3684:399 외 — Medium 27 -1.62 흰색 */')
    A('.bs .s2-s{ color:#fff; font-weight:500; font-size:' + u(27) + ';'
      ' line-height:1.2; letter-spacing:-.06em; white-space:nowrap }')
    A('.bs .s2-w .bs-tl,.bs .s2-e .bs-tl{ margin-inline:0 }')
    for i, (wk, wx, wy, ek, ey, sy, 주제) in enumerate(강, 1):
        if wk:
            A(f'.bs .s2-cu{i} .s2-w{{ {자리(wx, wy, 폭(wk))} }}')
        A(f'.bs .s2-e{i}{{ {자리(761, ey, 폭(ek))} }}')
        A(f'.bs .s2-s{i}{{ {자리(118, sy, 700)} }}')
    A('.bs .s2-cend{ ' + 자리(38, 4315.86, 774.04, 1) + '; border:0; background:#3A3A3A }')
    A('')
    A('/* ── 추천 대상 ── */')
    A('/* 3687:28870 — Bold 50/60 -0.8px, 「라이카 시네마」만 #FF742F */')
    A('.bs .s2-laika{ ' + 자리(-3, 4419, 799) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.016em }')
    A('.bs .s2-laika b{ font-weight:inherit; color:#FF742F }')
    A('.bs .s2-lmark{ ' + 자리(742, 4419, 63, 63) + ' }')
    A('/* 3697:32975 — SemiBold 27 -1.35 흰색 */')
    A('.bs .s2-screen{ ' + 자리(194, 4492, 472) + '; text-align:center; color:#fff;'
      ' font-weight:600; font-size:' + u(27) + '; line-height:1.3; letter-spacing:-.05em }')
    A('/* 3684:469 — Bold 50/60 -1.5px 흰색 */')
    A('.bs .s2-cfeat{ ' + 자리(282.445, 4789, 307) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em }')
    A('/* 3684:474 — TLAB 110 #2CFF05 (잉크 x64 y4867) */')
    A('.bs .s2-whoh{ ' + 자리(64, 4867, 폭('b-whoh')) + '; color:var(--green) }')
    A('.bs .s2-who{ list-style:none; inset:0 }')
    A('.bs .s2-who li{ position:static }')
    A('.bs .s2-wc,.bs .s2-wt,.bs .s2-wd{ position:absolute }')
    A('/* 3684:452 외 — Bold 44 -1.32 흰색 / 3684:460 외 — Bold 22/32 흰색 */')
    A('.bs .s2-wt{ color:#fff; font-weight:700; font-size:' + u(44) + ';'
      ' line-height:1.2; letter-spacing:-.03em }')
    A('.bs .s2-wd{ color:#fff; font-weight:700; font-size:' + u(22) + '; line-height:' + u(32) + ' }')
    for i, (ch, cx, cy, cw, chh, 정렬, tx, ty, tw, 제목, dx, dy, dw, 설명) in enumerate(추천, 1):
        A(f'.bs .s2-wi{i} .s2-wc{{ {자리(cx, cy, cw)} }}')
        A(f'.bs .s2-wi{i} .s2-wt{{ {자리(tx, ty, tw)}; text-align:{정렬} }}')
        A(f'.bs .s2-wi{i} .s2-wd{{ {자리(dx, dy, dw)}; text-align:{정렬} }}')
    A('')
    A('/* 3726:34210 단체사진 — 글이 사진 위에 얹힌다 */')
    A('.bs .s2-crowd{ ' + 자리(42, 7008.544, 775) + '; border-radius:' + u(16) + ' }')
    A('/* 3687:28880 — 3684:28723 과 같은 층위 */')
    A('.bs .s2-crowd1{ ' + 자리(61, 7137, 738) + '; text-align:center; color:#CFCFCF;'
      ' font-weight:800; font-size:' + u(40) + '; line-height:' + u(54) + '; letter-spacing:-.02em }')
    A('/* 3687:28879 — ExtraBold 50/60 -1.5px 흰색, 앞 구절만 #2CFF05 */')
    A('.bs .s2-crowd2{ ' + 자리(8, 7181, 844) + '; text-align:center; color:#fff;'
      ' font-weight:800; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em }')
    A('.bs .s2-crowd2 b{ font-weight:inherit; color:var(--green) }')
    A('/* 3697:33007 — Bold 50/60 -1.5px 흰색 */')
    A('.bs .s2-perk1{ ' + 자리(193, 7689, 473) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em }')
    A('/* 3697:33008 — TLAB 110 #2CFF05 (잉크 x125 y7765) */')
    A('.bs .s2-perkh{ ' + 자리(125, 7765, 폭('b-perkh')) + '; color:var(--green) }')
    A('')
    A('/* ── 혜택 캡슐 ── */')
    A('/* 3697:33233 주황 · 3697:33342 초록 — 760 폭 r100 테두리 4px */')
    A('.bs .s2-cap{ border-radius:' + u(100) + '; border:' + u(4) + ' solid }')
    A('.bs .s2-capO{ ' + 자리(50, 7937, 760, 849) + '; border-color:#FF742F;'
      ' background:linear-gradient(149.76deg, #431600 6.66%, #000 41.33%, #431600 94.95%) }')
    A('.bs .s2-capG{ ' + 자리(53, 8848, 760, 1376) + '; border-color:var(--green);'
      ' background:linear-gradient(136.63deg, #063908 6.66%, #000 41.33%, #063908 94.95%) }')
    A('/* 3697:33237 라이카 워드마크 */')
    A('.bs .s2-capOlock{ ' + 자리(220, 8050, 421.302) + ' }')
    A('.bs .s2-capOlogo{ ' + 자리(257, 8195, 333) + ' }')
    A('/* 3697:33236 — SemiBold 30/44 -0.3 #CDFF0C */')
    A('.bs .s2-capOsub{ ' + 자리(92, 8356, 677) + '; text-align:center; color:#CDFF0C;'
      ' font-weight:600; font-size:' + u(30) + '; line-height:' + u(44) + '; letter-spacing:-.01em }')
    A('.bs .s2-capOa{ ' + 자리(124, 8437, 폭('b-theater')) + '; color:#FF742F }')
    A('.bs .s2-capOb{ ' + 자리(124, 8578, 폭('b-ticket')) + '; color:#FF742F }')
    A('/* 3697:33344 — 33236 과 같은 층위, 흰색 */')
    A('.bs .s2-capGsub{ ' + 자리(95, 8950, 677) + '; text-align:center; color:#CDFF0C;'
      ' font-weight:600; font-size:' + u(30) + '; line-height:' + u(44) + '; letter-spacing:-.01em }')
    A('.bs .s2-capGlock{ ' + 자리(128, 9029.297, 369.274) + ' }')
    A('/* 3697:33420 — ExtraBold 43.825/38.566 -0.4383 흰색 */')
    A('.bs .s2-capGmaster{ ' + 자리(511.568, 9028.178, 236.432) + '; text-align:center; color:#fff;'
      ' font-weight:800; font-size:' + u(43.825) + '; line-height:' + u(38.566) + '; letter-spacing:-.01em }')
    A('.bs .s2-capGa{ ' + 자리(121, 9088, 627) + '; display:flex; align-items:flex-end;'
      ' justify-content:center; gap:' + u(14) + '; color:var(--green) }')
    A('.bs .s2-capGa .bs-tl{ margin-inline:0 }')
    A('.bs .s2-ws1 .bs-tl{ width:' + u(폭('b-ws1')) + ' }')
    A('.bs .s2-ws2 .bs-tl{ width:' + u(폭('b-ws2')) + ' }')
    A('.bs .s2-ws3 .bs-tl{ width:' + u(폭('b-ws3')) + ' }')
    A('.bs .s2-capGb{ ' + 자리(49, 9235, 폭('b-party')) + '; color:var(--green) }')
    A('.bs .s2-capGpic1{ ' + 자리(116.691, 9382, 632.616) + '; border-radius:' + u(20) + ' }')
    A('.bs .s2-capGpic2{ ' + 자리(116.691, 9757.266, 632.616) + '; border-radius:' + u(20) + ' }')
    A('/* 3736:27536 · 3697:33432 — Bold 24 -0.72 흰색 */')
    A('.bs .s2-capGcap1,.bs .s2-capGcap2{ text-align:center; color:#fff; font-weight:700;'
      ' font-size:' + u(24) + '; line-height:1.2; letter-spacing:-.03em }')
    A('.bs .s2-capGcap1{ ' + 자리(262, 9687, 342.414) + ' }')
    A('.bs .s2-capGcap2{ ' + 자리(334, 10065, 191) + ' }')
    A(꼬리)
    나옴 = []
    for 줄 in L:
        if 줄.startswith('.bs .s2-') or 줄.startswith('.bs .bs-s2'):
            줄 = re.sub(r'\.bs \.s2-', '.bs .bs-s2 .s2-', 줄)
        나옴.append(줄)
    return '\n'.join(나옴) + '\n'


def 적용():
    hp = os.path.join(SITE, 'basic.html')
    s = io.open(hp, encoding='utf-8').read()
    a = s.index('<!-- ══ 상페2 (3684:261)') if '<!-- ══ 상페2 (3684:261)' in s \
        else s.index('<!-- ── CLASS FEATURE (상페2)')
    b = s.index('<!-- ══ 상페3 (3684:17645)')
    s = s[:a] + html() + '\n' + s[b:]
    io.open(hp, 'w', encoding='utf-8').write(s)

    cp = os.path.join(SITE, 'css/basic.css')
    c = io.open(cp, encoding='utf-8').read()
    새 = css()
    if 머리 in c:
        i = c.index(머리); j = c.index(꼬리, i) + len(꼬리) + 1
        c = c[:i] + 새 + c[j:]
    else:
        c = c.rstrip('\n') + '\n\n' + 새
    io.open(cp, 'w', encoding='utf-8').write(c)
    print('상페2 갱신')


if __name__ == '__main__':
    적용()
