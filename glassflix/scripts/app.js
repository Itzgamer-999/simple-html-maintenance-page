import { getAll } from './store.js';

function renderHeader() {
  const header = document.querySelector('header.site-header');
  if (!header) return;
  header.innerHTML = `
    <div class="nav">
      <div class="container header-inner">
        <a class="brand link-underline" href="index.html">
          <img src="assets/logo.svg" alt="GlassFlix"/>
          <span>GlassFlix</span>
        </a>
        <form id="search-form" class="searchbar" action="search.html">
          <input id="search-input" name="q" placeholder="Search movies, TV..." aria-label="Search" required />
          <button class="btn btn-secondary" type="submit">Search</button>
        </form>
        <div class="header-actions">
          <a class="btn btn-secondary" href="my-list.html">My List (<span id="wl-count">0</span>)</a>
          <button id="theme-toggle" class="btn" title="Toggle theme">Theme</button>
        </div>
      </div>
    </div>`;
}

function bindHeader() {
  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', (e) => {
    const input = document.getElementById('search-input');
    if (!input.value.trim()) { e.preventDefault(); }
  });
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  });
  const wlCount = document.getElementById('wl-count');
  const refresh = () => wlCount && (wlCount.textContent = String(getAll().length));
  refresh();
  window.addEventListener('watchlist:changed', refresh);
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

export function boot() {
  const theme = localStorage.getItem('theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  renderHeader();
  bindHeader();
  registerSW();
}

// Auto-run
boot();