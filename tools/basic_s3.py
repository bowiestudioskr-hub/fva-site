#!/usr/bin/env python3
"""왕초보반 basic.html 의 「상페3」(21스튜디오~마무리) 를 피그마 1:1 로 짠다.

  피그마 3684:17645 (860 x 11017).

  ■ 왜 절대 배치인가
    여백을 눈으로 맞추면 화면 폭마다 조금씩 어긋난다. 상페3 는 칸이 많아서
    한 군데가 밀리면 아래가 전부 밀린다. 그래서 **피그마 좌표를 그대로 옮긴다**.
      .bs-s3 는 860x높이 의 판이고, 자식은 전부 position:absolute 다.
      x/y/w 는 calc(var(--u) * N/860) 이라 화면이 좁아지면 통째로 줄어든다.

  ■ 글자 상자 맞추기
    피그마가 text-box-trim 을 쓴 글상자는 y 가 '대문자 윗선'이다.
    CSS 도 text-box:trim-both cap alphabetic 을 걸어야 같은 자리에 온다(.tb).
    trim 이 없는 글상자는 그냥 줄상자라서 .tb 를 걸지 않는다.

  ■ TLAB 제목은 잉크 상자 기준이다(아웃라인 SVG 라 여백이 없다).
    좌표는 node3.png 렌더에서 직접 잰 값이다.

  python3 tools/basic_s3.py
"""
import io, json, os, re

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
META = json.load(open(os.path.join(SITE, 'assets/tlab/meta.json'), encoding='utf-8'))

판1 = 8140.0   # 판 하나: 여는 사진 ~ 강의 장소 사진
판2안 = 9810.0  # 판 둘의 원점(마무리)
판2 = 1207.0


def u(v):
    return f'calc(var(--u) * {round(float(v), 3)}/860)'


def 자리(x=None, y=None, w=None, h=None, 밑=None, 기준=0.0):
    ㄱ = []
    if y is not None: ㄱ.append('top:' + u(y - 기준))
    if 밑 is not None: ㄱ.append('bottom:' + u(밑))
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


실적 = [
    ('b-c01', '넷플릭스 한국영화 Top2 &lt;고당도&gt; 제작'),
    ('b-c02', '한국콘텐츠진흥원 뉴미디어 콘텐츠상 수상작 OTT시리즈 &lt;리뷰왕장봉기&gt; 제작'),
    ('b-c03', '세계 3대 애니메이션 영화제 2026년 안시국제애니메이션영화제<br>국내 유일 초청작 &lt;순례자들은 왜 돌아오지 않는가&gt; 제작'),
    ('b-c04', 'AI애니메이션 &lt;빙&gt; - 대한민국 AI 콘텐츠 어워즈 수상'),
    ('b-c05', '한국콘텐츠진흥원/영화진흥위원회 제작지원사업 선정 경험 다수'),
    ('b-c06', '자체 스토리 공모전을 통한 작가진 양성 경험 보유'),
]
이력 = [
    '〈고당도〉 제작, 총괄 PD 담당 — 넷플릭스 한국영화 TOP 2',
    '〈리뷰왕 장봉기〉 PD — 한국콘텐츠진흥원 우수상 / TVING 한국 드라마 TOP 2',
    '세로 숏폼 〈러브샷〉〈맨인블랙〉 총괄 PD',
    'AI 콘텐츠 〈STORY BOTTARI〉〈HALLUCINATION〉 제작 중',
    '한예종 입학생 · 제작사 취업 등 다수 업계 인력 배출, 21PEN 작가 양성',
    '한국예술종합대학교 전문사 영화과 기획전공 수석 졸업',
]
수상 = [
    '제11회 서울 29초영화제 통합 대상 수상',
    '제 11회 신한 29초영화제 일반부 최우수상 수상',
    '2024 BCU 콘텐츠리그 대상 수상',
    '김복남 맥주 BOK PLAY 영상 공모전 대상 수상',
    '얌샘김밥 숏폼 공모전 대상 수상',
]

