#!/usr/bin/env python3
"""TLAB 믹스커피 글자를 SVG 아웃라인(path)으로 변환한다.

폰트 파일을 웹에 올리는 게 아니라, 정해진 제목 문구를 '그림'으로 만드는 것이므로
티랩 라이선스의 「웹사이트 웹이미지 적용」 범위 안에 있다. PNG 대신 SVG 라서
- 어느 배율에서도 선명 (레티나/확대 대응)
- 파일 크기가 훨씬 작다
- fill="currentColor" 로 CSS 에서 색을 바꿀 수 있다
"""
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

FONT = '/Users/gimjeonghwan/Library/Fonts/TlabMixCoffee.otf'
_f = TTFont(FONT)
_upm = _f['head'].unitsPerEm
_gs = _f.getGlyphSet()
_cmap = _f.getBestCmap()
_hmtx = _f['hmtx']

# GPOS 커닝 쌍 추출 (있으면 적용)
def _kern_pairs(f):
    pairs = {}
    if 'GPOS' not in f: return pairs
    try:
        for lookup in f['GPOS'].table.LookupList.Lookup:
            if lookup.LookupType != 2: continue
            for st in lookup.SubTable:
                if st.Format == 1:
                    for i, cov in enumerate(st.Coverage.glyphs):
                        ps = st.PairSet[i]
                        for r in ps.PairValueRecord:
                            v = getattr(r.Value1, 'XAdvance', 0) or 0
                            if v: pairs[(cov, r.SecondGlyph)] = v
                elif st.Format == 2:
                    c1 = st.ClassDef1.classDefs; c2 = st.ClassDef2.classDefs
                    for g1 in st.Coverage.glyphs:
                        k1 = c1.get(g1, 0)
                        for g2, k2 in c2.items():
                            rec = st.Class1Record[k1].Class2Record[k2]
                            v = getattr(rec.Value1, 'XAdvance', 0) or 0
                            if v: pairs[(g1, g2)] = v
    except Exception:
        pass
    return pairs
_KERN = _kern_pairs(_f)


def line_paths(text, tracking_em=0.0):
    """한 줄의 글리프 경로와 총 진행폭(em 단위)을 돌려준다."""
    out, x = [], 0.0
    prev = None
    for ch in text:
        if ch == ' ':
            gn = _cmap.get(32)
            x += (_hmtx[gn][0] if gn else _upm * 0.25) + tracking_em * _upm
            prev = gn
            continue
        cp = ord(ch)
        gn = _cmap.get(cp)
        if gn is None:
            x += _upm * 0.5 + tracking_em * _upm
            prev = None
            continue
        if prev is not None and (prev, gn) in _KERN:
            x += _KERN[(prev, gn)]
        pen = SVGPathPen(_gs)
        _gs[gn].draw(pen)
        d = pen.getCommands()
        if d: out.append((d, x))
        x += _hmtx[gn][0] + tracking_em * _upm
        prev = gn
    return out, x


def make_svg(lines, tracking_em=-0.03, line_height_em=1.0, target_w=None, color='currentColor'):
    """여러 줄 -> 하나의 SVG 문자열. target_w 를 주면 그 폭에 맞춘 viewBox 를 만든다."""
    laid = [line_paths(L, tracking_em) for L in lines]
    widest = max(w for _, w in laid) or 1
    step = line_height_em * _upm

    # 실제 잉크 경계 (상하 여백 제거용)
    ymin, ymax = 1e9, -1e9
    for i, L in enumerate(lines):
        for ch in L:
            gn = _cmap.get(ord(ch))
            if not gn: continue
            bp = BoundsPen(_gs)
            _gs[gn].draw(bp)
            if bp.bounds:
                ymin = min(ymin, bp.bounds[1] - i * step)
                ymax = max(ymax, bp.bounds[3] - i * step)
    if ymin > ymax: ymin, ymax = 0, _upm

    body = []
    for i, (paths, _) in enumerate(laid):
        for d, x in paths:
            body.append(f'<path d="{d}" transform="translate({x:.1f} {-i*step:.1f})"/>')

    vb_w, vb_h = widest, (ymax - ymin)
    # y 축 뒤집기: 폰트 좌표는 위로 +, SVG 는 아래로 +
    inner = f'<g transform="translate(0 {ymax:.1f}) scale(1 -1)" fill="{color}">' + ''.join(body) + '</g>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.1f} {vb_h:.1f}" '
           f'width="{vb_w:.1f}" height="{vb_h:.1f}" role="img">{inner}</svg>')
    return svg, vb_w, vb_h


if __name__ == '__main__':
    spec = json.loads(sys.argv[1])
    svg, w, h = make_svg(spec['lines'],
                         spec.get('tracking', -0.03),
                         spec.get('lineHeight', 1.0),
                         color=spec.get('color', 'currentColor'))
    open(spec['out'], 'w', encoding='utf-8').write(svg)
    print(f"{spec['out']}  viewBox {w:.1f}x{h:.1f}  {len(svg)}B")
