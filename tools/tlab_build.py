#!/usr/bin/env python3
"""TLAB 믹스커피 제목을 SVG 아웃라인으로 만든다.

각 제목의 자간·행간·가로배율을 '원본 PNG 의 잉크 형태'에서 역산하므로
사람이 값을 넣을 필요가 없다.

  원본 PNG ─┬─ 줄 밴드 검출 → 줄 수 / 줄간격 / 가장 넓은 줄 폭 / 전체 잉크 비율
            └─ 자간은 좁은 범위(±0.05em)에서만 탐색하고
               남는 차이는 가로배율로 맞춘다 (피그마에서 텍스트를 가로로 늘린 경우)
            → fontTools 로 글리프 경로 추출 → 잉크 경계로 트림한 SVG

폰트 파일을 웹에 올리는 게 아니라 정해진 문구를 도형으로 만드는 것이므로
티랩 라이선스의 「웹사이트 웹이미지 적용」 범위다. (폰트 자체는 fsType=4 로 임베딩 금지)

  python3 tools/tlab_build.py          # 전체 생성
  python3 tools/tlab_build.py h-awards # 하나만
"""
import os, json, sys
import numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

FONT = '/Users/gimjeonghwan/Library/Fonts/TlabMixCoffee.otf'
SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT  = os.path.join(SITE, 'assets/tlab')

_f = TTFont(FONT)
UPM = _f['head'].unitsPerEm
_gs = _f.getGlyphSet()
_cmap = _f.getBestCmap()
_hmtx = _f['hmtx']


def _kern_pairs(f):
    pairs = {}
    if 'GPOS' not in f:
        return pairs
    try:
        for lookup in f['GPOS'].table.LookupList.Lookup:
            if lookup.LookupType != 2:
                continue
            for st in lookup.SubTable:
                if st.Format == 1:
                    for i, cov in enumerate(st.Coverage.glyphs):
                        for r in st.PairSet[i].PairValueRecord:
                            v = getattr(r.Value1, 'XAdvance', 0) or 0
                            if v:
                                pairs[(cov, r.SecondGlyph)] = v
                elif st.Format == 2:
                    c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                    for g1 in st.Coverage.glyphs:
                        k1 = c1.get(g1, 0)
                        for g2, k2 in c2.items():
                            v = getattr(st.Class1Record[k1].Class2Record[k2].Value1, 'XAdvance', 0) or 0
                            if v:
                                pairs[(g1, g2)] = v
    except Exception:
        pass
    return pairs
KERN = _kern_pairs(_f)


def lay_line(text, tracking_em):
    """한 줄 배치 -> ([(경로, x, 글리프bbox)], 진행폭)"""
    out, x, prev = [], 0.0, None
    for ch in text:
        gn = _cmap.get(ord(ch))
        if ch == ' ':
            x += (_hmtx[gn][0] if gn else UPM * .25) + tracking_em * UPM
            prev = gn
            continue
        if gn is None:
            x += UPM * .5 + tracking_em * UPM
            prev = None
            continue
        if prev is not None and (prev, gn) in KERN:
            x += KERN[(prev, gn)]
        pen = SVGPathPen(_gs)
        _gs[gn].draw(pen)
        d = pen.getCommands()
        bp = BoundsPen(_gs)
        _gs[gn].draw(bp)
        if d:
            out.append((d, x, bp.bounds))
        x += _hmtx[gn][0] + tracking_em * UPM
        prev = gn
    return out, x


def ink_box(lines, tracking_em, step_units):
    """모든 줄을 합친 잉크 경계 (x0, y0, x1, y1) — 폰트 좌표계, y 는 위가 +"""
    x0 = y0 = 1e9; x1 = y1 = -1e9
    for i, L in enumerate(lines):
        glyphs, _ = lay_line(L, tracking_em)
        dy = -step_units * i
        for _d, gx, b in glyphs:
            if not b:
                continue
            x0 = min(x0, gx + b[0]); x1 = max(x1, gx + b[2])
            y0 = min(y0, b[1] + dy);  y1 = max(y1, b[3] + dy)
    if x0 > x1:
        return (0, 0, UPM, UPM)
    return (x0, y0, x1, y1)


