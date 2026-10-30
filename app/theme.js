// Apply before the page is drawn. Appearance is a device preference, not track data.
(function () {
  'use strict';
  const key = 'slotforge.theme.v1', root = document.documentElement;
  const valid = value => value === 'light' || value === 'dark';
  const fileMode = location.protocol === 'file:';
  const packageRoot = new URL('../', document.currentScript.src);
  let theme = 'dark';
  try { const saved = localStorage.getItem(key); if (valid(saved)) theme = saved; } catch {}
  // file:// storage can be separate for every HTML file. Carry the preference
  // between our pages as well; never change external URLs or downloads.
  if (fileMode) {
    const incoming = new URL(location.href).searchParams.get('sfTheme');
    if (valid(incoming)) {
      theme = incoming;
      try { localStorage.setItem(key, theme); } catch {}
    }
  }
  function updateLinks() {
    if (!fileMode) return;
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || link.hasAttribute('download')) return;
      let url; try { url = new URL(href, location.href); } catch { return; }
      if (url.protocol === 'file:' && url.href.startsWith(packageRoot.href) && /\.html$/i.test(url.pathname)) {
        url.searchParams.set('sfTheme', theme);
        link.href = url.href;
      }
    });
  }
  function apply(next, remember = false) {
    theme = valid(next) ? next : 'dark';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
    if (remember) {
      try { localStorage.setItem(key, theme); } catch {}
      // Keep a previously passed file preference in sync on refresh.
      if (fileMode) {
        const url = new URL(location.href); url.searchParams.set('sfTheme', theme);
        try { history.replaceState(history.state, '', url.href); } catch {}
      }
    }
    updateLinks();
  }
  apply(theme);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => apply(button.dataset.themeChoice, true));
    });
    apply(theme);
    // Also covers library links created after initial page load.
    document.addEventListener('click', updateLinks, true);
  });
  window.addEventListener('storage', event => {
    if (event.key === key) apply(valid(event.newValue) ? event.newValue : 'dark');
  });
  window.addEventListener('pageshow', () => {
    try { const saved = localStorage.getItem(key); if (valid(saved)) apply(saved); } catch {}
  });
})();
