(function() {
  'use strict';

  var assetLoader = {
    criticalImages: [
      'assets/images/logo.png'
    ],

    loaded: 0,
    total: 0,

    preloadCritical: function() {
      var self = this;
      this.total = this.criticalImages.length;

      return new Promise(function(resolve) {
        if (self.total === 0) {
          resolve();
          return;
        }

        self.criticalImages.forEach(function(src) {
          var img = new Image();
          img.onload = img.onerror = function() {
            self.loaded++;
            if (self.loaded >= self.total) {
              resolve();
            }
          };
          img.src = src;
        });
      });
    },

    lazyLoad: function() {
      if (!('IntersectionObserver' in window)) {
        var lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(function(img) {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        });
        return;
      }

      var lazyImages = document.querySelectorAll('img[loading="lazy"]');
      var imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '200px'
      });

      lazyImages.forEach(function(img) {
        imageObserver.observe(img);
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    assetLoader.preloadCritical().then(function() {
      assetLoader.lazyLoad();
    });
  });

  window.assetLoader = assetLoader;
})();
