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
    const { db, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } = await getFirebase().then(({db}) => import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js').then(m => ({...m, db})));
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snap) => {
      const root = document.getElementById('inc-list');
      root.innerHTML = snap.docs.map(d => {
        const inc = d.data();
        return `<div class="content-glass" style="margin:.4rem 0; padding:.6rem">
            <div style="display:flex;justify-content:space-between;align-items:center"><div><span class="pill">${inc.severity}</span> <strong>${inc.title}</strong></div>
            <button data-id="${d.id}" class="btn btn-secondary del">Delete</button></div>
            <div style="color:var(--muted); font-size:.9rem; margin-top:.3rem">${inc.message}</div>
            ${inc.status? `<div class="pill" style="margin-top:.3rem">${inc.status}</div>`:''}
          </div>`;
      }).join('');
      root.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', async () => {
        await deleteDoc(doc(db, 'incidents', btn.dataset.id));
      }));
    });
    document.getElementById('post-incident').addEventListener('click', async () => {
      const title = document.getElementById('incTitle').value.trim();
      const message = document.getElementById('incMessage').value.trim();
      const severity = document.getElementById('incSeverity').value;
      const status = document.getElementById('incStatus').value.trim();
      if (!title || !message) return alert('Title and message required');
      await addDoc(collection(db, 'incidents'), { title, message, severity, status, createdAt: serverTimestamp() });
      alert('Incident posted');
    });
  } catch {
    document.getElementById('inc-list').innerHTML = '<div class="content-glass">Incidents unavailable (no Firebase).</div>';
  }
}

function initPanel() {
  // settings
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

  // notifications
  document.getElementById('send').addEventListener('click', () => {
    const title = document.getElementById('nTitle').value.trim();
    const message = document.getElementById('nMessage').value.trim();
    const level = document.getElementById('nLevel').value;
    if (!title || !message) return alert('Title and message required');
    addNotification({ title, message, level });
    alert('Notification sent');
  });

  // pin
  document.getElementById('save-pin').addEventListener('click', () => {
    const np = (document.getElementById('newPin').value || '').trim();
    if (!np) return alert('Enter a new PIN');
    setPin(np); alert('PIN updated');
  });

  // incidents
  renderIncidents();
}

gate();