def col_cover(lines, tracking_em, step_units):
    """글리프가 차지하는 x 구간의 합집합 / 전체 잉크폭.
    가로배율에는 영향받지 않으므로 자간만의 함수다 -> 자간을 독립적으로 풀 수 있다."""
    iv = []
    for L in lines:
        glyphs, _ = lay_line(L, tracking_em)
        for _d, gx, b in glyphs:
            if b:
                iv.append((gx + b[0], gx + b[2]))
    if not iv:
        return 1.0
    iv.sort()
    merged = [list(iv[0])]
    for a, b in iv[1:]:
        if a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    covered = sum(b - a for a, b in merged)
    total = merged[-1][1] - merged[0][0]
    return covered / total if total else 1.0


def build(lines, tracking_em, step_units, xscale=1.0, color='currentColor'):
    """잉크 경계로 트림한 SVG. 원본 PNG(잉크 트림)와 같은 기준이 된다."""
    bx0, by0, bx1, by1 = ink_box(lines, tracking_em, step_units)
    vb_w = (bx1 - bx0) * xscale
    vb_h = by1 - by0
    body = []
    for i, L in enumerate(lines):
        glyphs, _ = lay_line(L, tracking_em)
        for d, gx, _b in glyphs:
            body.append(f'<path d="{d}" transform="translate({gx:.1f} {-step_units*i:.1f})"/>')
    # 폰트 좌표(위가 +) -> SVG 좌표(아래가 +) : y 반전 후 잉크 좌상단을 원점으로
    g = (f'<g transform="scale({xscale:.5f} 1) translate({-bx0:.1f} {by1:.1f}) scale(1 -1)" '
         f'fill="{color}">' + ''.join(body) + '</g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}">'
            f'{g}</svg>'), vb_w, vb_h


# ── 원본 PNG 분석 ────────────────────────────────────────────
def png_mask(path):
    """글자 픽셀 마스크. 투명 배경이면 알파, 불투명이면 배경색 대비로 판정."""
    im = Image.open(path)
    rgba = np.asarray(im.convert('RGBA'))
    al = rgba[:, :, 3]
    if al.min() < 255:
        return al > 110
    rgb = rgba[:, :, :3].astype(int)
    # 네 모서리 평균을 배경색으로 보고, 그와의 거리로 판정 (어두운 글자도 잡힌다)
    h, w = rgb.shape[:2]
    corners = np.concatenate([rgb[:3, :3].reshape(-1, 3), rgb[:3, -3:].reshape(-1, 3),
                              rgb[-3:, :3].reshape(-1, 3), rgb[-3:, -3:].reshape(-1, 3)])
    bg = corners.mean(axis=0)
    dist = np.abs(rgb - bg).sum(axis=2)
    return dist > max(30, dist.max() * 0.22)


def png_cover(path):
    """원본 PNG 에서 잉크가 있는 열의 비율"""
    m = png_mask(path)
    ys, xs = np.where(m)
    m = m[ys.min():ys.max()+1, xs.min():xs.max()+1]
    return float((m.sum(axis=0) > 0).mean())


