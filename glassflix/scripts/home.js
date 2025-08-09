import { getTrending, getNowPlaying, getOnTheAir } from './api.js';
import { createCard, lazyLoadImages } from './ui.js';

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

export async function initHome() {
  renderSection('#trending', getTrending);
  renderSection('#nowplaying', getNowPlaying);
  renderSection('#ontheair', getOnTheAir);
}

initHome();