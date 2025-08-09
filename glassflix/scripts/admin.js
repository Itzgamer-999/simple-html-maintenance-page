import { addNotification } from './notifications.js';

const PIN_KEY = 'admin:pin';
const SETTINGS_KEY = 'site:settings';

function getPin() { return localStorage.getItem(PIN_KEY) || '0000'; }
function setPin(p) { localStorage.setItem(PIN_KEY, p); }

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

function gate() {
  const gate = document.getElementById('gate');
  const panel = document.getElementById('panel');
  document.getElementById('enter').addEventListener('click', () => {
    const pin = (document.getElementById('pin').value || '').trim();
    if (pin === getPin()) { gate.style.display = 'none'; panel.style.display = 'block'; initPanel(); }
    else { alert('Invalid PIN'); }
  });
}

function initPanel() {
  const s = loadSettings();
  document.getElementById('maintenance').checked = !!s.maintenance;
  document.getElementById('maintenanceMessage').value = s.maintenanceMessage || '';
  document.getElementById('blockPopups').checked = !!s.blockPopups;
  document.getElementById('defaultTheme').value = s.defaultTheme || (localStorage.getItem('theme') || 'dark');

  document.getElementById('save-settings').addEventListener('click', () => {
    const ns = {
      maintenance: document.getElementById('maintenance').checked,
      maintenanceMessage: document.getElementById('maintenanceMessage').value,
      blockPopups: document.getElementById('blockPopups').checked,
      defaultTheme: document.getElementById('defaultTheme').value
    };
    saveSettings(ns);
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
}

gate();