# 이름 → (x, y, w, h)  ※ 없으면 None. 판1 기준
칸 = {
    'p1':      (0, 0, 860, 576),
    't1':      (285, 262, 290, None),
    'p2':      (0, 576, 860, 591),
    't2':      (301, 843, 257, None),
    'p3':      (0, 1167, 860, 591),
    't3':      (155, 1440, 550, None),
    'lgs':     (262.833, 1792, 333.333, 40),
    'made':    (13, 1985, 834, None),
    'lock':    (216, 2226, 428, 219),   # 자산 위 투명 여백 26 을 뺀 값(잉크가 2252 에 오게)
    'h21':     (430 - 잉크('b-21studios')[0] / 2, 2528, 잉크('b-21studios')[0], None),
    'sub21':   (35, 2610, 789, None),
    'lead21':  (13, 2761, 834, None),
    'pos':     (31, 2896.671, 798, None),
    'ip':      (13, 3379, 834, None),
    'only':    (13, 3449, 834, None),
    'cred':    (39, 3569, 782.49, None),
    'tutpic':  (0, 4267, 860, 617),
    'hugo':    (63, 4717, 잉크('b-hugo')[0], None),
    'headin':  (60, 4882, 500, None),
    'hrole':   (59, 4936, 700, None),
    'rule2':   (52.5, 4986, 751.5, 2),
    'hcv':     (50, 5021, 752, None),
    'story':   (12, 5496, 834, None),
    # ⚠ 트로피 두 가지 함정
    #   1) 판 오른쪽으로 넘쳐서 내보낼 때 701 로 잘렸다. 원래 폭 772.977 을 쓰면 늘어난다.
    #   2) 메타데이터 y(5795.464)와 실제 렌더가 43.5 어긋난다(회전 상자라 그런 듯).
    #      렌더(node3.png)에서 잰 금색 위치에 맞춘다.
    'trophy':  (151.2, 5743.3, 713.8, 830.007),
    'awdlead': (61, 5830.597, 656, None),
    'hawd':    (56, 5895, 잉크('b-award')[0], None),
    'awdlogo': (67, 6053, 354.297, 34.715),
    'awd8':    (65, 6110.221, 388, None),
    'rule3':   (52, 6155.221, 444, 2),
    'awdlist': (50, 6183, 492, None),
    'awdmc':   (65, 6473, 388, None),
    'works':   (-675, 6515, 2210, 982),
    'dimL':    (0, 6515, 64, 982),
    'dimR':    (796, 6515, 64, 982),
    'grow':    (35, 7541, 789, None),
    'placeh':  (13, 7730, 834, None),
    'addr':    (13, 7786, 834, None),
    'pl1':     (0, 7844, 185, 249),
    'pl2':     (185, 7844, 249, 250),
    'pl3':     (435, 7844, 425, 250),
}
칸2 = {   # 판2(마무리) — 원점 9810
    'finlead': (13, 9847, 834, None),
    # ⚠ 원래 노드는 x-90 w962 지만 판 밖은 잘려서 내보내진다. 잘린 그대로 0..860 에 놓는다.
    'finpic':  (0, 10008, 860, 1009),
    'finh':    (13, 10753, 834, None),
    'insta':   (180, 10861, 499, None),
}


