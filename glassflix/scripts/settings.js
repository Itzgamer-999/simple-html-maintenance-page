import { getFirebase } from './firebase.js';

let current = null;
let unsubscribe = null;

export async function subscribeSettings(callback) {
  try {
    const { db, doc, onSnapshot } = await getFirebase();
    const ref = doc(db, 'settings', 'global');
    unsubscribe = onSnapshot(ref, (snap) => {
      current = snap.exists() ? snap.data() : {};
      callback(current);
    });
  } catch (e) {
    // fallback to localStorage
    const raw = localStorage.getItem('site:settings');
    current = raw ? JSON.parse(raw) : {};
    callback(current);
  }
}

export function getSettingsCached() { return current || {}; }

export async function saveSettings(values) {
  try {
    const { db, doc, setDoc } = await getFirebase();
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, values, { merge: true });
  } catch (e) {
    localStorage.setItem('site:settings', JSON.stringify(values));
  }
}

export function stopSettings() { if (unsubscribe) unsubscribe(); }