def png_lines(path, expect):
    """(줄 수, 줄간격 px, 가장 넓은 줄 폭 px, 전체 잉크 w, h)"""
    m = png_mask(path)
    ys, xs = np.where(m)
    m = m[ys.min():ys.max()+1, xs.min():xs.max()+1]
    H, W = m.shape
    prof = m.sum(axis=1)
    # expect 개의 밴드가 나오는 가장 낮은 임계값을 찾는다
    bands = []
    for frac in (0.002, 0.004, 0.008, 0.015, 0.03, 0.05, 0.08):
        thr = max(1, W * frac)
        on = prof > thr
        b, s = [], None
        for i in range(H):
            if on[i] and s is None:
                s = i
            elif not on[i] and s is not None:
                if i - s >= 3:
                    b.append((s, i))
                s = None
        if s is not None:
            b.append((s, H))
        if len(b) == expect:
            bands = b
            break
        if len(b) > expect and not bands:
            bands = b
    if not bands:
        bands = [(0, H)]
    while len(bands) > expect:                       # 가까운 밴드끼리 합침
        gaps = [(bands[i+1][0] - bands[i][1], i) for i in range(len(bands)-1)]
        _, i = min(gaps)
        bands[i] = (bands[i][0], bands[i+1][1])
        del bands[i+1]
    # 줄이 맞닿아 빈 행이 없으면 '잉크가 가장 적은 행'(골짜기)에서 자른다
    while len(bands) < expect:
        wi = max(range(len(bands)), key=lambda i: bands[i][1] - bands[i][0])
        a, b = bands[wi]
        if b - a < 12:
            break
        lo, hi = a + int((b - a) * .18), b - int((b - a) * .18)
        cut = lo + int(np.argmin(prof[lo:hi]))
        bands[wi:wi+1] = [(a, cut), (cut, b)]
    step = float(np.mean([bands[i+1][0] - bands[i][0] for i in range(len(bands)-1)])) if len(bands) > 1 else 0.0
    widest = 0
    for a, b in bands:
        cols = m[a:b].sum(axis=0)
        cx = np.where(cols > 0)[0]
        if len(cx):
            widest = max(widest, cx.max() - cx.min() + 1)
    return len(bands), step, widest, W, H


def solve(lines, png):
    """자간(좁은 범위) + 줄간격 + 가로배율을 원본에서 역산"""
    n = len(lines)
    _nb, step_px, widest_px, W, H = png_lines(png, n)

    # 줄간격: 원본의 (줄간격 / 전체 잉크높이) 비율을 그대로 옮긴다
    step_units = 0.0
    if n > 1 and step_px:
        for _ in range(30):
            _, _, _, _ = 0, 0, 0, 0
            bx0, by0, bx1, by1 = ink_box(lines, 0.0, step_units)
            cur_h = by1 - by0
            want = step_px / H * cur_h
            if abs(want - step_units) < 0.5:
                break
            step_units = want

    target_ratio = W / H                              # 원본 잉크 종횡비

    def ratio(tr, xs=1.0):
        bx0, by0, bx1, by1 = ink_box(lines, tr, step_units)
        return ((bx1 - bx0) * xs) / (by1 - by0)

    # 자간(±0.05em)으로 원본 종횡비를 맞춘다
    lo, hi = -0.05, 0.05
    for _ in range(44):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if ratio(mid) < target_ratio else (lo, mid)
    tr = (lo + hi) / 2
    xs = target_ratio / ratio(tr)
    # 가로배율이 1 에서 5% 이상 벗어나면 = 이 문구는 믹스커피가 아닌 다른 서체다.
    # (설치된 TLAB 은 믹스커피 하나뿐이라 로컬 폰트로 재현 불가)
    # 그런 항목은 ok=False 로 표시하고 PNG 를 그대로 쓴다.
    ok = abs(xs - 1.0) <= 0.05
    # 밀도 참고값 (진단용)
    dens = round(col_cover(lines, tr, step_units), 4), round(png_cover(png), 4)
    return round(tr, 5), round(step_units, 1), round(xs, 5), (W, H), ok, dens


# 피그마 get_design_context 로 확인한 실제 값 (역산보다 이게 정확하다)
#   tracking_em, 줄간격(폰트단위, 1줄이면 0)
FIGMA = {
 'h-class-feature': (-3.0363/303.628, 0.0),   # TlabMixCoffee 303.628px, 자간 -3.0363px, 흰색 1줄
}

