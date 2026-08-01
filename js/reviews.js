/* 후기 카드 렌더 + 라이트박스 — reviewpage/index.html 에서 가져왔다.
   데이터는 reviews.html 이 미리 넣어둔 #review-data(=window.__RV_DATA_EL__)에서 읽는다.

   카드 HTML 은 js/review-card.js 한 곳에서 만든다. 빌드(tools/build_reviews.js)가
   같은 틀로 #grid 를 미리 그려 두므로, 처음 뜰 때는 다시 그리지 않고 그대로 쓴다.
   (검색엔진이 후기 본문을 읽으려면 HTML 에 글이 들어 있어야 한다.) */

(function() {
  var REVIEWS = JSON.parse(window.__RV_DATA_EL__.textContent);
  var RC = window.FVAReviewCard;
  var cur = 'all';

  var stars = RC.stars;
  var clean = RC.clean;

  function getList() {
    if (cur === 'all') return REVIEWS;
    if (cur === 'photo') return REVIEWS.filter(function(r){ return r.photo; });
    return REVIEWS.filter(function(r){ return r.type === cur; });
  }

  function render() {
    document.getElementById('grid').innerHTML = RC.list(getList());
    wire();
  }

  /* 더보기 버튼은 글이 잘렸을 때만 나온다 — 미리 그려둔 HTML 에도 똑같이 걸어야 한다 */
  function wire() {
    document.querySelectorAll('.rev-text.clamp').forEach(function(el) {
      var btn = el.nextElementSibling;
      if (!btn || !btn.classList.contains('more-btn')) return;
      btn.style.display = el.scrollHeight > el.clientHeight + 2 ? '' : 'none';
    });

    document.querySelectorAll('.more-btn').forEach(function(btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openPopup(parseInt(this.dataset.idx, 10));
      });
    });
  }

  function fixScrollHeight() {
    var inner = document.getElementById('lbInner');
    var scroll = document.getElementById('lbScroll');
    scroll.style.maxHeight = '';
    var lbPad = window.innerWidth <= 600 ? 72 : 96;
    var availH = window.innerHeight - lbPad;
    var innerH = inner.scrollHeight;
    if (innerH > availH) {
      var scrollH = scroll.scrollHeight;
      var fixedH = innerH - scrollH;
      var maxScrollH = availH - fixedH;
      if (maxScrollH > 20) scroll.style.maxHeight = maxScrollH + 'px';
    }
  }

  window.openPopup = function(idx) {
    var list = getList();
    var r = list[idx];
    var inner = document.getElementById('lbInner');
    var imgWrap = document.getElementById('lbImgWrap');
    if (r.photo) {
      document.getElementById('lbImg').src = r.photo;
      inner.classList.remove('no-photo');
      imgWrap.style.display = '';
    } else {
      inner.classList.add('no-photo');
      imgWrap.style.display = 'none';
    }
    document.getElementById('lbStars').innerHTML = stars(r.rating);
    document.getElementById('lbName').textContent = r.reviewer;
    document.getElementById('lbDate').textContent = r.date;
    document.getElementById('lbText').innerHTML = clean(r.content);
    document.getElementById('lbScroll').scrollTop = 0;
    document.getElementById('lb').classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        fixScrollHeight();
        var cue = document.getElementById('lbScrollCue');
        if (document.getElementById('lbScroll').scrollHeight > document.getElementById('lbScroll').clientHeight) {
          cue.classList.add('show');
          requestAnimationFrame(function() { cue.classList.remove('show'); });
        }
      });
    });
  };
  window.closeLb = function() {
    document.getElementById('lb').classList.remove('open');
    document.body.style.overflow = '';
  };
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLb(); });

  /* 빌드가 미리 그려 둔 카드가 있으면 지우고 다시 그리지 않는다.
     필터를 누르면 그때 render() 가 같은 틀로 다시 그린다. */
  if (document.getElementById('grid').children.length) wire();
  else render();
})();
