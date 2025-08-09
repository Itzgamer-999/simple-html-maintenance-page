import { confirmExternal } from './ui.js';

export function buildVidSrcUrl(mediaType, tmdbId, season = 1, episode = 1, opts = {}) {
  const base = 'https://vidsrc.xyz/embed';
  const params = new URLSearchParams();
  if (tmdbId) params.set('tmdb', String(tmdbId));
  if (opts.dsLang) params.set('ds_lang', opts.dsLang);
  if (opts.subUrl) params.set('sub_url', opts.subUrl);
  if (opts.autoplay !== undefined) params.set('autoplay', opts.autoplay ? '1' : '0');
  if (opts.autonext !== undefined) params.set('autonext', opts.autonext ? '1' : '0');

  if (mediaType === 'movie') return `${base}/movie?${params.toString()}`;
  if (season && episode) { params.set('season', String(season)); params.set('episode', String(episode)); }
  return `${base}/tv?${params.toString()}`;
}

export function injectPlayer(container, { mediaType, tmdbId, season = 1, episode = 1, opts = {} }) {
  const url = buildVidSrcUrl(mediaType, tmdbId, season, episode, opts);
  container.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.allowFullscreen = true;
  frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write');
  confirmExternal(url).then(ok => { if (ok) frame.src = url; });
  container.appendChild(frame);
}