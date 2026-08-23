#!/usr/bin/env python3
"""왕초보반(basic.html)에 쓰는 TLAB 믹스커피 제목을 SVG 아웃라인으로 만든다.

  피그마 21스튜디오 상페 1·2·3 (860 기준). get_design_context 로 읽은
  글자크기·자간을 그대로 넣는다. 역산하지 않는다.

  ⚠ 값은 860 기준이다. CSS 에서는 width:calc(var(--u) * <잉크폭>/860) 로 쓴다.
  python3 tools/tlab_basic.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlab_build as T
from tlab_add import make

SPECS = [
    # 히어로 (3684:17913) TLAB 176px 자간 -9.68 #2CFF05
    ('b-basicclass', ['BASIC CLASS'], 176.0, -9.68, None, 'BASIC CLASS'),
    # 수상한 아카데미가 있다? (3684:28713) TLAB 120.82px 자간 0 #2CFF05
    ('b-odd',        ['수상한 아카데미가 있다?'], 120.82, 0.0, None, '수상한 아카데미가 있다?'),
    # 나는 뭘 좋아할까 카드 제목 (3684:20978 외) TLAB 84px 자간 -0.84 #AAD8F9
    ('b-plan',   ['기획'],        84.0, -0.84, None, '기획'),
    ('b-direct', ['연출'],        84.0, -0.84, None, '연출'),
    ('b-shoot',  ['촬영/테크닉'],  84.0, -0.84, None, '촬영/테크닉'),
    ('b-ai',     ['AI'],          84.0, -0.84, None, 'AI'),
    ('b-edit',   ['편집'],        84.0, -0.84, None, '편집'),
    ('b-color',  ['색보정'],      84.0, -0.84, None, '색보정'),

    # 가격 상자 (3684:17739/17741/17770/17773)
    ('b-was',    ['정가 449,000원'], 70.846,  -1.4169, None, '정가 449,000원'),
    ('b-now',    ['299,000원'],     168.68,  -3.3736, None, '299,000원'),
    ('b-off33',  ['최대 33% 할인'],   53.978, -1.0796, None, '최대 33% 할인'),
    ('b-limited',['기간 한정'],       53.978, -1.0796, None, '기간 한정'),
    # 나는 뭘 좋아할까? (3684:17975) TLAB 110px 자간 -1.1 #2CFF05
    ('b-like',   ['나는 뭘 좋아할까?'], 110.0, -1.1, None, '나는 뭘 좋아할까?'),
    # Monthly Themes (3697:33001) TLAB 90px 자간 -3.6 #2CFF05
    ('b-monthly',['Monthly Themes'], 90.0, -3.6, None, 'Monthly Themes'),

    # 상페2 CLASS FEATURE (3684:348) TLAB 136px 자간 -4.08 흰색
    ('b-feature',['CLASS FEATURE'], 136.0, -4.08, None, 'CLASS FEATURE'),
    # 번호 01·02·03 (3684:352 외) TLAB 121px 자간 +2.42 #2CFF05
    ('b-n01', ['01'], 121.0, 2.42, None, '01'),
    ('b-n02', ['02'], 121.0, 2.42, None, '02'),
    ('b-n03', ['03'], 121.0, 2.42, None, '03'),

    # 커리큘럼 표 — 주차 번호 (3684:401 외) TLAB 85px 자간 0 흰색
    ('b-w1', ['1'], 85.0, 0.0, None, '1'),
    ('b-w2', ['2'], 85.0, 0.0, None, '2'),
    ('b-w3', ['3'], 85.0, 0.0, None, '3'),
    ('b-w4', ['4'], 85.0, 0.0, None, '4'),
    # 회차 (3684:398 외) TLAB 32px 자간 -0.96 흰색
    ('b-e1', ['1강'], 32.0, -0.96, None, '1강'),
    ('b-e2', ['2강'], 32.0, -0.96, None, '2강'),
    ('b-e3', ['3강'], 32.0, -0.96, None, '3강'),
    ('b-e4', ['4강'], 32.0, -0.96, None, '4강'),
    ('b-e5', ['5강'], 32.0, -0.96, None, '5강'),
    ('b-e6', ['6강'], 32.0, -0.96, None, '6강'),
    ('b-e7', ['7강'], 32.0, -0.96, None, '7강'),
    ('b-e8', ['8강'], 32.0, -0.96, None, '8강'),
    # FVA CURRICULUM (3684:410 은 이미 아웃라인 벡터) — 폭 773.48 로 맞춘다
    ('b-curriculum', ['FVA CURRICULUM'], 100.0, -3.0, None, 'FVA CURRICULUM'),
    # 이런 분들에게 추천드려요! (3684:474) TLAB 110px 자간 0 #2CFF05
    ('b-whoh', ['이런 분들에게 추천드려요!'], 110.0, 0.0, None, '이런 분들에게 추천드려요!'),
]

if __name__ == '__main__':
    mp = os.path.join(T.OUT, 'meta.json')
    meta = json.load(open(mp, encoding='utf-8')) if os.path.exists(mp) else {}
    for name, lines, size, track, step, text in SPECS:
        info = make(name, lines, size, track, step, text)
        meta[name] = info
        print(f"{name:<14} {info['text']:<16} {size:>8.2f}px  "
              f"잉크 {info['ink_px'][0]}x{info['ink_px'][1]}px")
    json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n{len(SPECS)}개 생성')