SPECS = [
 ('h-awards',        ['수상한 아카데미가 있다?'],                        'assets/img/h-awards.png'),
 ('h-expertise',     ['THE EXPERTISE OF A VISIONARY', 'DIRECTOR'],    'assets/img/h-expertise.png'),
 ('h-fva-seoul',     ['FILM VISUAL ART ACADEMY,', 'THE CINEMA ACADEMY IN', 'SEOUL, MAPO-GU'],
                                                                      'assets/img/h-fva-seoul.png'),
 ('h-features',      ['FVA에서만 경험하세요'],                           'assets/img/h-features.png'),
 ('h-reviews',       ['수강생들의 진짜 후기'],                            'assets/img/h-reviews.png'),
 ('h-faq',           ['자주 묻는 질문'],                                 'assets/img/h-faq.png'),
 ('h-newseason',     ['NEW SEASON OPEN'],                              'assets/img/h-newseason.png'),
 ('h-offline',       ['오프라인 강의'],                                  'assets/img/h-offline.png'),
 ('h-secret-club',   ['SECRET CLUB FOR'],                              'assets/img/offline/h-secret-club.png'),
 ('h-filmmakers',    ['FILMMAKERS'],                                   'assets/img/offline/h-filmmakers.png'),
 ('h-class-feature', ['CLASS FEATURE'],                                'assets/img/offline/b2-class-feature.png'),
 ('h-num01',         ['01'],                                           'assets/img/offline/b2-num01.png'),
 ('h-num02',         ['02'],                                           'assets/img/offline/b2-num02.png'),
 ('h-num03',         ['03'],                                           'assets/img/offline/b2-num03.png'),
 ('t-w1', ['2024 BCU 콘텐츠리그 대상 수상'],              'assets/works/title-w1-joyfools.png'),
 ('t-w2', ['생맥주 프랜차이즈 광고 영상 공모전 대상 수상'],   'assets/works/title-w2-kimboknam.png'),
 ('t-w3', ['제 11회 신한 29초영화제 최우수상 수상'],          'assets/works/title-w3-shinhan.png'),
 ('t-w4', ['김밥 프랜차이즈 숏폼 영상 공모전 대상 수상'],     'assets/works/title-w4-yamsem.png'),
 ('t-recommend',  ['이런 분들에게 추천드려요!'], 'assets/img/offline/_ref-recommend.png'),
 ('t-benefit',    ['FVA만의 특별한 혜택'],       'assets/img/offline/_ref-benefit.png'),
]

if __name__ == '__main__':
    only = sys.argv[1:] or None
    os.makedirs(OUT, exist_ok=True)
    mp = os.path.join(OUT, 'meta.json')
    meta = json.load(open(mp)) if os.path.exists(mp) else {}
    print(f'{"이름":<20}{"자간":>9}{"줄간격":>9}{"가로배율":>9}  {"viewBox":>18} {"용량":>8}')
    for name, lines, png in SPECS:
        if only and name not in only:
            continue
        p = os.path.join(SITE, png)
        if not os.path.exists(p):
            print(f'{name:<20} 원본 없음: {png}')
            continue
        if name in FIGMA:
            tr, step = FIGMA[name]
            xs, ok, dens = 1.0, True, ('figma', 'figma')
            W, H = png_lines(p, len(lines))[3:5]
        else:
            tr, step, xs, (W, H), ok, dens = solve(lines, p)
        svg, vw, vh = build(lines, tr, step, xs)
        fp = os.path.join(OUT, name + '.svg')
        open(fp, 'w', encoding='utf-8').write(svg)
        meta[name] = {'text': ' '.join(lines), 'lines': lines, 'tracking': tr, 'step': step,
                      'xscale': xs, 'viewBox': [round(vw, 1), round(vh, 1)],
                      'pngInk': [W, H], 'bytes': os.path.getsize(fp), 'ok': ok,
                      'density': dens, 'png': png}
        mark = '' if ok else '   << 다른 서체 — PNG 유지'
        print(f'{name:<20}{tr:+9.4f}{step:9.1f}{xs:9.4f}  {vw:8.1f}x{vh:-8.1f} {os.path.getsize(fp):7d}B{mark}')
    json.dump(meta, open(mp, 'w'), indent=1, ensure_ascii=False)
    print('\nassets/tlab/meta.json 저장')
