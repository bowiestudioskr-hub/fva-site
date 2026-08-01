/* 후기 카드 한 장을 만드는 틀 — 브라우저와 빌드 스크립트가 같이 쓴다.
   두 곳에 같은 템플릿을 복사해 두면 언젠가 반드시 어긋나므로 여기 한 곳에만 둔다.

   브라우저:  <script src="js/review-card.js">  →  window.FVAReviewCard
   빌드:      require('../js/review-card.js')   →  같은 객체
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FVAReviewCard = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  /* 사진 없는 후기 자리에 들어가는 캐릭터. 원본 PNG 는 장당 5~6MB 라 800px WebP 로 줄였다. */
  var CHARS = ['assets/img/reviews/char1.webp', 'assets/img/reviews/char2.webp',
               'assets/img/reviews/char3.webp', 'assets/img/reviews/char4.webp'];

  var PRODUCT_URL = 'https://smartstore.naver.com/bowiestudios/products/12653524153';

  function stars(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += i < n ? '★' : '<span style="color:#2a2a2a">★</span>';
    return s;
  }

  /* 네이버에서 긁어온 본문에는 HTML 엔티티가 섞여 있다.
     여기서 실제 글자로 되돌리고 줄바꿈만 <br> 로 바꾼다.
     ⚠ 결과는 innerHTML / 정적 HTML 양쪽에 그대로 들어가므로 두 경로의 DOM 이 같다. */
  function clean(s) {
    return (s || '')
      .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’')
      .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
      .replace(/&hellip;/g, '…').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\n/g, '<br>');
  }

  function isNew(date) {
    var d = date || '';
    return d.slice(0, 7) === '2026-07' || d.slice(0, 7) === '2026.07';
  }

  function card(r, i) {
    var delay = Math.min(i * 35, 500);
    var imgHtml;
    if (r.photo) {
      imgHtml = '<div class="c-img">'
        + '<img src="' + r.photo + '" alt="' + r.reviewer + '님 후기 사진" loading="lazy">'
        + '<div class="c-img-over"></div>'
        + '<div class="zoom">⊕</div>'
        + '</div>';
    } else {
      imgHtml = '<div class="c-img-char">'
        + '<img src="' + CHARS[i % CHARS.length] + '" alt="" loading="lazy">'
        + '</div>';
    }
    return '<div class="card" style="animation-delay:' + delay + 'ms" onclick="openPopup(' + i + ')">'
      + imgHtml
      + '<div class="c-body">'
      + '<div class="c-top">'
      + '<div class="stars">' + stars(r.rating) + '</div>'
      + '<div class="tag">' + r.type + '</div>'
      + '</div>'
      + '<div class="rev-row">'
      + '<span class="rev-name">' + r.reviewer + (isNew(r.date) ? '<span class="new-badge">NEW</span>' : '') + '</span>'
      + '<span class="rev-date">' + r.date + '</span>'
      + '</div>'
      + '<div class="sep"></div>'
      + '<div class="rev-text clamp" id="ct' + i + '">' + clean(r.content) + '</div>'
      + '<button class="more-btn" data-idx="' + i + '" style="display:none">More +</button>'
      + '</div>'
      + '<a class="c-product" href="' + PRODUCT_URL + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">'
      + '<div class="c-product-icon"><img src="assets/img/fva_product_thumb.jpg" alt=""></div>'
      + '<div class="c-product-info">'
      + '<span class="c-product-name">' + (r.product || 'FVA 피바아카데미') + '</span>'
      + '<span class="c-product-stars">★★★★★</span>'
      + '</div>'
      + '<span class="c-product-arrow">→</span>'
      + '</a>'
      + '</div>';
  }

  function list(reviews) {
    var html = '';
    for (var i = 0; i < reviews.length; i++) html += card(reviews[i], i);
    return html;
  }

  return { CHARS: CHARS, stars: stars, clean: clean, card: card, list: list };
});
