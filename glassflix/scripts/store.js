const LS_KEY = 'watchlist:v1';

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function save(items) { try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {} }

export function getAll() { return load(); }
export function isSaved(id, mediaType) {
  return load().some(x => x.id === id && x.media_type === mediaType);
}
export function toggle(item) {
  const list = load();
  const idx = list.findIndex(x => x.id === item.id && x.media_type === item.media_type);
  if (idx >= 0) { list.splice(idx, 1); } else { list.unshift(item); }
  save(list);
  try { window.dispatchEvent(new CustomEvent('watchlist:changed')); } catch {}
  return idx < 0;
}