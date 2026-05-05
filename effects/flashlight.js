(function () {
  'use strict';

  var overlay = document.getElementById('cursor-glow');
  if (!overlay) return;

  var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  if (isMobile) {
    overlay.style.display = 'none';
    return;
  }

  var x = window.innerWidth / 2;
  var y = window.innerHeight / 2;
  var targetX = x;
  var targetY = y;

  document.addEventListener('mousemove', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function update() {
    requestAnimationFrame(update);

    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;

    overlay.style.setProperty('--glow-x', x + 'px');
    overlay.style.setProperty('--glow-y', y + 'px');
  }

  update();

  var isVisible = false;
  document.addEventListener('mouseenter', function () {
    if (!isVisible) {
      overlay.style.opacity = '1';
      isVisible = true;
    }
  });

  document.addEventListener('mouseleave', function () {
    if (isVisible) {
      overlay.style.opacity = '0';
      isVisible = false;
    }
  });
})();
