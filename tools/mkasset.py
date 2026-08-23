#!/usr/bin/env python3
"""피그마 노드 내보내기 → 사이트용 webp.

  ⚠ 함정 두 가지
   1) 노드만 따로 내보내면 그 위에 덮인 **어두운 막**이 안 딸려온다.
      화면에서는 어두운데 파일은 밝다. 그래서 프레임 1:1 합성본과 대조해
      **가로줄마다** 막의 진하기를 구해 다시 씌운다.
      글자가 얹힌 줄은 글자 픽셀이 밝아서 평균을 망친다 → 25퍼센타일을 쓴다.
   2) 판 밖으로 넘친 노드는 내보낼 때 이미 잘려 나온다. w 는 잘린 폭을 쓴다.

  python3 tools/mkasset.py 원본.png 저장이름 프레임렌더.png x y w h [--alpha] [--scale 3] [--q 84]
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
밖 = os.path.join(SITE, 'assets/img/basic')


def 검정합성(im):
    바탕 = Image.new('RGBA', im.size, (0, 0, 0, 255))
    return Image.alpha_composite(바탕, im).convert('RGB')


def 딤지도(밝, 피그마):
    """가로줄마다 (피그마/밝은원본) 비를 구한다. 글자 줄은 25퍼센타일로 피한다."""
    a = np.asarray(밝, dtype=float).mean(axis=2) + 1e-3
    b = np.asarray(피그마, dtype=float).mean(axis=2)
    # ⚠ 어두운 픽셀은 나누면 값이 튄다. 충분히 밝은 픽셀만 쓰고 중앙값을 쓴다.
    #    (글자는 밝은 쪽으로 튀지만 한 줄에서 소수라 중앙값이 안 흔들린다)
    쓸만 = a > 60
    비 = np.ones(a.shape[0])
    앞 = 1.0
    for y in range(a.shape[0]):
        m = 쓸만[y]
        if m.sum() < 30:
            비[y] = 앞
            continue
        비[y] = 앞 = float(np.median(b[y][m] / a[y][m]))
    비 = np.clip(비, 0.05, 1.0)
    # 세로로 살짝 문질러 계단 없앰
    k = 9
    pad = np.pad(비, (k, k), mode='edge')
    비 = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode='same')[k:-k]
    return 비


def 만들기(원본, 이름, 프레임=None, x=0, y=0, w=None, h=None,
          알파=False, 배율=3, q=84):
    im = Image.open(원본).convert('RGBA')
    밝 = 검정합성(im)
    if w is None: w, h = im.size
    if 프레임:
        피 = Image.open(프레임).convert('RGB').crop((x, y, x + w, y + h))
        작 = 밝.resize((w, h), Image.LANCZOS)
        비 = 딤지도(작, 피)
        if 비.mean() < 0.985:
            큰비 = np.interp(np.linspace(0, h - 1, im.height), np.arange(h), 비)
            arr = np.asarray(im, dtype=float)
            arr[:, :, :3] *= 큰비[:, None, None]
            im = Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')
            밝 = 검정합성(im)
            print(f'   막 씌움 (평균 {비.mean():.2f}, 위 {비[:20].mean():.2f} → 아래 {비[-20:].mean():.2f})')
    끝 = (round(w * 배율), round(h * 배율))
    if 알파:
        im.resize(끝, Image.LANCZOS).save(os.path.join(밖, 이름 + '.webp'), 'WEBP', quality=q + 4, method=6)
    else:
        밝.resize(끝, Image.LANCZOS).save(os.path.join(밖, 이름 + '.webp'), 'WEBP', quality=q, method=6)
    크기 = os.path.getsize(os.path.join(밖, 이름 + '.webp'))
    print(f'{이름:<18}{끝[0]}x{끝[1]}  {크기 // 1024}KB')


if __name__ == '__main__':
    a = sys.argv[1:]
    옵 = {'알파': '--alpha' in a, '배율': 3, 'q': 84}
    if '--scale' in a: 옵['배율'] = float(a[a.index('--scale') + 1])
    if '--q' in a: 옵['q'] = int(a[a.index('--q') + 1])
    위치 = [t for t in a if not t.startswith('--')]
    # 원본 이름 [프레임 x y w h]
    원본, 이름 = 위치[0], 위치[1]
    if len(위치) >= 7:
        만들기(원본, 이름, 위치[2], *[int(float(v)) for v in 위치[3:7]], **옵)
    else:
        만들기(원본, 이름, **옵)
