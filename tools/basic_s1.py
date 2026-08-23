#!/usr/bin/env python3
"""왕초보반 basic.html 의 「상페1」(히어로 ~ 나는 뭘 좋아할까)을 피그마 1:1 로 짠다.

  피그마 3684:17907 (860 x 8630).

  ■ 왜 절대 배치인가 — tools/basic_s3.py 머리말 참고.
  ■ 좌표는 get_metadata 값 그대로. TLAB 제목만 렌더에서 잰 '잉크' 좌표를 쓴다.
  ■ 사진에는 피그마에서 위에 덮인 어두운 막이 이미 구워져 있다(tools/mkasset.py).
    CSS 로 또 덮지 않는다.
  ■ ⚠ 걱정 카드 테두리는 get_design_context 가 #EBEBFF 라고 하지만
    실제 렌더 픽셀은 초록 #2CFF05 다. 렌더를 믿는다.

  python3 tools/basic_s1.py && python3 tools/bust.py
"""
import io, json, os, re

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
META = json.load(open(os.path.join(SITE, 'assets/tlab/meta.json'), encoding='utf-8'))
판 = 8630.0


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


def 잉크(key):
    return META[key]['ink_px']


# ── 표 ────────────────────────────────────────────────────────────
걱정 = [
    (3483, '“시간을 엄청 들여야 하는 거 아니야?”', 3561, 703,
     3632, 584, '주 2회 · 2시간 · 4주.<br>총 16시간이면 <b>상영회</b>에 내 영상이 걸려요.'),
    (3823, '“나 같은 초보가 가도 되나?”', 3881, 703,
     3952, 537, '그래서 따로 개설했어요.<br>아무것도 모르는 사람만 모아서 처음부터 시작하는 <b>기초반</b>이에요.'),
    (4163, '“장비도 없고, 편집도 못 하는데?”', 4221, 703,
     4292, 584, '<b>휴대폰</b> 하나면 됩니다.<br>카메라 살 필요 없고, 프로그램도<br>열어본 적 없어도 괜찮아요.'),
]
# (줄 y, 아이콘파일, 아이콘 x/y/w/h, 굵은글, 설명)
없어도 = [
    (4783, 'nono-cam',    73.423, 4808.783, 48.577, 68.276, '고급 카메라, 삼각대, 짐벌', '손으로 들고 찍어도 충분히 만들 수 있어요.'),
    (4915, 'nono-edit',   75.0,   4950.0,   49.686, 49.508, '편집 프로그램', '휴대폰 무료 앱으로도 왠만한건 다 가능해요.'),
    (5047, 'nono-script', 75.599, 5075.716, 52.402, 56.236, '시나리오 형식', '카톡이나 메모장에 줄글로 써도 돼요.'),
    (5179, 'nono-light',  70.0,   5204.0,   52.673, 68.885, '조명 장비 설치', '창가 햇빛과 스탠드면 충분해요.'),
    (5311, 'nono-term',   76.0,   5341.0,   42.121, 56.326, '용어 암기, 시험', '들으면 아는 정도면 OK!'),
]
# 카드: (키, 사각 x,y,w,h, 아이콘(파일,x,y,w,h) 또는 None, 제목키·잉크x·잉크y, 설명 x,y,w, 설명글)
카드 = [
    ('plan',   51, 7013,      372, 415.62, ('card-plan',   163, 7002, 143, 204),
     'b-plan',   194, 7211, 70,  7317.905, 339, '레퍼런스 모으고<br>판 짜는 게 체질이에요'),
    ('direct', 451, 7013,     372, 415.62, ('card-direct', 580, 7016, 118, 176),
     'b-direct', 594, 7211, 468, 7317.938, 339, '무슨 이야기를 할지<br>정하는 게 신나요'),
    ('shoot',  51, 7453.190,  372, 415.62, ('card-shoot',  198.187, 7371.043, 191.790, 328.914),
     'b-shoot',  106, 7650, 77,  7758.128, 321, '장비 만지고 앵글<br>잡는 데 손이 가요'),
    ('ai',     451, 7453.190, 372, 415.62, ('card-ai',     549.912, 7481.732, 189.176, 201.623),
     'b-ai',     610, 7656, 477, 7758.095, 321, '상상만 하던 때깔 좋은<br>비주얼을 구현하고 싶어요'),
    ('edit',   51, 7893,      372, 271,    None,
     'b-edit',   193, 7948, 68,  8053.350, 339, '컷 붙이는 리듬감이<br>제일 재밌어요'),
    ('color',  451, 7893,     372, 270,    None,
     'b-color',  567, 7947, 487, 8051.970, 301, '화면 톤 하나로<br>분위기 만드는 게 좋아요'),
]


