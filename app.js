// app.js - progressive PJAX-like navigation with fade transitions
// Updated to re-run shared timing (script.js) and events (events.js) initializers
(function () {
  const containerSelector = 'main';
  const navSelector = '.nav-list';
  const internalLinkSelector = '.nav-list a[data-internal="true"]';

  // Helper: fetch page and extract <main> innerHTML and <title>
  async function fetchPage(url) {
    const res = await fetch(url, {credentials: 'same-origin'});
    if (!res.ok) throw new Error('Failed to fetch: ' + res.status);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const main = doc.querySelector(containerSelector);
    const title = doc.querySelector('title') ? doc.querySelector('title').innerText : '';
    return { mainHTML: main ? main.innerHTML : '', title };
  }

  // animate replace
  async function navigateTo(url, push = true) {
    const main = document.querySelector(containerSelector);
    if (!main) { window.location.href = url; return; }

    showLoader();

    // fade out
    main.classList.add('fade-out');
    await new Promise(r => setTimeout(r, 220));

    try {
      const { mainHTML, title } = await fetchPage(url);

      // replace content
      main.innerHTML = mainHTML;

      // re-run any inline scripts inside new main (if present)
      reexecuteInlineScripts(main);

      // update title
      if (title) document.title = title;

      // update active nav item
      setActiveNav(url);

      // ensure shared timing and events code re-initialize for the newly injected DOM
      if (window.__SUNDARBANS_initTiming) {
        try { window.__SUNDARBANS_initTiming(); } catch(e){ console.warn('timing init failed', e); }
      }
      if (window.__SUNDARBANS_initEvents) {
        try { window.__SUNDARBANS_initEvents(); } catch(e){ console.warn('events init failed', e); }
      }

      // focus main for accessibility
      main.setAttribute('tabindex', '-1');
      main.focus();

    } catch (e) {
      console.error(e);
      // fallback to full navigation
      window.location.href = url;
      return;
    } finally {
      hideLoader();
    }

    // fade in
    main.classList.remove('fade-out');
    main.classList.add('fade-in');
    setTimeout(() => {
      main.classList.remove('fade-in');
    }, 360);

    if (push) history.pushState({ url }, '', url);
  }

  // re-execute <script> tags inside the injected main (simple approach)
  function reexecuteInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(old => {
      const s = document.createElement('script');
      if (old.src) {
        s.src = old.src;
        s.async = false;
      } else {
        s.textContent = old.textContent;
      }
      old.parentNode.replaceChild(s, old);
    });
  }

  // active nav styling
  function setActiveNav(url) {
    const links = document.querySelectorAll(navSelector + ' a');
    links.forEach(a => {
      try {
        const href = new URL(a.href, location.origin).pathname;
        const target = new URL(url, location.origin).pathname;
        if (href === target) a.classList.add('active');
        else a.classList.remove('active');
      } catch (e) { /* ignore */ }
    });
  }

  // attach click handlers
  function initLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // ignore external, new-tab, download or anchors with data-no-pjax
      if (a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('href')?.startsWith('#') || a.hasAttribute('data-no-pjax')) return;
      if (a.matches(internalLinkSelector)) {
        e.preventDefault();
        const url = a.href;
        navigateTo(url);
      }
    });
  }

  // handle back/forward
  window.addEventListener('popstate', (e) => {
    const url = (e.state && e.state.url) || location.pathname;
    // navigate without pushing history state again
    navigateTo(url, false);
  });

  // loader
  let loaderEl = null;
  function showLoader() {
    if (loaderEl) return;
    loaderEl = document.createElement('div');
    loaderEl.className = 'page-loader';
    loaderEl.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
    document.body.appendChild(loaderEl);
  }
  function hideLoader() {
    if (!loaderEl) return;
    loaderEl.remove();
    loaderEl = null;
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    initLinks();
    setActiveNav(location.pathname);

    // Also ensure that timing & events init run on first load
    if (window.__SUNDARBANS_initTiming) {
      try { window.__SUNDARBANS_initTiming(); } catch(e){ console.warn('timing init failed', e); }
    }
    if (window.__SUNDARBANS_initEvents) {
      try { window.__SUNDARBANS_initEvents(); } catch(e){ console.warn('events init failed', e); }
    }
  });

})();
