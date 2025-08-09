import { TMDB_API_KEY, TMDB_V4_TOKEN } from './config.js';
import { getFirebase } from './firebase.js';

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
function pill(el, ok) { if (!el) return; el.innerHTML = ok ? '<span class="pill" style="background:rgba(0,255,150,.2);border-color:#2dd4bf">Online</span>' : '<span class="pill" style="background:rgba(255,0,0,.2);border-color:#f87171">Offline</span>'; }

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

function sparkline(id, key) {
  let arr = []; try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const el = document.getElementById(id);
  if (!el) return;
  const width = 160, height = 32, pad = 2;
  const points = arr.map(x => x[1]);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.style.display = 'block';
  const n = points.length || 1;
  const step = (width - pad * 2) / Math.max(1, n - 1);
  let d = '';
  points.forEach((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - v) * (height - pad * 2);
    d += (i === 0 ? `M${x},${y}` : ` L${x},${y}`);
  });
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', d || `M${pad},${height - pad}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'url(#g)');
  path.setAttribute('stroke-width', '2');
  const defs = document.createElementNS(svg.namespaceURI, 'defs');
  const lg = document.createElementNS(svg.namespaceURI, 'linearGradient');
  lg.setAttribute('id', `g_${id}`);
  lg.setAttribute('x1', '0'); lg.setAttribute('y1', '0'); lg.setAttribute('x2', '1'); lg.setAttribute('y2', '0');
  const s1 = document.createElementNS(svg.namespaceURI, 'stop'); s1.setAttribute('offset','0'); s1.setAttribute('stop-color', '#6ee7ff');
  const s2 = document.createElementNS(svg.namespaceURI, 'stop'); s2.setAttribute('offset','1'); s2.setAttribute('stop-color', '#a78bfa');
  lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg);
  path.setAttribute('stroke', `url(#g_${id})`);
  svg.appendChild(defs);
  svg.appendChild(path);
  el.innerHTML = ''; el.appendChild(svg);
}

function withinWindow(nowMs, inc) {
  const start = inc.startAt?.toDate ? inc.startAt.toDate().getTime() : null;
  const end = inc.endAt?.toDate ? inc.endAt.toDate().getTime() : null;
  if (start && end) return nowMs >= start && nowMs <= end;
  if (start && !end) return nowMs >= start;
  if (!start && end) return nowMs <= end;
  return true; // no schedule means always visible unless resolved rule applies
}

async function incidentsFeed() {
  try {
    const { db, collection, onSnapshot, query, orderBy, limit } = await getFirebase().then(({db}) => import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js').then(m => ({...m, db})));
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(25));
    onSnapshot(q, (snap) => {
      const now = Date.now();
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const list = raw.filter(inc => !inc.resolved || withinWindow(now, inc));
      const root = document.getElementById('incidents');
      if (!root) return;
      if (list.length === 0) { root.innerHTML = '<div class="content-glass">No current incidents.</div>'; return; }
      root.innerHTML = list.map(inc => `
        <div class="content-glass" style="margin-bottom:.5rem">
          <div class="filters" style="justify-content:space-between">
            <div>
              <span class="pill">${inc.severity || 'info'}</span>
              <strong style="margin-left:.5rem">${inc.title || 'Incident'}</strong>
              ${inc.resolved?'<span class="pill" style="margin-left:.3rem">resolved</span>':''}
            </div>
            <div style="color:var(--muted); font-size:.85rem">${inc.createdAt?.toDate ? inc.createdAt.toDate().toLocaleString() : ''}</div>
          </div>
          <div style="color:var(--muted); margin-top:.4rem">${inc.message || ''}</div>
          ${inc.startAt?.toDate ? `<div style="margin-top:.3rem">Scheduled: ${inc.startAt.toDate().toLocaleString()} → ${inc.endAt?.toDate?inc.endAt.toDate().toLocaleString():''}</div>`:''}
          ${inc.status ? `<div style="margin-top:.4rem"><span class="pill">${inc.status}</span></div>` : ''}
        </div>`).join('');
    });
  } catch {
    const root = document.getElementById('incidents');
    if (root) root.innerHTML = '<div class="content-glass">Incidents unavailable (no Firebase).</div>';
  }
}

(async () => {
  const tmdb = document.getElementById('tmdb');
  const vidsrc = document.getElementById('vidsrc');
  const sw = document.getElementById('sw');
  const cache = document.getElementById('cache');

  pill(tmdb, await checkTMDB());
  pill(vidsrc, await checkVidSrc());
  if (sw) pill(sw, await checkSW());
  if (cache) cache.innerHTML = `Cache entries: <span class="pill">${cacheSize()}</span>`;

  sparkline('spark-tmdb', 'uptime:tmdb');
  sparkline('spark-vidsrc', 'uptime:vidsrc');
  incidentsFeed();
})();