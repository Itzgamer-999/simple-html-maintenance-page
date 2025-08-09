export function buildVidSrcUrl(mediaType, tmdbId, season = 1, episode = 1) {
  const base = 'https://vidsrc.xyz';
  if (mediaType === 'movie') return `${base}/embed/movie?tmdb=${tmdbId}`;
  return `${base}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
}

export function injectPlayer(container, { mediaType, tmdbId, season = 1, episode = 1 }) {
  const url = buildVidSrcUrl(mediaType, tmdbId, season, episode);
  container.innerHTML = '';
  const note = document.createElement('div');
  note.className = 'content-glass';
  note.style.marginBottom = '.6rem';
  note.innerHTML = '<strong>Heads up:</strong> Player is sandboxed to block popups and redirects.';
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.allowFullscreen = true;
  frame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-presentation');
  container.appendChild(note);
  container.appendChild(frame);
}