def html():
    ㅅ = []; A = ㅅ.append
    A('<!-- ══ 상페1 (3684:17907) — tools/basic_s1.py 가 만든다. 손대지 말 것 ══ -->')
    A('<section class="bs-s1 bs-board" aria-labelledby="bs-title">')
    A('  <img class="s1-hero" src="assets/img/basic/hero-cinema.webp" width="1720" height="1754" '
      'fetchpriority="high" alt="라이카 시네마 극장에서 수강생들이 자기 영상 상영을 보고 있다">')
    A('  <p class="s1-copy tb bs-rv">취미로 시작했는데<br>한 달 뒤 <b>극장</b>에서<br>내 영상이 상영됩니다.</p>')
    A('  <img class="s1-lock bs-rv" src="assets/img/basic/ico/lock-hero.svg" width="515" height="102" '
      'alt="FVA ACADEMY × 21STUDIOS">')
    A(f'  <h1 class="s1-basic bs-rv" id="bs-title">{tl("b-basicclass", "BASIC CLASS")}</h1>')
    A('  <p class="s1-sub tb bs-rv">피바아카데미 × 21스튜디오 베이직 클래스</p>')
    A('  <img class="s1-monster" src="assets/img/basic/theater-monster.webp" width="1720" height="2164" '
      'loading="lazy" alt="3D 안경을 쓴 피바 캐릭터가 극장 좌석에서 팝콘을 들고 있다">')
    A('  <p class="s1-oddlead bs-rv">와서 놀다 보니 내 영상 하나가 완성돼 있는</p>')
    A(f'  <h2 class="s1-odd bs-rv">{tl("b-odd", "수상한 아카데미가 있다?")}</h2>')
    A('  <img class="s1-blur" src="assets/img/basic/field-blur.webp" width="1720" height="1046" '
      'loading="lazy" alt="스태프들이 촬영 장비를 들고 야외 현장을 준비하고 있다">')
    A('  <h2 class="s1-can bs-rv"><b>“영상, 나도 한번 해볼까?”</b><br>그 정도면 당신도 시작할 수 있습니다</h2>')
    A('  <p class="s1-why tb bs-rv"><i>그동안 영상 미뤄두셨던 이유,</i><br><b>혹시 이 셋 중 하나이신가요?</b></p>')
    for n, (y, 제목, ty, tw, by, bw, 본문) in enumerate(걱정, 1):
        A(f'  <div class="s1-worry s1-w{n} bs-rv" aria-hidden="true"></div>')
        A(f'  <p class="s1-wq s1-wq{n} tb bs-rv">{제목}</p>')
        A(f'  <p class="s1-wa s1-wa{n} tb bs-rv">{본문}</p>')
    A('  <h2 class="s1-nonoh bs-rv">수업 시작 전에 겁나는 것들은<br><b>저희가 미리 빼드릴게요</b></h2>')
    A('  <div class="s1-nonobox" aria-hidden="true"></div>')
    A('  <ul class="s1-nono">')
    for i, (y, 아, ax, ay, aw, ah, 굵, 설명) in enumerate(없어도, 1):
        A(f'    <li class="s1-n{i} bs-rv">')
        A(f'      <span class="s1-nrow" aria-hidden="true"></span>')
        A(f'      <img class="s1-nico" src="assets/img/basic/ico/{아}.svg" alt="" aria-hidden="true">')
        A(f'      <img class="s1-nsl" src="assets/img/basic/ico/nono-slash.svg" alt="" aria-hidden="true">')
        A(f'      <span class="s1-ntx tb"><b>{굵}</b><br>{설명}</span>')
        A('    </li>')
    A('  </ul>')
    A('  <img class="s1-teacher" src="assets/img/basic/teacher-field.webp" width="1720" height="1182" '
      'loading="lazy" alt="감독이 촬영 현장에서 의자에 앉아 모니터를 보고 있다">')
    A('  <h2 class="s1-one bs-rv">많이 빼드렸죠?<br>대신 <b>딱 하나</b> 해야될 게 있어요</h2>')
    A('  <p class="s1-baro tb bs-rv">그건 바로....</p>')
    A('  <p class="s1-goal bs-rv">이번 달 안에 1분짜리 영상 하나를<br><b>끝까지 완성하는 것</b></p>')
    A('  <img class="s1-sprout" src="assets/img/basic/ico/sprout.webp" width="304" height="439" '
      'loading="lazy" alt="" aria-hidden="true">')
    A(f'  <h2 class="s1-like bs-rv">{tl("b-like", "나는 뭘 좋아할까?")}</h2>')
    A('  <ul class="s1-cards">')
    for (키, x, y, w, h, 아이콘, tkey, ix, iy, dx, dy, dw, 설명) in 카드:
        A(f'    <li class="s1-c s1-c-{키} bs-rv">')
        A('      <span class="s1-cbox" aria-hidden="true"></span>')
        if 아이콘:
            A(f'      <img class="s1-cico" src="assets/img/basic/ico/{아이콘[0]}.webp" alt="" aria-hidden="true">')
        A(f'      <span class="s1-ch">{tl(tkey, META[tkey]["text"])}</span>')
        A(f'      <span class="s1-cd tb">{설명}</span>')
        A('    </li>')
    A('  </ul>')
    A('  <p class="s1-both tb bs-rv">현장은 <b>카메라 안과 밖</b>으로 나뉩니다.<br>'
      '어느 쪽이 나에게 맞는지는 직접 해봐야 알죠.<br>그래서 한 달 동안 <b>둘 다 경험해봅니다.</b></p>')
    A('</section>')
    return '\n'.join(ㅅ) + '\n'