def html():
    ㅅ = []
    A = ㅅ.append
    A('<!-- ══ 상페3 (3684:17645) — tools/basic_s3.py 가 만든다. 손대지 말 것 ══ -->')
    A('<section class="bs-s3 bs-s3a bs-board" aria-labelledby="bs-h-made">')
    for n, (파일, h, 글, 대체) in enumerate([
        ('field-crane', 576, '넷플릭스도,', '촬영 현장에 크레인 카메라가 올라가 있다'),
        ('field-screen', 591, '드라마도,', '시사실 스크린에 촬영본이 상영되고 스태프들이 보고 있다'),
        ('field-park', 591, '숏폼도 만드는 사람들이', '공원에서 카메라를 들고 촬영하는 사람들'),
    ], 1):
        A(f'  <img class="bs-p{n}" src="assets/img/basic/{파일}.webp" width="860" height="{h}" loading="lazy" alt="{대체}">')
        A(f'  <p class="bs-t{n} bs-rv">{글}</p>')
    A('  <p class="bs-lgs bs-rv">')
    for 파일, w, h, 이름 in [('lg-netflix', 1360, 368, 'NETFLIX'),
                            ('lg-tving', 317, 144, 'TVING'),
                            ('lg-watcha', 1500, 525, 'WATCHA')]:
        A(f'    <img src="assets/img/basic/ico/{파일}.webp" width="{w}" height="{h}" loading="lazy" alt="{이름}">')
    A('  </p>')
    A('  <h2 class="bs-made tb bs-rv" id="bs-h-made"><b>영상이 처음인</b> 사람들을 위한<br>제작 수업을 만들었어요.</h2>')
    A('  <img class="bs-lock bs-rv" src="assets/img/basic/ico/lock-21full.svg" width="428" height="219" loading="lazy" alt="21STUDIOS">')
    A(f'  <h2 class="bs-h21 bs-rv">{tl("b-21studios", "21STUDIOS - 스토리 IP 전문 제작사")}</h2>')
    A('  <p class="bs-sub21 bs-rv">세계관과 캐릭터를 기반으로 영화·드라마·웹툰·숏폼·AI까지</p>')
    A('  <p class="bs-lead21 tb bs-rv">하나의 이야기를<br>여러 콘텐츠로 확장하는 <b>IP 스튜디오</b></p>')
    A('  <div class="bs-pos bs-rv">')
    for 파일, w, h, 대체 in [('poster1', 259, 371, '영화 〈고당도〉 포스터'),
                            ('poster2', 260, 370, '영화 〈현재를 위하여〉 포스터'),
                            ('poster3', 259, 371, '애니메이션 〈순례자들은 왜 돌아오지 않는가〉 포스터')]:
        A(f'    <img src="assets/img/basic/{파일}.webp" width="{w}" height="{h}" loading="lazy" alt="{대체}">')
    A('  </div>')
    A('  <p class="bs-ip tb bs-rv">200개 이상 IP 라인업 보유</p>')
    A('  <p class="bs-only tb bs-rv">국내 유일 영화, 드라마, 애니메이션, 웹툰, 웹소설, 게임 등<br>'
      '<b>모든 콘텐츠 포멧 자체 기획 및 제작</b>을 경험한 회사</p>')
    A('  <ol class="bs-cred">')
    for key, 글 in 실적:
        A(f'    <li class="bs-rv"><i>{tl(key, key[-2:])}</i><p>{글}</p></li>')
    A('  </ol>')
    A('  <img class="bs-tutpic" src="assets/img/basic/instructor.webp" width="860" height="617" '
      'loading="lazy" alt="대표 강사 HUGO가 시상식 포토월 앞에 서 있다">')
    A(f'  <h2 class="bs-hugo bs-rv">{tl("b-hugo", "HUGO")}</h2>')
    A('  <p class="bs-headin tb bs-rv">Head Instructor</p>')
    A('  <p class="bs-hrole tb bs-rv">현) 21스튜디오 총괄 PD · FVA BASIC 대표 강사</p>')
    A('  <hr class="bs-rule2 bs-rv">')
    A('  <ul class="bs-hcv tb">')
    for 줄 in 이력:
        A(f'    <li class="bs-rv">{줄}</li>')
    A('  </ul>')
    A('  <p class="bs-story tb bs-rv"><b>넷플릭스 TOP 2</b>부터 세로 숏폼까지.<br>매체는 달라도, 결국 <b>이야기</b>는 통한다</p>')
    A('  <img class="bs-trophy" src="assets/img/basic/trophy.webp" width="701" height="830" '
      'loading="lazy" alt="" aria-hidden="true">')
    A('  <p class="bs-awdlead bs-rv">공모전 나가기만 하면 대상을 타오는</p>')
    A(f'  <h2 class="bs-hawd bs-rv">{tl("b-award", "수상한 아카데미")}</h2>')
    A('  <p class="bs-awdlogo bs-rv"><span class="sr-only">FVA ACADEMY</span>'
      '<img src="assets/img/basic/ico/fva-word.svg" width="354" height="35" loading="lazy" alt="" aria-hidden="true"></p>')
    A('  <p class="bs-awd8 tb bs-rv">영상공모전 8연속 수상!</p>')
    A('  <hr class="bs-rule3 bs-rv">')
    A('  <ul class="bs-awdlist tb">')
    for 줄 in 수상:
        A(f'    <li class="bs-rv">{줄}</li>')
    A('    <li class="bs-more bs-rv">등등 다수 공모전 수상</li>')
    A('  </ul>')
    A('  <p class="bs-awdmc tb bs-rv">Master Class 수강생 우수작</p>')
    A('  <div class="bs-works" aria-hidden="true">')
    for _ in range(3):
        A('    <img src="assets/img/basic/works-grid.webp" width="733" height="982" loading="lazy" alt="">')
    A('  </div>')
    A('  <div class="bs-dimL" aria-hidden="true"></div>')
    A('  <div class="bs-dimR" aria-hidden="true"></div>')
    A('  <p class="bs-grow tb bs-rv">영상의 <b>첫걸음부터 현업까지</b>, 피바아카데미와 함께 성장해요!</p>')
    A('  <h2 class="bs-placeh tb bs-rv">강의 장소 : 스페이스독</h2>')
    A('  <p class="bs-addr tb bs-rv">서울 서대문구 연희로8길 18 (연희동 194-25)</p>')
    for n, (파일, w, h, 대체) in enumerate([
        ('spacedog1', 185, 249, '스페이스독 건물 외관'),
        ('terrace', 249, 250, '스페이스독 테라스'),
        ('spacedog2', 425, 250, '스페이스독 강의실 내부')], 1):
        A(f'  <img class="bs-pl{n}" src="assets/img/basic/{파일}.webp" width="{w}" height="{h}" loading="lazy" alt="{대체}">')
    A('</section>')
    return '\n'.join(ㅅ) + '\n'


