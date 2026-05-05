(function() {
  'use strict';

  function initIntroLoader() {
    var introLoader = document.getElementById('intro-loader');
    if (!introLoader) return;

    document.body.style.overflow = 'hidden';

    setTimeout(function() {
      finishIntro();
    }, 3000);

    introLoader.addEventListener('click', function() {
      finishIntro();
    });
  }

  function finishIntro() {
    var introLoader = document.getElementById('intro-loader');
    if (!introLoader) return;

    introLoader.classList.add('hidden');
    document.body.classList.remove('loading');
    document.body.style.overflow = '';

    setTimeout(function() {
      if (introLoader && introLoader.parentNode) {
        introLoader.parentNode.removeChild(introLoader);
      }
    }, 500);
  }

  function initMobileNav() {
    var toggle = document.querySelector('.mobile-toggle');
    var nav = document.querySelector('nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  function initActiveNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  function toggleDetails(cardId) {
    var card = document.getElementById(cardId);
    if (!card) return;
    card.classList.toggle('expanded');
  }

  function openFormModal(characterName, characterRole) {
    var modal = document.getElementById('form-modal');
    var title = document.getElementById('modal-title');
    var iframe = document.getElementById('modal-iframe');

    if (!modal || !title || !iframe) return;

    title.textContent = 'Audition for ' + characterName + ' (' + characterRole + ')';
    iframe.src = 'https://docs.google.com/forms/d/e/1FAIpQLSf8jrHPtqQFklJtPdmZYF8jahTUi7tUn__NesYb2GSIEFopaA/viewform?embedded=true';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeFormModal(event) {
    if (event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) {
      return;
    }

    var modal = document.getElementById('form-modal');
    var iframe = document.getElementById('modal-iframe');

    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    setTimeout(function() {
      if (iframe) iframe.src = '';
    }, 300);
  }

  function initEscapeKey() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('form-modal');
        if (modal && modal.classList.contains('active')) {
          closeFormModal({ target: modal, currentTarget: modal });
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initIntroLoader();
    initMobileNav();
    initActiveNav();
    initEscapeKey();
  });

  window.toggleDetails = toggleDetails;
  window.openFormModal = openFormModal;
  window.closeFormModal = closeFormModal;
})();
