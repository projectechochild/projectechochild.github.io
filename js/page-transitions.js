(function () {
  'use strict';

  const EXCLUDED_PATTERNS = ['#', 'mailto:', 'tel:', 'javascript:', 'http://', 'https://'];
  const FADE_DURATION = 500;
  let isNavigating = false;

  function isInternalLink(href) {
    if (!href) return false;
    for (let i = 0; i < EXCLUDED_PATTERNS.length; i++) {
      if (href.indexOf(EXCLUDED_PATTERNS[i]) === 0) return false;
    }
    return true;
  }

  function isInChessOverlay(el) {
    while (el) {
      if (el.id === 'chess-gate-overlay') return true;
      el = el.parentElement;
    }
    return false;
  }

  function fadeOutAndNavigate(href) {
    if (isNavigating) return;
    isNavigating = true;

    document.body.classList.add('page-fade-out');

    setTimeout(function () {
      window.location.href = href;
    }, FADE_DURATION);
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!isInternalLink(href)) return;
    if (isInChessOverlay(link)) return;
    if (link.getAttribute('target') === '_blank') return;

    e.preventDefault();
    fadeOutAndNavigate(href);
  });

})();
