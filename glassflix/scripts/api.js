import { TMDB_API_KEY, TMDB_V4_TOKEN, TMDB_IMG_BASE } from './config.js';
import { cachedFetchJson } from './cache.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function authHeaders() {
  const h = { 'Accept': 'application/json' };
  if (TMDB_V4_TOKEN && TMDB_V4_TOKEN !== '') h['Authorization'] = `Bearer ${TMDB_V4_TOKEN}`;
  return h;
}

function withKey(url) {
  if (TMDB_V4_TOKEN && TMDB_V4_TOKEN !== '') return url; // using v4 bearer
  const u = new URL(url);
  u.searchParams.set('api_key', TMDB_API_KEY);
  return u.toString();
}

export function imgPath(path, size = 'w500') {
  if (!path) return '';
  return `${TMDB_IMG_BASE}${size}${path}`;
}

export async function getTrending() {
  const url = withKey(`${TMDB_BASE}/trending/all/day`);
  return cachedFetchJson('trending_all_day', url, { headers: authHeaders() }, 1000 * 60 * 10);
}

export async function getNowPlaying() {
  const url = withKey(`${TMDB_BASE}/movie/now_playing`);
  return cachedFetchJson('movie_now_playing', url, { headers: authHeaders() }, 1000 * 60 * 5);
}

export async function getOnTheAir() {
  const url = withKey(`${TMDB_BASE}/tv/on_the_air`);
  return cachedFetchJson('tv_on_the_air', url, { headers: authHeaders() }, 1000 * 60 * 5);
}

export async function searchMulti(query, page = 1) {
  const url = withKey(`${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);
  return cachedFetchJson(`search_multi_${query}_${page}`, url, { headers: authHeaders() }, 1000 * 60 * 2);
}

export async function discoverMovies(params) {
  const url = new URL(`${TMDB_BASE}/discover/movie`);
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v); });
  return cachedFetchJson(`discover_movie_${url.search}`, withKey(url.toString()), { headers: authHeaders() }, 1000 * 60 * 5);
}

export async function discoverTV(params) {
  const url = new URL(`${TMDB_BASE}/discover/tv`);
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v); });
  return cachedFetchJson(`discover_tv_${url.search}`, withKey(url.toString()), { headers: authHeaders() }, 1000 * 60 * 5);
}

export async function getMovieDetails(id) {
  const url = withKey(`${TMDB_BASE}/movie/${id}?append_to_response=credits,recommendations,similar,images,videos`);
  return cachedFetchJson(`movie_${id}`, url, { headers: authHeaders() }, 1000 * 60 * 30);
}

export async function getTVDetails(id) {
  const url = withKey(`${TMDB_BASE}/tv/${id}?append_to_response=aggregate_credits,recommendations,similar,images,videos`);
  return cachedFetchJson(`tv_${id}`, url, { headers: authHeaders() }, 1000 * 60 * 30);
}

export async function getGenres() {
  const [movie, tv] = await Promise.all([
    cachedFetchJson('genres_movie', withKey(`${TMDB_BASE}/genre/movie/list`), { headers: authHeaders() }, 1000 * 60 * 60 * 24),
    cachedFetchJson('genres_tv', withKey(`${TMDB_BASE}/genre/tv/list`), { headers: authHeaders() }, 1000 * 60 * 60 * 24)
  ]);
  return { movie: movie.genres || [], tv: tv.genres || [] };
}