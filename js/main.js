document.addEventListener('DOMContentLoaded', function () {
  initIntroLoader();
  initMobileNav();
  initActiveNav();
  initSmoothScroll();
  initScrollAnimations();
  initPageTransitions();
  initEscapeKey();
  initAutoPageLoad();
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

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.card, .location-card, .comic-item, .gallery-item, .crew-member, .character-card');

  if (!('IntersectionObserver' in window)) {
    animatedElements.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0) translateX(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animatedElements.forEach(function (el) {
    el.style.opacity = '0';
    if (el.classList.contains('location-card') || el.classList.contains('character-card')) {
      el.style.transform = 'translateX(-30px)';
    } else {
      el.style.transform = 'translateY(30px)';
    }
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(el);
  });
}

function initPageTransitions() {
  const links = document.querySelectorAll('nav a:not(.active), .hero .btn, .card .btn');
  const transitionOverlay = document.getElementById('page-transition');
  const houseDoor = transitionOverlay ? transitionOverlay.querySelector('.house-door') : null;
  const house = transitionOverlay ? transitionOverlay.querySelector('.house') : null;
  const girlContainer = transitionOverlay ? transitionOverlay.querySelector('.girl-container') : null;
  const girlSmile = transitionOverlay ? transitionOverlay.querySelector('.girl-smile') : null;
  const glitchOverlay = transitionOverlay ? transitionOverlay.querySelector('.glitch-overlay') : null;

  if (!transitionOverlay) {
    // Fallback: 3D exit animation
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) {
          return;
        }

        e.preventDefault();
        const pageWrapper = document.querySelector('.page-wrapper');
        if (pageWrapper) {
          pageWrapper.style.animation = 'pageExit3D 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards';
        }

        setTimeout(function () {
          window.location.href = href;
        }, 800);
      });
    });
    return;
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) {
        return;
      }

      e.preventDefault();

      // Start 3D exit animation on current page
      const pageWrapper = document.querySelector('.page-wrapper');
      if (pageWrapper) {
        pageWrapper.style.animation = 'pageExit3D 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards';
      }

      // Show transition overlay after exit animation
      setTimeout(function () {
        transitionOverlay.style.display = 'flex';
        transitionOverlay.classList.add('active');

        // House 3D effect
        if (house) {
          setTimeout(function () {
            house.classList.add('transitioning');
          }, 200);
        }

        // Girl walks in (scale up)
        if (girlContainer) {
          setTimeout(function () {
            girlContainer.classList.add('enter');
          }, 500);
        }

        // Girl smiles
        if (girlSmile) {
          setTimeout(function () {
            girlContainer.classList.add('smile');
            girlSmile.classList.add('show');
          }, 1500);
        }

        // Open door
        if (houseDoor) {
          setTimeout(function () {
            houseDoor.classList.add('open');
          }, 2000);
        }

        // Glitch effect
        if (glitchOverlay) {
          setTimeout(function () {
            glitchOverlay.classList.add('active');
          }, 3000);
        }

        // Navigate to new page
        setTimeout(function () {
          window.location.href = href;
        }, 4000);
      }, 800);
    });
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

// Auto-load next page when scrolling to bottom
function initAutoPageLoad() {
  const pageOrder = ['index.html', 'cast.html', 'locations.html', 'behind-scenes.html', 'horror-stories.html', 'comics.html', 'about.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentIndex = pageOrder.indexOf(currentPage);

  if (currentIndex === -1 || currentIndex === pageOrder.length - 1) return;

  let isLoading = false;
  let loadIndicator = null;

  window.addEventListener('scroll', function () {
    if (isLoading) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    const threshold = 200;

    if (scrollPosition >= documentHeight - threshold) {
      isLoading = true;
      loadNextPage();
    }
  });

  function loadNextPage() {
    const nextPage = pageOrder[currentIndex + 1];

    showLoadIndicator();

    setTimeout(function () {
      window.location.href = nextPage;
    }, 800);
  }

  function showLoadIndicator() {
    loadIndicator = document.createElement('div');
    loadIndicator.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(233,69,96,0.9);color:#fff;padding:12px 24px;border-radius:4px;font-family:var(--font-body);z-index:9999;animation:pulse 1s infinite;';
    loadIndicator.textContent = 'Loading next page...';
    document.body.appendChild(loadIndicator);
  }
}

// Swipe navigation for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function (e) {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function (e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < swipeThreshold) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const pageOrder = ['index.html', 'cast.html', 'locations.html', 'behind-scenes.html', 'horror-stories.html', 'comics.html', 'about.html'];
  const currentIndex = pageOrder.indexOf(currentPage);

  if (currentIndex === -1) return;

  if (diff > 0 && currentIndex < pageOrder.length - 1) {
    window.location.href = pageOrder[currentIndex + 1];
  } else if (diff < 0 && currentIndex > 0) {
    window.location.href = pageOrder[currentIndex - 1];
  }
}
