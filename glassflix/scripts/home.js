import { getTrending, getNowPlaying, getOnTheAir, getPopularMovies, getPopularTV, getTopRatedMovies, getTopRatedTV } from './api.js';
import { createCard, lazyLoadImages } from './ui.js';
import { subscribeSettings } from './settings.js';

async function renderSection(selector, fetcher, transform = x => x) {
  const root = document.querySelector(selector);
  if (!root) return;
  root.innerHTML = '<div class="cards" id="cards"></div>';
  const cards = root.querySelector('#cards');
  const data = await fetcher();
  const items = transform(data.results || []);
  for (const item of items) cards.appendChild(createCard(item));
  lazyLoadImages(root);
}

function bindStatusPill() {
  const pill = document.getElementById('site-status-pill');
  if (!pill) return;
  subscribeSettings((s) => {
    const status = s.siteStatus || (s.maintenance ? 'maintenance' : 'operational');
    const color = status === 'operational' ? '#2dd4bf' : status === 'degraded' ? '#fbbf24' : '#f87171';
    pill.innerHTML = `<span class="pill" style="border-color:${color}; background:${color}22">Status: ${status}</span>`;
  });
}

export async function initHome() {
  bindStatusPill();
  renderSection('#trending', getTrending);
  renderSection('#nowplaying', getNowPlaying);
  renderSection('#ontheair', getOnTheAir);
  renderSection('#popular-movies', getPopularMovies);
  renderSection('#popular-tv', getPopularTV);
  renderSection('#toprated-movies', getTopRatedMovies);
  renderSection('#toprated-tv', getTopRatedTV);
}

initHome();