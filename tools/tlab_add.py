#!/usr/bin/env python3
"""피그마에서 글자 크기·자간을 이미 알고 있는 TLAB 텍스트를 SVG 아웃라인으로 만든다.

tlab_build.py 는 원본 PNG 를 역산해 자간을 추정했다. 그 방식은 참조 PNG 가
있어야 하고 서체가 다르면 실패한다. get_design_context 가 글자 크기·자간·색을
정확히 주므로, 이제는 역산 없이 바로 만든다.

  python3 tools/tlab_add.py

각 항목의 잉크 폭(px, 1920 기준)을 같이 찍어준다. 그 값을 CSS 에
  width:calc(var(--u) * <잉크폭>/1920)
로 넣으면 피그마와 같은 크기로 그려진다.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlab_build as T

UPEM = 1000.0

# 이름, 줄 목록, 글자크기(px), 자간(px), 줄간격(px), 검색용 텍스트
SPECS = [
    # 오프라인 블록 4 — "특강" (3402:164043) TLAB 227.721px 자간 0 #08FFD0
    ('t-special', ['특강'], 227.721, 0.0, None, '특강'),

    # 메인 통계 (3398:375) — 숫자 TLAB 144px 자간 -4.32 흰색 /
    #                        라벨 TLAB 48px 자간 -1.44 #2CFF05
    ('t-stat-8',      ['8'],          144.0, -4.32, None, '8'),
    ('t-stat-2',      ['2'],          144.0, -4.32, None, '2'),
    ('t-stat-300',    ['300+'],       144.0, -4.32, None, '300+'),
    ('t-trophies',    ['TROPHIES'],    48.0, -1.44, None, 'TROPHIES'),
    ('t-years',       ['YEARS'],       48.0, -1.44, None, 'YEARS'),
    ('t-graduates',   ['GRADUATES'],   48.0, -1.44, None, 'GRADUATES'),

    # 메인 후기 평점 (모바일 27.602px x 데스크탑/모바일 배율 3.4136 = 94.2)
    ('t-rating',      ['4.99'],        94.2,  0.0,  None, '4.99'),
]


def make(name, lines, size, track_px, step_px, text):
    tracking_em = track_px / size
    step_units = (step_px / size * UPEM) if step_px else 0.0
    svg, vb_w, vb_h = T.build(lines, tracking_em, step_units)
    ink_w = vb_w / UPEM * size
    ink_h = vb_h / UPEM * size
    path = os.path.join(T.OUT, name + '.svg')
    open(path, 'w', encoding='utf-8').write(svg)
    return dict(text=text, ok=True, size=size, tracking_px=track_px,
                vb=[round(vb_w, 1), round(vb_h, 1)],
                ink_px=[round(ink_w, 2), round(ink_h, 2)])


if __name__ == '__main__':
    mp = os.path.join(T.OUT, 'meta.json')
    meta = json.load(open(mp, encoding='utf-8')) if os.path.exists(mp) else {}
    for name, lines, size, track, step, text in SPECS:
        info = make(name, lines, size, track, step, text)
        meta[name] = info
        print(f"{name:<14} {info['text']:<10} {size:>8.3f}px  "
              f"viewBox {info['vb'][0]}x{info['vb'][1]}  "
              f"잉크 {info['ink_px'][0]}x{info['ink_px'][1]}px")
    json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n{len(SPECS)}개 생성 · meta.json 갱신')
