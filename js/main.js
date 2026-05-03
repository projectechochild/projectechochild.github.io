document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initActiveNav();
  initSmoothScroll();
  initScrollAnimations();
  initPageTransitions();
});

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
  const animatedElements = document.querySelectorAll('.card, .location-card, .comic-item, .gallery-item, .crew-member');

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
    if (el.classList.contains('location-card')) {
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

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) {
        return;
      }

      e.preventDefault();

      const pageContent = document.querySelector('.page-content');
      if (pageContent) {
        pageContent.style.opacity = '0';
        pageContent.style.transform = 'translateY(10px)';
        pageContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      }

      setTimeout(function () {
        window.location.href = href;
      }, 300);
    });
  });
}
