import { searchMulti, discoverMovies, discoverTV, getGenres } from './api.js';
import { createCard, lazyLoadImages } from './ui.js';

const state = { q: '', type: 'all', page: 1, loading: false, genres: { movie: [], tv: [] } };

function getParams() {
  const u = new URL(location.href);
  state.q = u.searchParams.get('q') || '';
}

async function renderGenres() {
  state.genres = await getGenres();
  const genreSelect = document.getElementById('genre');
  const type = document.getElementById('type').value;
  const list = type === 'movie' ? state.genres.movie : type === 'tv' ? state.genres.tv : [...state.genres.movie, ...state.genres.tv];
  genreSelect.innerHTML = '<option value="">All Genres</option>' + list.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function cardGrid() { return document.getElementById('results'); }

async function query(page = 1) {
  state.loading = true;
  const type = document.getElementById('type').value;
  const year = document.getElementById('year').value;
  const sort = document.getElementById('sort').value;
  const genre = document.getElementById('genre').value;

  let res;
  if (state.q) {
    res = await searchMulti(state.q, page);
  } else if (type === 'movie') {
    res = await discoverMovies({ with_genres: genre, primary_release_year: year, sort_by: sort || 'popularity.desc', page });
  } else if (type === 'tv') {
    res = await discoverTV({ with_genres: genre, first_air_date_year: year, sort_by: sort || 'popularity.desc', page });
  } else {
    // both: simple approach -> run two queries and merge
    const [m, t] = await Promise.all([
      discoverMovies({ with_genres: '', sort_by: sort || 'popularity.desc', page }),
      discoverTV({ with_genres: '', sort_by: sort || 'popularity.desc', page })
    ]);
    res = { results: [...(m.results||[]), ...(t.results||[])], page, total_pages: Math.max(m.total_pages||1, t.total_pages||1) };
  }

  const grid = cardGrid();
  for (const item of res.results || []) grid.appendChild(createCard(item));
  lazyLoadImages(grid);
  state.loading = false;
  return res;
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById('sentinel');
  const io = new IntersectionObserver(async (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || state.loading) continue;
      state.page += 1; await query(state.page);
    }
  }, { rootMargin: '800px 0px' });
  io.observe(sentinel);
}

export async function initSearch() {
  getParams();
  document.getElementById('q').value = state.q;
  document.getElementById('filters-form').addEventListener('change', async () => {
    const grid = cardGrid(); grid.innerHTML = ''; state.page = 1; await renderGenres(); await query(1);
  });
  await renderGenres();
  await query(1);
  setupInfiniteScroll();
}

initSearch();