const NS = 'notifications:v1';

function load() { try { return JSON.parse(localStorage.getItem(NS) || '[]'); } catch { return []; } }
function save(list) { try { localStorage.setItem(NS, JSON.stringify(list)); } catch {} }

export function getAll() { return load().sort((a,b)=>b.time-a.time); }
export function unreadCount() { return load().filter(n => !n.read).length; }
export function addNotification({ title, message, level = 'info' }) {
  const list = load();
  const n = { id: crypto.randomUUID(), title, message, level, time: Date.now(), read: false };
  list.unshift(n); save(list);
  dispatch();
  return n.id;
}
export function markAllRead() { const list = load().map(n => ({...n, read:true})); save(list); dispatch(); }

function dispatch() { try { window.dispatchEvent(new CustomEvent('notify:update')); } catch {} }

export function renderCenter() {
  const items = getAll();
  const html = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.6rem">
      <h3 style="margin:0">Notifications</h3>
      <button class="btn" id="mark-read">Mark all read</button>
    </div>
    <div class="glass" style="max-height:60vh; overflow:auto; border-radius: var(--radius);">
      ${items.length===0 ? '<div class="content-glass">No notifications.</div>' : items.map(n => `
        <div style="display:flex; gap:.8rem; padding:.8rem; border-bottom:1px solid var(--glass-border)">
          <div class="pill" style="${n.read?'opacity:.6':''}">${n.level}</div>
          <div style="flex:1">
            <div style="font-weight:600">${n.title}</div>
            <div style="color:var(--muted); font-size:.9rem">${n.message}</div>
          </div>
          <div style="color:var(--muted); font-size:.8rem">${new Date(n.time).toLocaleString()}</div>
        </div>`).join('')}
    </div>`;
  return html;
}