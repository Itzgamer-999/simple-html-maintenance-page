import { TMDB_API_KEY, TMDB_V4_TOKEN } from './config.js';

async function checkTMDB() {
  try {
    const url = TMDB_V4_TOKEN ? 'https://api.themoviedb.org/3/configuration' : `https://api.themoviedb.org/3/configuration?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { headers: TMDB_V4_TOKEN ? { Authorization: `Bearer ${TMDB_V4_TOKEN}` } : {} });
    return res.ok;
  } catch { return false; }
}
async function checkVidSrc() {
  try {
    const res = await fetch('https://vidsrc.xyz/', { mode: 'no-cors' });
    return !!res; // opaque is fine
  } catch { return false; }
}
function pill(el, ok) { el.innerHTML = ok ? '<span class="pill" style="background:rgba(0,255,150,.2);border-color:#2dd4bf">Online</span>' : '<span class="pill" style="background:rgba(255,0,0,.2);border-color:#f87171">Offline</span>'; }

async function checkSW() {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!reg;
}

function cacheSize() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('cache:')) total++;
  }
  return total;
}

(async () => {
  const tmdb = document.getElementById('tmdb');
  const vidsrc = document.getElementById('vidsrc');
  const sw = document.getElementById('sw');
  const cache = document.getElementById('cache');

  pill(tmdb, await checkTMDB());
  pill(vidsrc, await checkVidSrc());
  pill(sw, await checkSW());
  cache.innerHTML = `Cache entries: <span class="pill">${cacheSize()}</span>`;
})();