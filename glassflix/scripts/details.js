import { getMovieDetails, getTVDetails, imgPath } from './api.js';
import { injectPlayer } from './player.js';
import { toggle as toggleSave, isSaved } from './store.js';
import { createCard, lazyLoadImages, toast } from './ui.js';
import { createRoom, joinRoom } from './party.js';

function params() { const u = new URL(location.href); return { id: u.searchParams.get('id'), type: u.searchParams.get('type') }; }

async function load() {
  const { id, type } = params();
  const data = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id);

  // Hero
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

  // Cast
  const cast = (data.credits?.cast || data.aggregate_credits?.cast || []).slice(0, 12);
  const castEl = document.getElementById('cast');
  castEl.innerHTML = cast.map(p => `<span class="pill">${p.name}</span>`).join('');

  // Player
  const player = document.getElementById('player');
  const panel = document.getElementById('watch-panel');
  if (type === 'movie') {
    injectPlayer(player, { mediaType: 'movie', tmdbId: id });
  } else {
    const select = document.getElementById('episode-select');
    const seasons = (data.seasons || []).filter(s => s.season_number > 0);
    select.innerHTML = seasons.map(s => `<option value="${s.season_number}-1">S${s.season_number} E1</option>`).join('');
    select.addEventListener('change', () => {
      const [s, e] = select.value.split('-').map(Number);
      injectPlayer(player, { mediaType: 'tv', tmdbId: id, season: s, episode: e });
    });
    if (seasons[0]) injectPlayer(player, { mediaType: 'tv', tmdbId: id, season: seasons[0].season_number, episode: 1 });
  }

  // Watch Party
  const chatBox = document.getElementById('party-chat');
  const chatLog = document.getElementById('chat-log');
  const partyCreate = document.getElementById('party-create');
  const partyJoin = document.getElementById('party-join');
  const partyIdInput = document.getElementById('party-id');

  partyCreate.addEventListener('click', async () => {
    try {
      const roomId = await createRoom({ mediaType: type, tmdbId: id });
      partyIdInput.value = roomId; toast('Party created');
    } catch { toast('Failed to create room'); }
  });
  partyJoin.addEventListener('click', async () => {
    const roomId = partyIdInput.value.trim(); if (!roomId) return toast('Enter room ID');
    try {
      const sess = await joinRoom(roomId);
      chatBox.style.display = 'block';
      const render = (msgs) => { chatLog.innerHTML = msgs.map(m => `<div><strong>${m.user||'anon'}:</strong> ${m.text}</div>`).join(''); chatLog.scrollTop = chatLog.scrollHeight; };
      const stopChat = sess.onChat(render);
      const nameEl = document.getElementById('chat-name');
      const textEl = document.getElementById('chat-text');
      document.getElementById('chat-send').onclick = () => { sess.sendChat(nameEl.value || 'anon', textEl.value); textEl.value=''; };
    } catch { toast('Failed to join room'); }
  });

  // Recommendations
  const rec = document.getElementById('recommend');
  const list = (data.recommendations?.results || data.similar?.results || []).slice(0, 18);
  const grid = rec.querySelector('.cards');
  for (const item of list) grid.appendChild(createCard(item));
  lazyLoadImages(rec);
}

load();