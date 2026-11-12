import { MediaItem, MediaDetails, Season, Episode } from '../types';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export function getImageUrl(path: string | null | undefined, size: 'w300' | 'w500' | 'original' = 'w500'): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path: string | null | undefined): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/original${path}`;
}

export async function fetchTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page = 1) {
  const res = await fetch(`/api/tmdb/trending/${mediaType}/${timeWindow}?page=${page}`);
  if (!res.ok) throw new Error('Failed to load trending content');
  return res.json();
}

export async function fetchMovies(category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming', page = 1) {
  const res = await fetch(`/api/tmdb/movies/${category}?page=${page}`);
  if (!res.ok) throw new Error(`Failed to load ${category} movies`);
  return res.json();
}

export async function fetchTVShows(category: 'popular' | 'top_rated' | 'on_the_air' | 'airing_today', page = 1) {
  const res = await fetch(`/api/tmdb/tv/${category}?page=${page}`);
  if (!res.ok) throw new Error(`Failed to load ${category} TV shows`);
  return res.json();
}

export async function searchMedia(query: string, type: 'multi' | 'movie' | 'tv' = 'multi', page = 1) {
  if (!query.trim()) return { results: [], total_pages: 0, total_results: 0 };
  const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function fetchMovieDetails(id: number | string): Promise<MediaDetails> {
  const res = await fetch(`/api/tmdb/movie/${id}`);
  if (!res.ok) throw new Error('Movie not found or failed to load');
  const data = await res.json();
  data.media_type = 'movie';
  return data;
}

export async function fetchTVDetails(id: number | string): Promise<MediaDetails> {
  const res = await fetch(`/api/tmdb/tv/${id}`);
  if (!res.ok) throw new Error('TV show not found or failed to load');
  const data = await res.json();
  data.media_type = 'tv';
  return data;
}

export async function fetchTVSeason(tvId: number | string, seasonNumber: number): Promise<Season> {
  const res = await fetch(`/api/tmdb/tv/${tvId}/season/${seasonNumber}`);
  if (!res.ok) throw new Error('Failed to load season episodes');
  return res.json();
}

export async function fetchGenres(type: 'movie' | 'tv'): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`/api/tmdb/genres/${type}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres || [];
}

export async function discoverMedia(type: 'movie' | 'tv', params: { with_genres?: string; sort_by?: string; page?: number; year?: string }) {
  const query = new URLSearchParams();
  if (params.with_genres) query.set('with_genres', params.with_genres);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.page) query.set('page', String(params.page));
  if (params.year) query.set('year', params.year);

  const res = await fetch(`/api/tmdb/discover/${type}?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to discover content');
  return res.json();
}

// ----------------- HINDI MOVIES & WATCH PROVIDERS ----------------- //

export async function fetchHindiMovies(
  category: string = 'popular',
  page = 1,
  search = '',
  year?: string,
  with_genres?: string
) {
  const query = new URLSearchParams({
    category,
    page: String(page),
  });
  if (search.trim()) query.set('search', search.trim());
  if (year) query.set('year', year);
  if (with_genres) query.set('with_genres', with_genres);

  const res = await fetch(`/api/tmdb/hindi?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load Hindi movies');
  return res.json();
}

export async function fetchWatchProviders(movieId: number | string) {
  const res = await fetch(`/api/tmdb/movie/${movieId}/watch-providers`);
  if (!res.ok) throw new Error('Failed to load watch providers');
  return res.json();
}

export async function importHindiMovies(pages = 5) {
  const res = await fetch('/api/hindi/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages }),
  });
  if (!res.ok) throw new Error('Failed to import Hindi movies from TMDB');
  return res.json();
}

export async function fetchHindiStatus() {
  const res = await fetch('/api/hindi/status');
  if (!res.ok) throw new Error('Failed to load Hindi catalog status');
  return res.json();
}

export async function fetchPlaybackConfig() {
  const res = await fetch('/api/hindi/playback-config');
  if (!res.ok) throw new Error('Failed to load playback configuration');
  return res.json();
}

export async function updatePlaybackConfig(data: any) {
  const res = await fetch('/api/hindi/playback-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update playback configuration');
  return res.json();
}

export async function reportPlaybackFailure(data: { tmdbId: number | string; title: string; reason: string }) {
  try {
    await fetch('/api/hindi/report-playback-failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('Could not report playback failure:', e);
  }
}

export async function fetchHindiDiagnostics() {
  const res = await fetch('/api/hindi/diagnostics');
  if (!res.ok) throw new Error('Failed to fetch diagnostics');
  return res.json();
}

export async function clearHindiDiagnostics() {
  const res = await fetch('/api/hindi/diagnostics/clear', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear diagnostics');
  return res.json();
}
export async function fetchStreamingData(url: string) {
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': '739b00396emshfcf914ec2966218p150b52jsn3fa31dba9e73'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

