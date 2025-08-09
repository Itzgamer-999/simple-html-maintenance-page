import { getMovieDetails, getTVDetails, imgPath } from './api.js';
import { toggle as toggleSave, isSaved } from './store.js';
import { createCard, lazyLoadImages, toast } from './ui.js';

function params() { const u = new URL(location.href); return { id: u.searchParams.get('id'), type: u.searchParams.get('type') }; }

async function load() {
  const { id, type } = params();
  const data = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id);

  const hero = document.getElementById('hero');
  hero.querySelector('.hero-bg').style.backgroundImage = `url(${imgPath(data.backdrop_path, 'w780')})`;
  hero.querySelector('.title').textContent = data.title || data.name;
  hero.querySelector('.subtitle').textContent = data.tagline || (data.overview || '').slice(0, 160);
  hero.querySelector('#rating').textContent = (data.vote_average || 0).toFixed(1);
  hero.querySelector('#meta').textContent = [
    (data.release_date || data.first_air_date || '').slice(0,4),
    (type==='movie'? 'Movie':'TV'),
    (data.runtime ? `${data.runtime}m` : (data.episode_run_time && data.episode_run_time[0] ? `${data.episode_run_time[0]}m` : ''))
  ].filter(Boolean).join(' • ');

  const saveBtn = document.getElementById('save-btn');
  const saved = isSaved(Number(id), type);
  saveBtn.textContent = saved ? '− My List' : '+ My List';
  saveBtn.addEventListener('click', () => {
    const added = toggleSave({ id: Number(id), media_type: type, title: data.title || data.name, poster_path: data.poster_path });
    saveBtn.textContent = added ? '− My List' : '+ My List';
    toast(added ? 'Added to My List' : 'Removed from My List');
  });

  const watchBtn = document.getElementById('watch-now');
  if (watchBtn) {
    watchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (type === 'movie') location.href = `player.html?type=movie&tmdb=${id}`;
      else location.href = `player.html?type=tv&tmdb=${id}&season=1&episode=1`;
    });
  }

  const cast = (data.credits?.cast || data.aggregate_credits?.cast || []).slice(0, 12);
  const castEl = document.getElementById('cast');
  castEl.innerHTML = cast.map(p => `<span class="pill">${p.name}</span>`).join('');

  const rec = document.getElementById('recommend');
  const list = (data.recommendations?.results || data.similar?.results || []).slice(0, 18);
  const grid = rec.querySelector('.cards');
  for (const item of list) grid.appendChild(createCard(item));
  lazyLoadImages(rec);
}

load();