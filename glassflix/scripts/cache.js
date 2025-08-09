const memoryCache = new Map();

function now() { return Date.now(); }

export function getCache(key) {
  const mem = memoryCache.get(key);
  if (mem && mem.expires > now()) return mem.value;

  const raw = localStorage.getItem(`cache:${key}`);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.expires > now()) {
      memoryCache.set(key, { value: data.value, expires: data.expires });
      return data.value;
    }
    localStorage.removeItem(`cache:${key}`);
  } catch { /* ignore */ }
  return null;
}

export function setCache(key, value, ttlMs = 1000 * 60 * 10) { // default 10m
  const entry = { value, expires: now() + ttlMs };
  memoryCache.set(key, entry);
  try { localStorage.setItem(`cache:${key}`, JSON.stringify(entry)); } catch { /* quota */ }
}

export async function cachedFetchJson(key, url, options = {}, ttlMs = 1000 * 60 * 5) {
  const cached = getCache(key);
  if (cached) return cached;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  setCache(key, json, ttlMs);
  return json;
}