def 마무리():
    ㅅ = []
    A = ㅅ.append
    A('<!-- ══ 상페3 마무리 (3684:17906 이하) ══ -->')
    A('<section class="bs-s3 bs-s3b bs-board" aria-labelledby="bs-h-fin">')
    A('  <p class="bs-finlead tb bs-rv" id="bs-h-fin">불이 꺼지고<br>스크린에 <b>내 이름</b>이 올라갑니다.</p>')
    A('  <img class="bs-finpic" src="assets/img/basic/laika-hall.webp" width="860" height="1009" '
      'loading="lazy" alt="라이카 시네마 2관 상영관 전경">')
    A('  <p class="bs-finh tb bs-rv">한 달이면 됩니다.<br>영상, 더 이상 혼자 하지 마세요!</p>')
    A('  <p class="bs-insta bs-rv">피바아카데미 공식 인스타그램 : '
      '<a href="https://www.instagram.com/fvaacademy/" target="_blank" rel="noopener">@fvaacademy</a></p>')
    A('</section>')
    A('')
    A('<section class="bs-sec bs-pad">')
    A('  <h2 class="sr-only">왕초보반 신청</h2>')
    A('  <div class="bs-go">')
    A('    <a class="bs-buy" href="https://smartstore.naver.com/bowiestudios/products/13725425855" '
      'target="_blank" rel="noopener">왕초보반 수강 신청하기</a>')
    A('    <a class="bs-ask" href="https://pf.kakao.com/_nxhyhn/chat" '
      'target="_blank" rel="noopener">카카오톡으로 문의하기</a>')
    A('  </div>')
    A('</section>')
    return '\n'.join(ㅅ) + '\n'


