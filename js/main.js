document.addEventListener('DOMContentLoaded', function () {
  initIntroLoader();
  initMobileNav();
  initActiveNav();
  initEscapeKey();
});

function initIntroLoader() {
  const introLoader = document.getElementById('intro-loader');
  if (!introLoader) return;

  document.body.style.overflow = 'hidden';

  setTimeout(function () {
    finishIntro();
  }, 3000);

  introLoader.addEventListener('click', function () {
    finishIntro();
  });
}

function finishIntro() {
  const introLoader = document.getElementById('intro-loader');
  if (!introLoader) return;

  introLoader.classList.add('hidden');
  document.body.classList.remove('loading');
  document.body.style.overflow = '';

  setTimeout(function () {
    if (introLoader && introLoader.parentNode) {
      introLoader.parentNode.removeChild(introLoader);
    }
  }, 500);
}

function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    nav.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove('open');
    }
  });
}

function initActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

function toggleDetails(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.toggle('expanded');
}

function openFormModal(characterName, characterRole) {
  const modal = document.getElementById('form-modal');
  const title = document.getElementById('modal-title');
  const iframe = document.getElementById('modal-iframe');

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

  const modal = document.getElementById('form-modal');
  const iframe = document.getElementById('modal-iframe');

  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';

  setTimeout(function () {
    if (iframe) iframe.src = '';
  }, 300);
}

function initEscapeKey() {
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('form-modal');
      if (modal && modal.classList.contains('active')) {
        closeFormModal({ target: modal, currentTarget: modal });
      }
    }
  });
}
