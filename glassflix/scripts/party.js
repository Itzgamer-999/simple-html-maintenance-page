import { getFirebase } from './firebase.js';

// Soft-sync params
const DRIFT_TOLERANCE = 1.2; // seconds
const SYNC_INTERVAL = 4000; // ms

export async function createRoom({ mediaType, tmdbId, season = 1, episode = 1 }) {
  const { db, collection, addDoc, serverTimestamp } = await getFirebase();
  const docRef = await addDoc(collection(db, 'rooms'), {
    mediaType, tmdbId, season, episode,
    createdAt: serverTimestamp(),
    state: { playing: false, time: 0, leader: true, lastUpdate: serverTimestamp() }
  });
  return docRef.id;
}

export async function joinRoom(roomId) {
  const { db, doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp, setDoc } = await getFirebase();
  const ref = doc(db, 'rooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');
  const room = snap.data();
  const chatRef = collection(db, 'rooms', roomId, 'chat');

  // Subscribe to state
  let unsub = onSnapshot(ref, (s) => {
    const r = s.data();
    if (!r) return;
    // broadcast event for UI
    try { window.dispatchEvent(new CustomEvent('party:state', { detail: r.state })); } catch {}
  });

  async function sendChat(user, text) {
    if (!text) return;
    await addDoc(chatRef, { user, text, time: serverTimestamp() });
  }
  function onChat(cb) {
    return onSnapshot(chatRef, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  async function updateState(state) {
    await setDoc(ref, { state, updatedAt: serverTimestamp() }, { merge: true });
  }

  return { room, sendChat, onChat, updateState, unsubscribe: () => unsub && unsub() };
}

export function bindPlayerSync(videoEl, getState, setState, isLeader) {
  let syncing = false;
  function maybeSync(state) {
    if (!state) return;
    if (isLeader()) return; // followers only
    const drift = Math.abs((videoEl.currentTime || 0) - (state.time || 0));
    if (drift > DRIFT_TOLERANCE) {
      syncing = true;
      videoEl.currentTime = state.time || 0;
      setTimeout(() => { syncing = false; }, 500);
    }
    if ((state.playing && videoEl.paused && !syncing)) videoEl.play().catch(() => {});
    if ((!state.playing && !videoEl.paused && !syncing)) videoEl.pause();
  }
  window.addEventListener('party:state', (e) => maybeSync(e.detail));
  setInterval(() => maybeSync(getState()), SYNC_INTERVAL);

  if (isLeader()) {
    const push = () => setState({ playing: !videoEl.paused, time: videoEl.currentTime });
    ['play','pause','seeked','timeupdate'].forEach(evt => videoEl.addEventListener(evt, () => { if (!syncing) push(); }));
  }
}