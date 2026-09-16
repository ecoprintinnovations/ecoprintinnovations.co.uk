(function () {
  var btn = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav]');
  var header = document.querySelector('[data-site-header]');

  function closeMenu() {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }

  if (btn && menu) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  function syncHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  var storyStage = document.querySelector('[data-story-stage]');
  function syncStoryProgress() {
    if (!storyStage) return;
    var rect = storyStage.getBoundingClientRect();
    var travel = Math.max(window.innerHeight * 0.82, 1);
    var raw = Math.min(Math.max((0 - rect.top) / travel, 0), 1);
    storyStage.style.setProperty('--story-progress', raw.toFixed(3));
  }

  syncStoryProgress();
  window.addEventListener('scroll', syncStoryProgress, { passive: true });
  window.addEventListener('resize', syncStoryProgress);

  var currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(function (year) {
    year.textContent = currentYear;
  });

  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    group.querySelectorAll('[data-reveal]').forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index * 90, 360) + 'ms';
    });
  });

  var revealNodes = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealNodes.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px 120px 0px' });

    revealNodes.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealNodes.forEach(function (el) {
      el.classList.add('visible');
    });
  }
})();
