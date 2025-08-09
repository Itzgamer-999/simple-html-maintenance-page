import { getAll } from './store.js';
import { unreadCount as notifCount, renderCenter } from './notifications.js';
import { showModal } from './ui.js';
import { subscribeSettings } from './settings.js';
import { startNotifications } from './notifications.js';

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

function renderDock() {
  const dock = document.createElement('nav');
  dock.className = 'dock';
  dock.innerHTML = `
    <div class="dock-inner">
      <a href="index.html" title="Home"><span class="ico">🏠</span><span class="lbl">Home</span></a>
      <a href="search.html" title="Browse"><span class="ico">🔎</span><span class="lbl">Browse</span></a>
      <a href="my-list.html" title="My List"><span class="ico">❤️</span><span class="lbl">My List</span></a>
      <button id="dock-bell" title="Notifications" style="position:relative"><span class="ico">🔔</span><span class="lbl">Alerts</span><span id="dock-badge" class="badge-dot" style="display:none"></span></button>
      <a href="status.html" title="Status"><span class="ico">📈</span><span class="lbl">Status</span></a>
    </div>`;
  document.body.appendChild(dock);
}

function wireDock() {
  const bell = document.getElementById('dock-bell');
  const badge = document.getElementById('dock-badge');
  const refresh = () => { const c = notifCount(); badge.style.display = c > 0 ? 'block' : 'none'; badge.title = c>0?`${c} unread`:'No unread'; };
  refresh();
  window.addEventListener('notify:update', refresh);
  bell?.addEventListener('click', () => {
    const html = renderCenter();
    showModal(html);
    const btn = document.getElementById('mark-read');
    btn?.addEventListener('click', () => { import('./notifications.js').then(m => m.markAllRead()); });
  });
}

function maintenanceBanner() {
  let bar = null;
  subscribeSettings((s) => {
    if (s.maintenance) {
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'nav';
        bar.style.position = 'fixed'; bar.style.top = '0'; bar.style.width = '100%'; bar.style.zIndex = '90';
        document.body.appendChild(bar);
        document.body.style.paddingTop = '48px';
      }
      bar.innerHTML = `<div class="container" style="padding:.4rem 0; color: #001018"><div class="content-glass" style="background:linear-gradient(180deg,var(--accent),var(--accent-2)); color:#001018; text-align:center; font-weight:700">${s.maintenanceMessage || 'Maintenance mode active'}</div></div>`;
    } else if (bar) {
      bar.remove(); bar = null; document.body.style.paddingTop = '';
    }
  });
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
  renderDock();
  wireDock();
  maintenanceBanner();
  startNotifications();
  registerSW();
}

// Auto-run
boot();