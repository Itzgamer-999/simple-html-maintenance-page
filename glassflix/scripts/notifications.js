import { getFirebase } from './firebase.js';

const READ_NS = 'notifications:read:v1';
let mem = [];
let unsub = null;

function readSet() { try { return new Set(JSON.parse(localStorage.getItem(READ_NS) || '[]')); } catch { return new Set(); } }
function saveRead(set) { try { localStorage.setItem(READ_NS, JSON.stringify([...set])); } catch {} }

export async function startNotifications() {
  try {
    const { db, collection, onSnapshot } = await getFirebase();
    const ref = collection(db, 'notifications');
    unsub = onSnapshot(ref, (snap) => {
      mem = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (b.time?.seconds||0)-(a.time?.seconds||0));
      dispatch();
    });
  } catch {
    mem = []; // no backend; keep empty
    dispatch();
  }
}

export function getAll() { return mem; }
export function unreadCount() {
  const seen = readSet();
  return mem.filter(n => !seen.has(n.id)).length;
}
export function markAllRead() { const seen = readSet(); mem.forEach(n => seen.add(n.id)); saveRead(seen); dispatch(); }

export async function addNotification({ title, message, level = 'info' }) {
  const ts = Date.now();
  try {
    const { db, collection, addDoc, serverTimestamp } = await getFirebase();
    await addDoc(collection(db, 'notifications'), { title, message, level, time: serverTimestamp() });
  } catch {
    // no-op if offline
  }
}

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
          <div class="pill">${n.level}</div>
          <div style="flex:1">
            <div style="font-weight:600">${n.title}</div>
            <div style="color:var(--muted); font-size:.9rem">${n.message}</div>
          </div>
          <div style="color:var(--muted); font-size:.8rem">${n.time?.toDate ? n.time.toDate().toLocaleString() : ''}</div>
        </div>`).join('')}
    </div>`;
  return html;
}