머리 = '/* ══ 상페1 (3684:17907) — tools/basic_s1.py 가 만든다. 손대지 말 것 ══ */'
꼬리 = '/* ══ 상페1 끝 ══ */'


def css():
    L = []; A = L.append
    A(머리)
    A('.bs .bs-s1{ height:' + u(판) + ' }')
    A('')
    A('/* 3731:34265 히어로 사진 (x-8 y44 w877 → 판에 맞춰 잘림) */')
    A('.bs .s1-hero{ ' + 자리(0, 44, 860) + ' }')
    A('/* 3684:17919 — SemiBold 44/55 -2.2px #CFCFCF, 「극장」만 Bold #2CFF05 */')
    A('.bs .s1-copy{ ' + 자리(120, 92, 620) + '; text-align:center; color:#CFCFCF;'
      ' font-weight:600; font-size:' + u(44) + '; line-height:' + u(55) + '; letter-spacing:-.05em }')
    A('.bs .s1-copy b{ font-weight:700; color:var(--green) }')
    A('/* 3684:28719 FVA ACADEMY × 21STUDIOS */')
    A('.bs .s1-lock{ ' + 자리(173.001, 947.239, 514.999) + ' }')
    A('/* 3684:17913 — TLAB 176 #2CFF05 (잉크 x78 y1094) */')
    A('.bs .s1-basic{ ' + 자리(78, 1094, 잉크('b-basicclass')[0]) + '; color:var(--green) }')
    A('/* 3684:28725 — Bold 44/60.838 -1.76px #2CFF05 */')
    A('.bs .s1-sub{ ' + 자리(45, 1276.594, 774) + '; text-align:center; color:var(--green);'
      ' font-weight:700; font-size:' + u(44) + '; line-height:' + u(60.838) + '; letter-spacing:-.04em }')
    A('')
    A('/* 3730:34260 극장 몬스터 (x-6 y1374 w871) */')
    A('.bs .s1-monster{ ' + 자리(0, 1374, 860) + ' }')
    A('/* 3684:28715 — Bold 41 -1.23px #F5F5F6 (trim 없음) */')
    A('.bs .s1-oddlead{ ' + 자리(81, 2363, 698) + '; text-align:center; color:#F5F5F6;'
      ' font-weight:700; font-size:' + u(41) + '; line-height:' + u(50) + '; letter-spacing:-.03em }')
    A('/* 3684:28713 — TLAB 120.82 #2CFF05 (잉크 x46 y2429) */')
    A('.bs .s1-odd{ ' + 자리(46, 2429, 잉크('b-odd')[0]) + '; color:var(--green) }')
    A('')
    A('/* 3697:33229 블러 현장 (x-11 y2697 w883) */')
    A('.bs .s1-blur{ ' + 자리(0, 2697, 860) + ' }')
    A('/* 3684:28731 — Bold 50/60 -1.5px 흰색, 첫 줄만 #2CFF05 (trim 없음) */')
    A('.bs .s1-can{ ' + 자리(30, 2883, 799) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em }')
    A('.bs .s1-can b{ font-weight:inherit; color:var(--green) }')
    A('/* 3684:17916 — 40/52 -1.2px. 1줄 Medium #A0A0A0 · 2줄 ExtraBold 흰색 */')
    A('.bs .s1-why{ ' + 자리(51, 3353, 757) + '; text-align:center; font-size:' + u(40) + ';'
      ' line-height:' + u(52) + '; letter-spacing:-.03em }')
    A('.bs .s1-why i{ font-style:normal; font-weight:500; color:#A0A0A0 }')
    A('.bs .s1-why b{ font-weight:800; color:#fff }')
    A('')
    A('/* 걱정 카드 3장 (3684:17962 외) — 760x302 r100, 테두리 4px.')
    A('   ⚠ get_design_context 는 테두리를 #EBEBFF 라 하지만 렌더 픽셀은 #2CFF05 다. */')
    A('.bs .s1-worry{ ' + 자리(50, None, 760, 302) + '; border:' + u(4) + ' solid var(--green);'
      ' border-radius:' + u(100) + ';'
      ' background:linear-gradient(168.287deg, #063908 6.66%, #000 41.33%, #063908 94.95%) }')
    A('.bs .s1-wq{ text-align:center; color:#08FFD0; font-weight:700; font-size:' + u(44) + ';'
      ' line-height:' + u(54) + '; letter-spacing:-.02em }')
    A('.bs .s1-wa{ text-align:center; color:#fff; font-weight:600; font-size:' + u(33) + ';'
      ' line-height:' + u(47) + '; letter-spacing:-.02em }')
    A('.bs .s1-wa b{ font-weight:inherit; color:var(--green) }')
    for n, (y, 제목, ty, tw, by, bw, 본문) in enumerate(걱정, 1):
        A(f'.bs .s1-w{n}{{ top:{u(y)} }}')
        A(f'.bs .s1-wq{n}{{ {자리(430 - tw / 2 - 0.5, ty, tw)} }}')
        A(f'.bs .s1-wa{n}{{ {자리(430 - bw / 2 - 4, by, bw)} }}')
    A('')
    A('/* 3684:21018 — Bold 50/60 -1.5px, 2줄만 초록 */')
    A('.bs .s1-nonoh{ ' + 자리(30, 4611, 799) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em }')
    A('.bs .s1-nonoh b{ font-weight:inherit; color:var(--green) }')
    A('/* 3726:33995 바깥 판 #272727 r13.51 */')
    A('.bs .s1-nonobox{ ' + 자리(39, 4770, 782, 675) + '; background:#272727;'
      ' border-radius:' + u(13.51) + ' }')
    A('/* ⚠ 판의 자식은 전부 absolute 라 ul 이 폭 0 이 된다. 그러면 그 안의 <img> 가')
    A('     max-width:100%(=0) 에 눌려 사라진다. 목록을 판 전체에 펼쳐 담는 그릇으로 만든다. */')
    A('.bs .s1-nono{ list-style:none; inset:0 }')
    A('.bs .s1-nono li{ position:static }')
    A('.bs .s1-nrow,.bs .s1-nico,.bs .s1-nsl,.bs .s1-ntx{ position:absolute }')
    A('.bs .s1-nrow{ ' + 자리(50, None, 759, 120) + '; background:#121212;'
      ' border-radius:' + u(22.5) + ' }')
    A('/* 3684:28735 외 — Medium 27/40 -0.54px 흰색, 첫 줄만 ExtraBold */')
    A('.bs .s1-ntx{ ' + 자리(140, None, 642) + '; color:#fff; font-weight:500;'
      ' font-size:' + u(27) + '; line-height:' + u(40) + '; letter-spacing:-.02em }')
    A('.bs .s1-ntx b{ font-weight:800 }')
    A('.bs .s1-nsl{ ' + 자리(68.5, None, 48.5, 79) + ' }')
    for i, (y, 아, ax, ay, aw, ah, 굵, 설명) in enumerate(없어도, 1):
        A(f'.bs .s1-n{i} .s1-nrow{{ top:{u(y)} }}')
        A(f'.bs .s1-n{i} .s1-nsl{{ top:{u(y + 20)} }}')
        A(f'.bs .s1-n{i} .s1-ntx{{ top:{u(y + 28)} }}')
        A(f'.bs .s1-n{i} .s1-nico{{ {자리(ax, ay, aw, ah)} }}')
    A('')
    A('/* 3697:33076 강사 현장 (x-37 y5601 w933) */')
    A('.bs .s1-teacher{ ' + 자리(0, 5601, 860) + ' }')
    A('/* 3684:21100 — Bold 50/60 -1.5px, 「딱 하나」만 초록 */')
    A('.bs .s1-one{ ' + 자리(136, 5822, 586) + '; text-align:center; color:#fff;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.03em;'
      ' white-space:nowrap }')
    A('.bs .s1-one b{ font-weight:inherit; color:var(--green) }')
    A('/* 3684:28723 — ExtraBold 40/54 -0.8px #CFCFCF */')
    A('.bs .s1-baro{ ' + 자리(61, 6425, 738) + '; text-align:center; color:#CFCFCF;'
      ' font-weight:800; font-size:' + u(40) + '; line-height:' + u(54) + '; letter-spacing:-.02em }')
    A('/* 3684:21101 — ExtraBold 57/74 -2.85px, 2줄만 초록 */')
    A('.bs .s1-goal{ ' + 자리(8, 6471, 844) + '; text-align:center; color:#fff;'
      ' font-weight:800; font-size:' + u(57) + '; line-height:' + u(74) + '; letter-spacing:-.05em }')
    A('.bs .s1-goal b{ font-weight:inherit; color:var(--green) }')
    A('/* 3684:17976 새싹 */')
    A('.bs .s1-sprout{ ' + 자리(108, 6804, 101.168) + ' }')
    A('/* 3684:17975 — TLAB 110 #2CFF05 (잉크 x239 y6837) */')
    A('.bs .s1-like{ ' + 자리(239, 6837, 잉크('b-like')[0]) + '; color:var(--green) }')
    A('')
    A('/* 카드 6장 — 사각 #121212 테두리 1px #3A3A3A r25 */')
    A('.bs .s1-cards{ list-style:none; inset:0 }')
    A('.bs .s1-cards li{ position:static }')
    A('.bs .s1-cbox,.bs .s1-cico,.bs .s1-ch,.bs .s1-cd{ position:absolute }')
    A('.bs .s1-cbox{ background:#121212; border:' + u(1) + ' solid #3A3A3A;'
      ' border-radius:' + u(25) + ' }')
    A('.bs .s1-ch{ color:#AAD8F9 }')
    A('/* 3684:20972 외 — SemiBold 30/44 -0.6px #ECECEC */')
    A('.bs .s1-cd{ text-align:center; color:#ECECEC; font-weight:600; font-size:' + u(30) + ';'
      ' line-height:' + u(44) + '; letter-spacing:-.02em }')
    for (키, x, y, w, h, 아이콘, tkey, ix, iy, dx, dy, dw, 설명) in 카드:
        A(f'.bs .s1-c-{키} .s1-cbox{{ {자리(x, y, w, h)} }}')
        if 아이콘:
            A(f'.bs .s1-c-{키} .s1-cico{{ {자리(아이콘[1], 아이콘[2], 아이콘[3], 아이콘[4])} }}')
        A(f'.bs .s1-c-{키} .s1-ch{{ {자리(ix, iy, 잉크(tkey)[0])} }}')
        A(f'.bs .s1-c-{키} .s1-cd{{ {자리(dx, dy, dw)} }}')
    A('')
    A('/* 3684:28782 — Medium 40/52 -1.2px #ECECEC, 강조는 ExtraBold #2CFF05 */')
    A('.bs .s1-both{ ' + 자리(51, 8294, 757) + '; text-align:center; color:#ECECEC;'
      ' font-weight:500; font-size:' + u(40) + '; line-height:' + u(52) + '; letter-spacing:-.03em }')
    A('.bs .s1-both b{ font-weight:800; color:var(--green) }')
    A(꼬리)
    나옴 = []
    for 줄 in L:
        if 줄.startswith('.bs .s1-') or 줄.startswith('.bs .bs-s1'):
            줄 = 줄.replace('.bs .s1-', '.bs .bs-s1 .s1-', 1)
        나옴.append(줄)
    return '\n'.join(나옴) + '\n'


def 적용():
    hp = os.path.join(SITE, 'basic.html')
    s = io.open(hp, encoding='utf-8').read()
    a = s.index('<!-- ══ 상페1 (3684:17907)') if '<!-- ══ 상페1 (3684:17907)' in s \
        else s.index('<!-- ── 히어로 (상페1')
    b = s.index('<!-- ── CLASS FEATURE (상페2)')
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
    print('상페1 갱신')


if __name__ == '__main__':
    적용()