머리 = '/* ══ 상페3 (3684:17645) — tools/basic_s3.py 가 만든다. 손대지 말 것 ══ */'
꼬리 = '/* ══ 상페3 끝 ══ */'


def css():
    L = []
    A = L.append
    A(머리)
    A('/* 판 공통 규칙(.bs-board)은 손조판 구역에 있다. 여기서는 높이만 정한다. */')
    A('.bs .bs-s3a{ height:' + u(판1) + ' }')
    A('.bs .bs-s3b{ height:' + u(판2) + ' }')
    A('')
    A('/* ── 여는 사진 3장 (3684:262 · 3689:28881 · 3697:32995) ── */')
    for n in (1, 2, 3):
        x, y, w, h = 칸[f'p{n}']
        A(f'.bs .bs-p{n}{{ {자리(x, y, w)} }}')
    A('/* 3684:17641~17643 — 레이어가 Inter:Bold 50. 한글이 피그마 폴백폰트로 4.5% 크게 렌더된다(실측 52.3/-.018) */')
    A('.bs .bs-t1,.bs .bs-t2,.bs .bs-t3{ text-align:center; color:#fff; font-weight:700;'
      ' font-size:' + u(52.3) + '; line-height:' + u(60) + '; letter-spacing:-.018em }')
    for n in (1, 2, 3):
        x, y, w, _ = 칸[f't{n}']
        A(f'.bs .bs-t{n}{{ {자리(x, y - 2, w)} }}')
    A('/* 3697:33701 — 로고 세 개, 불투명도 25% */')
    A('.bs .bs-lgs{ ' + 자리(*칸['lgs'][:4]) + '; display:flex; align-items:center;'
      ' justify-content:space-between; opacity:.25 }')
    for i, w in [(1, 91.282), (2, 87.179), (3, 99.487)]:
        A(f'.bs .bs-lgs img:nth-child({i}){{ width:{u(w)} }}')
    A('/* 3684:17639 — Bold 50/60 -1px #ECECEC, 앞 구절만 ExtraBold #2CFF05 */')
    A('.bs .bs-made{ ' + 자리(*칸['made'][:3]) + '; text-align:center; color:#ECECEC;'
      ' font-weight:700; font-size:' + u(50) + '; line-height:' + u(60) + '; letter-spacing:-.02em }')
    A('.bs .bs-made b{ font-weight:800; color:var(--green) }')
    A('')
    A('/* ── 21스튜디오 ── */')
    A('.bs .bs-lock{ ' + 자리(*칸['lock'][:3]) + ' }')
    A('/* 3684:17714 — TLAB 70 -2.8 #2CFF05 */')
    A('.bs .bs-h21{ ' + 자리(*칸['h21'][:3]) + '; color:var(--green);'
      ' filter:drop-shadow(0 ' + u(2.7) + ' ' + u(2.7) + ' rgba(0,0,0,.15)) }')
    A('/* 3684:17715 — Medium 33/45 -0.66 #A0A0A0. trim 없는 줄상자 */')
    A('.bs .bs-sub21{ ' + 자리(*칸['sub21'][:3]) + '; text-align:center; color:#A0A0A0;'
      ' font-weight:500; font-size:' + u(33) + '; line-height:' + u(45) + '; letter-spacing:-.02em }')
    A('/* 3684:17716 / 17783 / 17648 / 17784 / 17906 / 3687:28878 — 44/54 #ECECEC */')
    A('.bs .bs-lead21,.bs .bs-ip,.bs .bs-story,.bs .bs-placeh,.bs .bs-finlead,.bs .bs-finh{'
      ' text-align:center; color:#ECECEC; font-weight:800; font-size:' + u(44) + ';'
      ' line-height:' + u(54) + '; letter-spacing:-.02em }')
    A('.bs .bs-lead21 b,.bs .bs-story b,.bs .bs-finlead b{ font-weight:inherit }')
    A('.bs .bs-story b,.bs .bs-finlead b{ color:var(--green) }')
    A('.bs .bs-lead21{ ' + 자리(*칸['lead21'][:3]) + '; letter-spacing:-.0245em }')  # 잉크 실측
    A('.bs .bs-lead21 b{ color:#fff; font-weight:700 }')
    A('/* 포스터 3장 3684:17665 외 — x31..829 */')
    A('.bs .bs-pos{ ' + 자리(*칸['pos'][:3]) + '; display:grid;'
      ' grid-template-columns:' + u(259.205) + ' ' + u(259.675) + ' ' + u(259.395) + ';'
      ' justify-content:space-between; align-items:start }')
    A('.bs .bs-pos img{ border-radius:' + u(6) + ' }')
    A('.bs .bs-ip{ ' + 자리(*칸['ip'][:3]) + ' }')
    A('/* 3684:17785 — SemiBold 27/41 -0.54 #ECECEC, 앞 구절만 #2CFF05 */')
    A('.bs .bs-only{ ' + 자리(*칸['only'][:3]) + '; text-align:center; color:#ECECEC;'
      ' font-weight:600; font-size:' + u(27) + '; line-height:' + u(41) + '; letter-spacing:-.02em }')
    A('.bs .bs-only b{ font-weight:inherit; color:var(--green) }')
    A('/* 실적 6줄 3684:17787 — 바깥 #272727, 줄 #121212 r22.5 */')
    A('.bs .bs-cred{ ' + 자리(*칸['cred'][:3]) + '; list-style:none; background:#272727;'
      ' border-radius:' + u(27) + '; padding:' + u(9) + '; display:grid; gap:' + u(9.004) + ' }')
    A('.bs .bs-cred li{ display:flex; align-items:center; gap:' + u(9.004) + ';'
      ' background:#121212; border-radius:' + u(22.511) + ';'
      ' padding:' + u(18.009) + ' ' + u(22.511) + ' }')
    A('.bs .bs-cred i{ flex:none; color:#AAD8F9 }')
    A('.bs .bs-cred i .bs-tl{ margin-inline:0 }')
    # ⚠ 아웃라인 SVG 는 폭을 안 주면 0 이 된다(그릇이 flex:none 이라 늘어나지도 않는다).
    for key, _ in 실적:
        A(f'.bs .bs-{key}{{ width:{u(잉크(key)[0])} }}')
    A('.bs .bs-cred p{ padding-left:' + u(10) + '; color:#ECECEC; font-weight:600;'
      ' font-size:' + u(22) + '; line-height:' + u(41.779) + '; letter-spacing:-.02em }')
    A('')
    A('/* ── 대표 강사 ── */')
    A('.bs .bs-tutpic{ ' + 자리(*칸['tutpic'][:3]) + ' }')
    A('/* 3684:17830 — TLAB 143.333 -5.7333 #08FFD0 */')
    A('.bs .bs-hugo{ ' + 자리(*칸['hugo'][:3]) + '; color:#08FFD0 }')
    A('.bs .bs-hugo .bs-tl{ margin-inline:0 }')
    A('/* 3684:17828 — Bold 44/54 -1.32 #AAD8F9 */')
    A('.bs .bs-headin{ ' + 자리(*칸['headin'][:3]) + '; color:#AAD8F9; font-weight:700;'
      ' font-size:' + u(44) + '; line-height:' + u(54) + '; letter-spacing:-.03em }')
    A('/* 3684:17827 — Bold 27/48 -0.81 흰색 */')
    A('.bs .bs-hrole{ ' + 자리(*칸['hrole'][:3]) + '; color:#fff; font-weight:700;'
      ' font-size:' + u(27) + '; line-height:' + u(48) + '; letter-spacing:-.03em }')
    A('.bs .bs-rule2{ ' + 자리(*칸['rule2']) + '; border:0; background:#3A3A3A }')
    A('/* 3684:17831 — Medium 22/41.8 -0.66 흰색, 글머리 들여쓰기 33 */')
    A('/* ⚠ ::marker 는 글 바로 앞에 붙어서 피그마(점이 8px 더 왼쪽)와 다르다. 점을 직접 그린다 */')
    A('.bs .bs-hcv,.bs .bs-awdlist{ list-style:none; color:#fff; font-size:' + u(22) + ';'
      ' line-height:' + u(41.8) + '; letter-spacing:-.03em; padding-left:' + u(33) + ' }')
    A('.bs .bs-hcv li,.bs .bs-awdlist li{ position:relative }')
    A('.bs .bs-hcv li::before,.bs .bs-awdlist li::before{ content:""; position:absolute;'
      ' left:' + u(-20) + '; top:' + u(16) + '; width:' + u(6) + '; height:' + u(6) + ';'
      ' border-radius:50%; background:currentColor }')
    A('.bs .bs-hcv{ ' + 자리(*칸['hcv'][:3]) + '; font-weight:500 }')
    A('.bs .bs-story{ ' + 자리(*칸['story'][:3]) + ' }')
    A('')
    A('/* ── 공모전 ── */')
    A('.bs .bs-trophy{ ' + 자리(*칸['trophy'][:3]) + '; z-index:0 }')
    A('/* 3697:33467 — Bold 41 -1.23 #F5F5F6. trim 없는 줄상자 */')
    A('.bs .bs-awdlead{ ' + 자리(칸['awdlead'][0], 칸['awdlead'][1], 칸['awdlead'][2])
      + '; z-index:1; color:#F5F5F6; font-weight:700; font-size:' + u(41) + ';'
      ' line-height:' + u(48) + '; letter-spacing:-.03em }')
    A('/* 3697:33465 — TLAB 120.82 #2CFF05 */')
    A('.bs .bs-hawd{ ' + 자리(*칸['hawd'][:3]) + '; z-index:1; color:var(--green) }')
    A('.bs .bs-hawd .bs-tl{ margin-inline:0 }')
    A('.bs .bs-awdlogo{ ' + 자리(*칸['awdlogo'][:3]) + '; z-index:1 }')
    A('/* 3697:33462 — ExtraBold 30/41.8 -0.9 흰색 */')
    A('.bs .bs-awd8{ ' + 자리(*칸['awd8'][:3]) + '; z-index:1; color:#fff; font-weight:800;'
      ' font-size:' + u(30) + '; line-height:' + u(41.8) + '; letter-spacing:-.03em }')
    A('.bs .bs-rule3{ ' + 자리(*칸['rule3']) + '; z-index:1; border:0; background:#3A3A3A }')
    A('/* 3697:33461 — Bold 22/41.8 -0.66 흰색, 마지막 줄만 #777 */')
    A('.bs .bs-awdlist{ ' + 자리(*칸['awdlist'][:3]) + '; z-index:1; font-weight:700 }')
    A('.bs .bs-awdlist .bs-more{ list-style:none; color:#777; margin-left:' + u(4) + ' }')
    A('/* 3697:33492 — ExtraBold 30/41.8 -0.9 #2CFF05 */')
    A('.bs .bs-awdmc{ ' + 자리(*칸['awdmc'][:3]) + '; z-index:1; color:var(--green);'
      ' font-weight:800; font-size:' + u(30) + '; line-height:' + u(41.8) + '; letter-spacing:-.03em }')
    A('')
    A('/* ── 수강생 우수작 띠 3732:27226 — 733 짜리 판을 좌우로 이어 붙인다 ── */')
    A('.bs .bs-works{ ' + 자리(*칸['works'][:3]) + '; display:flex; gap:' + u(6) + ' }')
    A('.bs .bs-works img{ flex:none; width:' + u(733) + ' }')
    A('/* 좌우로 흘러나간 칸은 피그마에서 10% 밝기로 눌려 있다 */')
    A('.bs .bs-dimL{ ' + 자리(*칸['dimL']) + '; background:rgba(0,0,0,.9); pointer-events:none }')
    A('.bs .bs-dimR{ ' + 자리(*칸['dimR']) + '; background:rgba(0,0,0,.9); pointer-events:none }')
    A('/* 3736:27492 — Bold 30/55.8 -0.9 #777, 가운데 구절만 흰색 */')
    A('.bs .bs-grow{ ' + 자리(*칸['grow'][:3]) + '; text-align:center; color:#777;'
      ' font-weight:700; font-size:' + u(30) + '; line-height:' + u(55.8) + '; letter-spacing:-.03em }')
    A('.bs .bs-grow b{ font-weight:inherit; color:#fff }')
    A('')
    A('/* ── 강의 장소 ── */')
    A('.bs .bs-placeh{ ' + 자리(*칸['placeh'][:3]) + '; letter-spacing:-.05em }')
    A('/* 3684:17786 — Medium 27/41 -1.35 #AAD8F9 */')
    A('.bs .bs-addr{ ' + 자리(*칸['addr'][:3]) + '; text-align:center; color:#AAD8F9;'
      ' font-weight:500; font-size:' + u(27) + '; line-height:' + u(41) + '; letter-spacing:-.05em }')
    for n in (1, 2, 3):
        A(f'.bs .bs-pl{n}{{ {자리(*칸[f"pl{n}"][:3])} }}')
    A('')
    A('/* ── 마무리 (원점 ' + str(int(판2안)) + ') ── */')
    A('.bs .bs-finlead{ ' + 자리(칸2['finlead'][0], 칸2['finlead'][1], 칸2['finlead'][2], 기준=판2안)
      + '; letter-spacing:-.03em }')
    A('.bs .bs-finpic{ ' + 자리(칸2['finpic'][0], 칸2['finpic'][1], 칸2['finpic'][2], 기준=판2안) + ' }')
    A('.bs .bs-finh{ ' + 자리(칸2['finh'][0], 칸2['finh'][1], 칸2['finh'][2], 기준=판2안)
      + '; letter-spacing:-.03em }')
    A('/* 3697:33230 — SemiBold 24 -1.2 흰색. trim 없는 줄상자 */')
    A('.bs .bs-insta{ ' + 자리(칸2['insta'][0], 칸2['insta'][1] - 5, 칸2['insta'][2], 기준=판2안)
      + '; text-align:center; color:#fff; font-weight:600; font-size:' + u(24) + ';'
      ' line-height:' + u(34) + '; letter-spacing:-.05em }')
    A('.bs .bs-insta a{ color:var(--green) }')
    A(꼬리)
    # ⚠ .bs .bs-s3 img{width:100%} 는 요소 선택자가 하나 더 붙어 .bs .bs-lock 을 이긴다.
    #   그래서 칸 규칙은 전부 .bs .bs-s3 .bs-xxx 로 한 단계 올린다.
    나옴 = []
    for 줄 in L:
        if 줄.startswith('.bs .bs-') and not 줄.startswith('.bs .bs-s3'):
            줄 = re.sub(r'\.bs \.bs-(?!s3)', '.bs .bs-s3 .bs-', 줄)
        나옴.append(줄)
    return '\n'.join(나옴) + '\n'


def 적용():
    hp = os.path.join(SITE, 'basic.html')
    s = io.open(hp, encoding='utf-8').read()
    a = s.index('<!-- ══ 상페3 (3684:17645)') if '<!-- ══ 상페3 (3684:17645)' in s \
        else s.index('<!-- ── 상페3 여는 사진')
    b = s.index('<!-- ── 가격 (3684:17731)')
    s = s[:a] + html() + '\n' + s[b:]
    a = s.index('<!-- ══ 상페3 마무리') if '<!-- ══ 상페3 마무리' in s else s.index('<!-- ── 마무리')
    b = s.index('</main>')
    s = s[:a] + 마무리() + '\n' + s[b:]
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
    print('basic.html · css/basic.css 갱신')


if __name__ == '__main__':
    적용()
