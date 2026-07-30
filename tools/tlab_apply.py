#!/usr/bin/env python3
"""TLAB 제목 <img> 를 '진짜 텍스트 + 인라인 SVG' 로 바꾼다.

  <h2 class="display">
    <span class="sr-only">수상한 아카데미가 있다?</span>   ← 검색엔진·스크린리더가 읽는 텍스트
    <svg class="tlab" viewBox="…" aria-hidden="true">…</svg>  ← 화면에 보이는 TLAB 글자
  </h2>

viewBox 종횡비가 원본 PNG 잉크와 같으므로 CSS 폭을 그대로 두면 레이아웃이 바뀌지 않는다.
meta.json 의 ok=False 인 항목(믹스커피가 아닌 다른 서체)은 건드리지 않는다.
"""
import json, os, re, sys

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
META = json.load(open(os.path.join(SITE, 'assets/tlab/meta.json'), encoding='utf-8'))

# 파일명(png) -> meta 키
BY_PNG = {os.path.basename(v['png']): k for k, v in META.items() if 'png' in v}

PAGES = [f for f in os.listdir(SITE) if f.endswith('.html') and not f.startswith('_')]

IMG_RE = re.compile(r'<img\b[^>]*?>', re.S)


def attrs(tag):
    return dict(re.findall(r'(\w[\w-]*)\s*=\s*"([^"]*)"', tag))


def replace_in(html, page):
    out, changed = [], []
    pos = 0
    for m in IMG_RE.finditer(html):
        tag = m.group(0)
        a = attrs(tag)
        src = a.get('src', '')
        key = BY_PNG.get(os.path.basename(src))
        if not key or not META[key].get('ok'):
            continue
        info = META[key]
        svg = open(os.path.join(SITE, 'assets/tlab', key + '.svg'), encoding='utf-8').read()
        # 인라인용으로 정리: width/height 속성 제거, class/aria 부여
        svg = svg.replace('<svg xmlns="http://www.w3.org/2000/svg" ',
                          '<svg class="tlab" aria-hidden="true" focusable="false" ')
        cls = a.get('class', '')
        if cls:
            svg = svg.replace('class="tlab"', f'class="tlab {cls}"')
        text = info['text']
        rep = f'<span class="sr-only">{text}</span>{svg}'
        out.append(html[pos:m.start()]); out.append(rep)
        pos = m.end()
        changed.append(key)
    out.append(html[pos:])
    return ''.join(out), changed


if __name__ == '__main__':
    total = []
    for page in sorted(PAGES):
        p = os.path.join(SITE, page)
        html = open(p, encoding='utf-8').read()
        new, ch = replace_in(html, page)
        if ch:
            open(p, 'w', encoding='utf-8').write(new)
            print(f'{page:<20} {len(ch)}개 교체: {", ".join(ch)}')
            total += ch
    print(f'\n총 {len(total)}개 교체')
    skipped = [k for k, v in META.items() if not v.get('ok')]
    if skipped:
        print('PNG 유지(다른 서체):', ', '.join(skipped))
