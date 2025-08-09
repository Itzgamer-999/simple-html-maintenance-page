import { addNotification } from './notifications.js';
import { getFirebase } from './firebase.js';
import { saveSettings, subscribeSettings } from './settings.js';

const PIN_KEY = 'admin:pin';
const SETTINGS_KEY = 'site:settings';

function getPin() { return localStorage.getItem(PIN_KEY) || '0000'; }
function setPin(p) { localStorage.setItem(PIN_KEY, p); }

function loadSettingsLocal() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}

function gate() {
  const gate = document.getElementById('gate');
  const panel = document.getElementById('panel');
  document.getElementById('enter').addEventListener('click', () => {
    const pin = (document.getElementById('pin').value || '').trim();
    if (pin === getPin()) { gate.style.display = 'none'; panel.style.display = 'block'; initPanel(); }
    else { alert('Invalid PIN'); }
  });
}

async function renderIncidents() {
  try {
    const { db, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, Timestamp, getDoc, setDoc } = await getFirebase().then(({db}) => import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js').then(m => ({...m, db})));
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snap) => {
      const root = document.getElementById('inc-list');
      root.innerHTML = snap.docs.map(d => {
        const inc = d.data();
        const updates = (inc.updates || []).map(u => `<div style=\"color:var(--muted); font-size:.85rem; margin:.25rem 0\"><strong>${u.status}</strong> — ${u.message} <span style=\"opacity:.7\">(${u.time?.toDate?u.time.toDate().toLocaleString():''})</span></div>`).join('');
        const schedule = inc.startAt?.toDate ? `Scheduled: ${inc.startAt.toDate().toLocaleString()} → ${inc.endAt?.toDate?inc.endAt.toDate().toLocaleString():''}` : '';
        return `<div class=\"content-glass\" style=\"margin:.4rem 0; padding:.6rem\">
            <div style=\"display:flex;justify-content:space-between;align-items:center\"><div><span class=\"pill\">${inc.severity}</span> <strong>${inc.title}</strong> ${inc.resolved?'<span class=\"pill\" style=\"margin-left:.3rem\">resolved</span>':''}</div>
            <div>
              <button data-id=\"${d.id}\" class=\"btn btn-secondary upd\">Add Update</button>
              ${inc.resolved?`<button data-id=\"${d.id}\" class=\"btn btn-secondary arc\">Archive</button>`:`<button data-id=\"${d.id}\" class=\"btn btn-secondary res\">Resolve</button>`}
              <button data-id=\"${d.id}\" class=\"btn btn-secondary del\">Delete</button>
            </div></div>
            <div style=\"color:var(--muted); font-size:.9rem; margin-top:.3rem\">${inc.message}</div>
            ${schedule?`<div style=\"margin-top:.3rem\">${schedule}</div>`:''}
            ${updates?`<div style=\"margin-top:.4rem\">${updates}</div>`:''}
          </div>`;
      }).join('');
      root.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'incidents', btn.dataset.id));
      }));
      root.querySelectorAll('.res').forEach(btn => btn.addEventListener('click', async () => {
        await updateDoc(doc(db, 'incidents', btn.dataset.id), { resolved: true, resolvedAt: serverTimestamp(), status: 'resolved' });
      }));
      root.querySelectorAll('.upd').forEach(btn => btn.addEventListener('click', async () => {
        const status = prompt('Status (e.g., investigating, monitoring, resolved)');
        const message = prompt('Update message');
        if (!status || !message) return;
        await updateDoc(doc(db, 'incidents', btn.dataset.id), { updates: arrayUnion({ status, message, time: serverTimestamp() }), status });
      }));
      root.querySelectorAll('.arc').forEach(btn => btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const src = await (await getDoc(doc(db, 'incidents', id))).data();
        if (!src) return;
        await setDoc(doc(db, 'incidents_archive', id), { ...src, archivedAt: serverTimestamp() });
        await deleteDoc(doc(db, 'incidents', id));
      }));
    });
    document.getElementById('post-incident').addEventListener('click', async () => {
      const title = document.getElementById('incTitle').value.trim();
      const message = document.getElementById('incMessage').value.trim();
      const severity = document.getElementById('incSeverity').value;
      const status = document.getElementById('incStatus').value.trim() || 'investigating';
      const startVal = document.getElementById('incStart').value;
      const endVal = document.getElementById('incEnd').value;
      const startAt = startVal ? Timestamp.fromDate(new Date(startVal)) : null;
      const endAt = endVal ? Timestamp.fromDate(new Date(endVal)) : null;
      if (!title || !message) return alert('Title and message required');
      await addDoc(collection(db, 'incidents'), { title, message, severity, status, createdAt: serverTimestamp(), startAt, endAt, resolved: false, updates: [] });
      alert('Incident posted');
    });
  } catch (e) {
    document.getElementById('inc-list').innerHTML = '<div class="content-glass">Incidents unavailable (no Firebase).</div>';
  }
}

function initPanel() {
  subscribeSettings((s) => {
    document.getElementById('maintenance').checked = !!s.maintenance;
    document.getElementById('maintenanceMessage').value = s.maintenanceMessage || '';
    document.getElementById('blockPopups').checked = !!s.blockPopups;
    document.getElementById('defaultTheme').value = s.defaultTheme || (localStorage.getItem('theme') || 'dark');
  });

  document.getElementById('save-settings').addEventListener('click', async () => {
    const ns = {
      maintenance: document.getElementById('maintenance').checked,
      maintenanceMessage: document.getElementById('maintenanceMessage').value,
      blockPopups: document.getElementById('blockPopups').checked,
      defaultTheme: document.getElementById('defaultTheme').value
    };
    await saveSettings(ns);
    if (ns.defaultTheme) { localStorage.setItem('theme', ns.defaultTheme); document.documentElement.setAttribute('data-theme', ns.defaultTheme); }
    alert('Settings saved');
  });

  document.getElementById('send').addEventListener('click', () => {
    const title = document.getElementById('nTitle').value.trim();
    const message = document.getElementById('nMessage').value.trim();
    const level = document.getElementById('nLevel').value;
    if (!title || !message) return alert('Title and message required');
    addNotification({ title, message, level });
    alert('Notification sent');
  });

  document.getElementById('save-pin').addEventListener('click', () => {
    const np = (document.getElementById('newPin').value || '').trim();
    if (!np) return alert('Enter a new PIN');
    setPin(np); alert('PIN updated');
  });

  renderIncidents();
}

gate();