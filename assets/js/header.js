const normalizeBasePath = (basePath) => {
  if (!basePath) {
    return '';
  }
  const trimmed = basePath.trim();
  if (trimmed === '/' || trimmed === '') {
    return '';
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const getBasePath = () => {
  const metaBase = document.querySelector('meta[name="site-base"]');
  if (metaBase) {
    return normalizeBasePath(metaBase.getAttribute('content') || '');
  }

  // Infer GitHub Pages project base path from the first URL segment when hosted on github.io.
  const { hostname, pathname } = window.location;
  if (hostname.endsWith('github.io')) {
    const [firstSegment] = pathname.split('/').filter(Boolean);
    return firstSegment ? `/${firstSegment}` : '';
  }

  return '';
};

const applyBasePaths = (basePath, container) => {
  container.querySelectorAll('[data-base-href]').forEach((link) => {
    const baseHref = link.getAttribute('data-base-href');
    if (!baseHref) {
      return;
    }
    link.setAttribute('href', `${basePath}${baseHref}`);
  });

  container.querySelectorAll('[data-base-src]').forEach((asset) => {
    const baseSrc = asset.getAttribute('data-base-src');
    if (!baseSrc) {
      return;
    }
    asset.setAttribute('src', `${basePath}${baseSrc}`);
  });
};

const normalizePathname = (pathname) => {
  if (!pathname) {
    return '/index.html';
  }
  return pathname.endsWith('/') ? `${pathname}index.html` : pathname;
};

const setActiveNavItem = (container) => {
  const currentUrl = new URL(window.location.href);
  const currentPath = normalizePathname(currentUrl.pathname);
  const currentHash = currentUrl.hash;

  container.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.classList.remove('is-active');
    link.removeAttribute('aria-current');

    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    const linkUrl = new URL(href, window.location.origin);
    const linkPath = normalizePathname(linkUrl.pathname);

    if (linkUrl.hash) {
      if (linkPath === currentPath && linkUrl.hash === currentHash) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
      return;
    }

    if (!currentHash && linkPath === currentPath) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
};

const setupMobileMenu = (container) => {
  const button = container.querySelector('#mobile-menu-button');
  const menu = container.querySelector('#mobile-menu');
  if (!button || !menu) {
    return;
  }

  button.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    button.setAttribute('aria-expanded', String(!isOpen));
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('site-header');
  if (!placeholder) {
    return;
  }

  const basePath = getBasePath();
  const headerUrl = `${basePath}/partials/header.html`;

  fetch(headerUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Header fetch failed: ${response.status}`);
      }
      return response.text();
    })
    .then((markup) => {
      placeholder.innerHTML = markup;
      applyBasePaths(basePath, placeholder);
      setActiveNavItem(placeholder);
      setupMobileMenu(placeholder);
    })
    .catch((error) => {
      console.error('Unable to load site header.', error);
    });
});
