#!/usr/bin/env python3
"""이미지 주소 뒤에 ?v=<파일해시> 를 붙인다.

  ⚠ 왜 필요한가
    사진을 새 파일로 갈아끼워도 파일 이름이 같으면 브라우저와 클라우드플레어가
    예전 것을 계속 내준다(최대 4시간). 실제로 어두운 막을 씌운 사진이 밝게 보이는
    사고가 났다. 내용이 바뀌면 주소도 바뀌게 해서 원천 차단한다.

  손조판 페이지에서만 쓴다. 여러 번 돌려도 안전하다(기존 ?v= 는 지우고 다시 붙인다).
  python3 tools/bust.py [파일...]
"""
import hashlib, io, os, re, sys

SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
기본 = ['basic.html', 'offline.html']
주소 = re.compile(r'(?<=["\'(])(assets/img/[^"\'()?\s]+\.(?:webp|png|jpg|jpeg|svg))(\?v=[0-9a-f]+)?')


def 해시(경로):
    with open(경로, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def 처리(파일):
    p = os.path.join(SITE, 파일)
    s = io.open(p, encoding='utf-8').read()
    없음, 바뀜 = [], [0]

    def 바꾸기(m):
        rel = m.group(1)
        full = os.path.join(SITE, rel)
        if not os.path.exists(full):
            없음.append(rel); return m.group(0)
        바뀜[0] += 1
        return f'{rel}?v={해시(full)}'

    s2 = 주소.sub(바꾸기, s)
    if s2 != s:
        io.open(p, 'w', encoding='utf-8').write(s2)
    print(f'{파일:<16}{바뀜[0]}개 주소 갱신' + (f'  ⚠ 없는 파일 {없음}' if 없음 else ''))


if __name__ == '__main__':
    for f in (sys.argv[1:] or 기본):
        처리(f)


# css 도 내용 해시로 버스팅한다 (수동 ?v= 가 안 바뀌어 크롬이 캐시를 문다)
def css버스트():
    for 페이지 in ('basic.html', 'offline.html', 'index.html', 'online.html', 'curriculum.html'):
        try: h = open(os.path.join(SITE, 페이지), encoding='utf-8').read()
        except FileNotFoundError: continue
        바뀜 = False
        for css in re.findall(r'href="(css/[^"?]+\.css)[^"]*"', h):
            try: 해시 = hashlib.md5(open(os.path.join(SITE, css), 'rb').read()).hexdigest()[:8]
            except FileNotFoundError: continue
            새 = f'href="{css}?v={해시}"'
            h2 = re.sub(r'href="' + re.escape(css) + r'[^"]*"', 새, h)
            if h2 != h: h, 바뀜 = h2, True
        if 바뀜:
            open(os.path.join(SITE, 페이지), 'w', encoding='utf-8').write(h)
            print(페이지, 'css 버전 갱신')
css버스트()
