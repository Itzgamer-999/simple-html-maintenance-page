import { confirmExternal } from './ui.js';

export function buildVidSrcUrl(mediaType, tmdbId, season = 1, episode = 1) {
  const base = 'https://vidsrc.xyz';
  if (mediaType === 'movie') return `${base}/embed/movie?tmdb=${tmdbId}`;
  return `${base}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
}

export function injectPlayer(container, { mediaType, tmdbId, season = 1, episode = 1 }) {
  const url = buildVidSrcUrl(mediaType, tmdbId, season, episode);
  container.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.allowFullscreen = true;
  frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write');
  // Confirm before setting src to external provider
  confirmExternal(url).then(ok => { if (ok) frame.src = url; });
  container.appendChild(frame);
}