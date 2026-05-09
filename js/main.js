document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('page-fade-ready');

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add('page-fade-in');
    });
  });

  initMobileNav();
  initActiveNav();
  initEscapeKey();
  initBrokenImages();
  if (typeof ChessGate !== 'undefined') ChessGate.init();

});

function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    nav.classList.toggle('open');
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

function initBrokenImages() {
  document.querySelectorAll('img').forEach(function (img) {
    if (img.hasAttribute('onerror')) return;
    img.addEventListener('error', function () {
      this.onerror = null;
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'img-placeholder';
      placeholder.textContent = '?';
      this.parentNode.insertBefore(placeholder, this);
    });
  });
}

function toggleDetails(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.toggle('expanded');
}

function openFormModal(characterName, characterRole, formUrl) {
  const modal = document.getElementById('form-modal');
  const title = document.getElementById('modal-title');
  const iframe = document.getElementById('modal-iframe');

  if (!modal || !title || !iframe) return;

  title.textContent = 'Audition for ' + characterName + ' (' + characterRole + ')';
  iframe.src = formUrl || 'https://docs.google.com/forms/d/e/1FAIpQLSf8jrHPtqQFklJtPdmZYF8jahTUi7tUn__NesYb2GSIEFopaA/viewform?embedded=true';

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
  }, 100);
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function (c) {
    var code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + 13) % 26) + 65);
    if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + 13) % 26) + 97);
    return c;
  });
}

function decryptAllStory() {
  var input = document.getElementById('story-password');
  var form = document.getElementById('story-auth-form');
  var paragraphs = document.querySelectorAll('.story-encrypted:not(.revealed)');
  var header = document.querySelector('.story-classified-header');

  if (!input || paragraphs.length === 0) return;

  var password = input.value.trim().toUpperCase();

  if (password !== 'ECHO-001') {
    input.classList.add('denied', 'shake');
    setTimeout(function () {
      input.classList.remove('shake');
    }, 500);
    setTimeout(function () {
      input.classList.remove('denied');
      input.value = '';
    }, 1500);
    return;
  }

  paragraphs.forEach(function (el) {
    el.textContent = rot13(el.textContent);
    el.classList.add('revealed');
  });

  if (form) {
    var granted = document.createElement('div');
    granted.className = 'story-auth-granted';
    granted.textContent = 'ACCESS GRANTED';
    form.parentNode.replaceChild(granted, form);
  }

  if (header) {
    header.classList.add('granted');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('story-password');
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') decryptAllStory();
    });
  }
});

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
