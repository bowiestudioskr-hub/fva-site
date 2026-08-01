#!/usr/bin/env python3
"""「현업 감독의 영상 분석」 릴스 목록을 유튜브 채널에서 새로 만든다.

  python3 tools/yt_reels.py            # assets/data/reels.json 갱신
  python3 tools/yt_reels.py --check    # 바뀔 내용만 보여주고 파일은 안 건드림

동작
  1. 채널 RSS 를 읽는다. API 키가 필요 없고 최신 15개를 준다.
       https://www.youtube.com/feeds/videos.xml?channel_id=<채널ID>
  2. RSS 는 쇼츠와 일반 영상을 구분해주지 않는다.
     대신 썸네일로 가른다 — `oardefault.jpg` 는 세로 영상만 200 을 주고
     가로 영상은 404 다. (이 사이트 작업 중 확인한 규칙)
  3. 손으로 정한 목록(tools/reels_curated.json)이 항상 앞에 오고,
     거기 없는 새 쇼츠를 뒤에 붙인다. 최대 MAX 개.

제목 정리
  RSS 제목에는 해시태그가 붙는다 — "셔터스피드 어떻게 설정하시나요? #영상학원 #피바아카데미"
  첫 '#' 앞에서 자른다.
"""
import html as _html
import json, os, re, sys, urllib.request, urllib.error

CHANNEL = "UCDBwtcf2azG4ghIBqXPnymQ"          # FVA ACADEMY
FEED    = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL}"
ROOT    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CURATED = os.path.join(ROOT, "tools", "reels_curated.json")
OUT     = os.path.join(ROOT, "assets", "data", "reels.json")
LOCAL   = os.path.join(ROOT, "assets", "works", "reels")     # 미리 받아둔 썸네일
MAX     = 8                                                  # 시안과 같은 4열 x 2줄
UA      = {"User-Agent": "Mozilla/5.0 (compatible; FVA-site/1.0)"}


def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def is_vertical(vid):
    """세로(쇼츠)인지. oardefault.jpg 가 있으면 세로다."""
    req = urllib.request.Request(
        f"https://i.ytimg.com/vi/{vid}/oardefault.jpg", headers=UA, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except urllib.error.HTTPError:
        return False
    except Exception:
        return False          # 못 물어봤으면 넣지 않는다 — 가로가 섞이는 쪽이 더 나쁘다


def clean(title):
    t = _html.unescape(title).split("#", 1)[0]   # RSS 는 & 를 &amp; 로 준다
    t = re.sub(r"\s+", " ", t).strip(" ·-—|")
    return t


def thumb(vid):
    """로컬에 받아둔 게 있으면 그걸 쓰고, 없으면 유튜브에서 바로 가져온다."""
    p = os.path.join(LOCAL, vid + ".jpg")
    if os.path.exists(p):
        return f"assets/works/reels/{vid}.jpg"
    return f"https://i.ytimg.com/vi/{vid}/oardefault.jpg"


def main():
    check = "--check" in sys.argv
    cur = json.load(open(CURATED, encoding="utf-8"))["items"]
    items, seen = [], set()
    for it in cur:
        items.append({"id": it["id"], "title": it["title"],
                      "tag": it.get("tag", ""), "thumb": thumb(it["id"]),
                      "curated": True})
        seen.add(it["id"])

    added = []
    try:
        xml = get(FEED).decode("utf-8", "ignore")
    except Exception as e:
        print(f"RSS 를 못 읽었다 ({e}). 손으로 정한 {len(items)}개만 쓴다.")
        xml = ""

    ids = re.findall(r"<yt:videoId>(.*?)</yt:videoId>", xml)
    titles = re.findall(r"<media:title>(.*?)</media:title>", xml)
    for vid, raw in zip(ids, titles):
        if len(items) >= MAX:
            break
        if vid in seen:
            continue
        if not is_vertical(vid):
            continue
        t = clean(raw)
        if not t:
            continue
        rec = {"id": vid, "title": t, "tag": "", "thumb": thumb(vid), "curated": False}
        items.append(rec); seen.add(vid); added.append(rec)

    payload = {"_생성": "tools/yt_reels.py — 직접 고치지 말 것", "items": items}
    old = None
    if os.path.exists(OUT):
        try: old = json.load(open(OUT, encoding="utf-8"))
        except Exception: pass

    same = old is not None and old.get("items") == items
    print(f"손으로 정한 {len(cur)}개 + 새 쇼츠 {len(added)}개 = {len(items)}개")
    for r in added:
        print(f"  + {r['id']}  {r['title'][:44]}")
    if same:
        print("바뀐 것 없음")
        return 0
    if check:
        print("(--check 라 파일은 그대로 둔다)")
        return 0
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(payload, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{os.path.relpath(OUT, ROOT)} 갱신")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
