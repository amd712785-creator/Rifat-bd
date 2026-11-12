import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const TMDB_API_KEY = process.env.TMDB_API_KEY || '0833562f9f6489abf8f57245cdf5a702';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// In-memory cache
interface CacheEntry {
  timestamp: number;
  data: any;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchFromTMDB(endpoint: string, params: Record<string, string | number> = {}) {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ),
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${query.toString()}`;
  const cacheKey = `tmdb:${url}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TMDB Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { timestamp: now, data });
  return data;
}

// ----------------- TMDB API ROUTES ----------------- //

// Trending
app.get('/api/tmdb/trending/:mediaType/:timeWindow', async (req: Request, res: Response) => {
  try {
    const { mediaType = 'all', timeWindow = 'day' } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch trending' });
  }
});

// Movies lists
app.get('/api/tmdb/movies/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params; // popular, top_rated, now_playing, upcoming
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const data = await fetchFromTMDB(`/movie/${category}`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch movies' });
  }
});

// TV lists
app.get('/api/tmdb/tv/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params; // popular, top_rated, on_the_air, airing_today
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const data = await fetchFromTMDB(`/tv/${category}`, { page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch TV shows' });
  }
});

// Search
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    const type = (req.query.type as string) || 'multi'; // movie, tv, multi
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const endpoint = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
    const data = await fetchFromTMDB(endpoint, { query, page, include_adult: 'false' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// Movie Details
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations,reviews',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch movie details' });
  }
});

// TV Details
app.get('/api/tmdb/tv/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations,reviews',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch TV details' });
  }
});

// TV Season Details (Episodes)
app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch season details' });
  }
});

// Genres
app.get('/api/tmdb/genres/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params; // movie or tv
    const data = await fetchFromTMDB(`/genre/${type}/list`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch genres' });
  }
});

// Discover by genre/filters
app.get('/api/tmdb/discover/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params; // movie or tv
    const { with_genres, sort_by, page = '1', year } = req.query;
    const params: Record<string, any> = {
      page: parseInt(page as string, 10) || 1,
      sort_by: sort_by || 'popularity.desc',
      include_adult: 'false',
    };
    if (with_genres) params.with_genres = with_genres;
    if (year) {
      if (type === 'movie') params.primary_release_year = year;
      else params.first_air_date_year = year;
    }
    const data = await fetchFromTMDB(`/discover/${type}`, params);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to discover media' });
  }
});

// Watch Providers (JustWatch)
app.get('/api/tmdb/movie/:id/watch-providers', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDB(`/movie/${id}/watch/providers`);
    res.json({
      id: data.id,
      attribution: 'Data provided by JustWatch',
      results: data.results || {},
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch watch providers' });
  }
});

// ----------------- HINDI MOVIES CATALOG & PLAYBACK SYSTEM ----------------- //

interface HindiCatalogMovie {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  importedAt: string;
}

const hindiCatalog = new Map<number, HindiCatalogMovie>();
let hindiLastSyncTime: string | null = null;
let hindiPagesImported = 0;

interface PlaybackConfig {
  server1Enabled: boolean;
  server2Enabled: boolean;
  licensedOnlyMode: boolean;
  customStreams: Record<string, { streamUrl: string; label: string }>;
}

const playbackConfig: PlaybackConfig = {
  server1Enabled: true,
  server2Enabled: true,
  licensedOnlyMode: false,
  customStreams: {},
};

interface PlaybackFailure {
  id: string;
  tmdbId: number | string;
  title: string;
  reason: string;
  timestamp: string;
}
const failedPlaybackLogs: PlaybackFailure[] = [];

// Discover Hindi Movies with 10 exact categories & search
app.get('/api/tmdb/hindi', async (req: Request, res: Response) => {
  try {
    const {
      category = 'popular',
      page = '1',
      search = '',
      year,
      with_genres,
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const today = new Date().toISOString().split('T')[0];

    // If searching by title/keyword
    if (search && typeof search === 'string' && search.trim()) {
      const searchRes = await fetchFromTMDB('/search/movie', {
        query: search.trim(),
        page: pageNum,
        include_adult: 'false',
      });

      const hindiResults = (searchRes.results || []).filter(
        (m: any) => m.original_language === 'hi'
      );
      const finalResults = hindiResults.length > 0 ? hindiResults : searchRes.results || [];

      // Auto-cache to catalog
      for (const m of finalResults) {
        if (!hindiCatalog.has(m.id)) {
          hindiCatalog.set(m.id, {
            id: m.id,
            title: m.title,
            original_title: m.original_title,
            original_language: m.original_language,
            overview: m.overview,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            release_date: m.release_date,
            vote_average: m.vote_average,
            vote_count: m.vote_count,
            popularity: m.popularity,
            genre_ids: m.genre_ids || [],
            importedAt: new Date().toISOString(),
          });
        }
      }

      return res.json({
        page: searchRes.page,
        total_pages: searchRes.total_pages,
        total_results: searchRes.total_results,
        results: finalResults.map((m: any) => ({
          ...m,
          media_type: 'movie',
          customPlaybackUrl: playbackConfig.customStreams[String(m.id)]?.streamUrl,
          isAuthorizedPlayback: playbackConfig.server1Enabled || !!playbackConfig.customStreams[String(m.id)],
        })),
      });
    }

    const params: Record<string, any> = {
      with_original_language: 'hi',
      include_adult: 'false',
      page: pageNum,
    };

    switch (category) {
      case 'latest':
        params.sort_by = 'primary_release_date.desc';
        params['primary_release_date.lte'] = today;
        break;
      case 'popular':
        params.sort_by = 'popularity.desc';
        break;
      case 'trending':
        params.sort_by = 'popularity.desc';
        params['vote_count.gte'] = 20;
        break;
      case 'top_rated':
        params.sort_by = 'vote_average.desc';
        params['vote_count.gte'] = 50;
        break;
      case 'classic':
        params['primary_release_date.lte'] = '1999-12-31';
        params.sort_by = 'vote_average.desc';
        params['vote_count.gte'] = 25;
        break;
      case 'action':
        params.with_genres = '28';
        params.sort_by = 'popularity.desc';
        break;
      case 'comedy':
        params.with_genres = '35';
        params.sort_by = 'popularity.desc';
        break;
      case 'romance':
        params.with_genres = '10749';
        params.sort_by = 'popularity.desc';
        break;
      case 'thriller':
        params.with_genres = '53';
        params.sort_by = 'popularity.desc';
        break;
      case 'drama':
        params.with_genres = '18';
        params.sort_by = 'popularity.desc';
        break;
      default:
        params.sort_by = 'popularity.desc';
        break;
    }

    if (year) params.primary_release_year = year;
    if (with_genres) params.with_genres = with_genres;

    const data = await fetchFromTMDB('/discover/movie', params);

    // Cache unique movies into hindiCatalog
    if (Array.isArray(data.results)) {
      for (const m of data.results) {
        if (!hindiCatalog.has(m.id)) {
          hindiCatalog.set(m.id, {
            id: m.id,
            title: m.title,
            original_title: m.original_title,
            original_language: m.original_language,
            overview: m.overview,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            release_date: m.release_date,
            vote_average: m.vote_average,
            vote_count: m.vote_count,
            popularity: m.popularity,
            genre_ids: m.genre_ids || [],
            importedAt: new Date().toISOString(),
          });
        }
      }
    }

    const enrichedResults = (data.results || []).map((m: any) => ({
      ...m,
      media_type: 'movie',
      customPlaybackUrl: playbackConfig.customStreams[String(m.id)]?.streamUrl,
      isAuthorizedPlayback: playbackConfig.server1Enabled || !!playbackConfig.customStreams[String(m.id)],
    }));

    res.json({
      ...data,
      results: enrichedResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to discover Hindi movies' });
  }
});

// Batch / Auto-Discovery Importer from TMDB
app.post('/api/hindi/import', async (req: Request, res: Response) => {
  try {
    const pages = Math.min(Math.max(parseInt(req.body.pages, 10) || 5, 1), 25);
    let newImportedCount = 0;

    for (let p = 1; p <= pages; p++) {
      const data = await fetchFromTMDB('/discover/movie', {
        with_original_language: 'hi',
        sort_by: 'popularity.desc',
        page: p,
      });

      if (Array.isArray(data.results)) {
        for (const m of data.results) {
          if (!hindiCatalog.has(m.id)) {
            newImportedCount++;
            hindiCatalog.set(m.id, {
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              original_language: m.original_language,
              overview: m.overview,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              release_date: m.release_date,
              vote_average: m.vote_average,
              vote_count: m.vote_count,
              popularity: m.popularity,
              genre_ids: m.genre_ids || [],
              importedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    hindiPagesImported = Math.max(hindiPagesImported, pages);
    hindiLastSyncTime = new Date().toISOString();

    res.json({
      success: true,
      pagesImported: pages,
      newImportedCount,
      totalCatalogSize: hindiCatalog.size,
      lastSyncTime: hindiLastSyncTime,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import Hindi movies' });
  }
});

// Local Hindi Catalog
app.get('/api/hindi/catalog', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const genre = req.query.genre ? parseInt(req.query.genre as string, 10) : null;

    let movies = Array.from(hindiCatalog.values());

    if (search) {
      movies = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(search) ||
          m.original_title.toLowerCase().includes(search) ||
          m.overview.toLowerCase().includes(search)
      );
    }

    if (genre) {
      movies = movies.filter((m) => m.genre_ids?.includes(genre));
    }

    const totalResults = movies.length;
    const totalPages = Math.ceil(totalResults / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pageItems = movies.slice(startIndex, startIndex + limit).map((m) => ({
      ...m,
      media_type: 'movie',
      customPlaybackUrl: playbackConfig.customStreams[String(m.id)]?.streamUrl,
      isAuthorizedPlayback: playbackConfig.server1Enabled || !!playbackConfig.customStreams[String(m.id)],
    }));

    res.json({
      page,
      total_pages: totalPages,
      total_results: totalResults,
      results: pageItems,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get catalog' });
  }
});

// Hindi Catalog Status
app.get('/api/hindi/status', (_req: Request, res: Response) => {
  res.json({
    totalMovies: hindiCatalog.size,
    lastSyncTime: hindiLastSyncTime,
    pagesImported: hindiPagesImported,
    activePlaybackSources: {
      server1Enabled: playbackConfig.server1Enabled,
      server2Enabled: playbackConfig.server2Enabled,
      licensedOnlyMode: playbackConfig.licensedOnlyMode,
      customStreamsCount: Object.keys(playbackConfig.customStreams).length,
    },
    failedPlaybackCount: failedPlaybackLogs.length,
  });
});

// Playback Sources Config
app.get('/api/hindi/playback-config', (_req: Request, res: Response) => {
  res.json(playbackConfig);
});

app.post('/api/hindi/playback-config', (req: Request, res: Response) => {
  try {
    const { server1Enabled, server2Enabled, licensedOnlyMode, customStreams } = req.body;
    if (typeof server1Enabled === 'boolean') playbackConfig.server1Enabled = server1Enabled;
    if (typeof server2Enabled === 'boolean') playbackConfig.server2Enabled = server2Enabled;
    if (typeof licensedOnlyMode === 'boolean') playbackConfig.licensedOnlyMode = licensedOnlyMode;
    if (customStreams && typeof customStreams === 'object') {
      playbackConfig.customStreams = { ...playbackConfig.customStreams, ...customStreams };
    }
    res.json({ success: true, config: playbackConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update playback config' });
  }
});

// Client Playback Failure Reporting (Feeds Admin Diagnostics)
app.post('/api/hindi/report-playback-failure', (req: Request, res: Response) => {
  try {
    const { tmdbId, title, reason } = req.body;
    if (!tmdbId) return res.status(400).json({ error: 'Missing tmdbId' });
    const log: PlaybackFailure = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tmdbId,
      title: title || 'Unknown Title',
      reason: reason || 'Playback stream connection error',
      timestamp: new Date().toISOString(),
    };
    failedPlaybackLogs.unshift(log);
    if (failedPlaybackLogs.length > 100) failedPlaybackLogs.pop();
    res.json({ success: true, logged: log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Diagnostics API for Admin Dashboard
app.get('/api/hindi/diagnostics', (_req: Request, res: Response) => {
  res.json({
    catalogCount: hindiCatalog.size,
    pagesImported: hindiPagesImported,
    lastSyncTime: hindiLastSyncTime,
    playbackConfig,
    failedPlaybackLogs,
  });
});

// Clear failed playback logs (Admin)
app.post('/api/hindi/diagnostics/clear', (_req: Request, res: Response) => {
  failedPlaybackLogs.length = 0;
  res.json({ success: true, message: 'Diagnostics cleared' });
});

// Pre-warm Hindi movie catalog from TMDB
async function preWarmHindiCatalog() {
  try {
    console.log('Pre-warming Hindi movies catalog from TMDB...');
    for (let p = 1; p <= 5; p++) {
      const data = await fetchFromTMDB('/discover/movie', {
        with_original_language: 'hi',
        sort_by: 'popularity.desc',
        page: p,
      });
      if (Array.isArray(data.results)) {
        for (const m of data.results) {
          if (!hindiCatalog.has(m.id)) {
            hindiCatalog.set(m.id, {
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              original_language: m.original_language,
              overview: m.overview,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              release_date: m.release_date,
              vote_average: m.vote_average,
              vote_count: m.vote_count,
              popularity: m.popularity,
              genre_ids: m.genre_ids || [],
              importedAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    hindiPagesImported = 5;
    hindiLastSyncTime = new Date().toISOString();
    console.log(`Pre-warmed ${hindiCatalog.size} Hindi movies into catalog.`);
  } catch (err) {
    console.warn('Initial Hindi catalog pre-warming failed:', err);
  }
}

// Scheduled catalog refresh every 6 hours
setInterval(async () => {
  console.log('Running scheduled Hindi movies catalog refresh...');
  await preWarmHindiCatalog();
}, 6 * 60 * 60 * 1000);

preWarmHindiCatalog().catch((e) => console.warn('Pre-warm error:', e));

// ----------------- LIVE TV (IPTV-ORG) ROUTES ----------------- //

interface ChannelData {
  id: string;
  name: string;
  country: string;
  countryName: string;
  countryFlag: string;
  category: string;
  logo: string;
  streamUrl: string;
  quality?: string | null;
}

interface IptvDiagnosticsData {
  channelsApiStatus: number;
  streamsApiStatus: number;
  logosApiStatus: number;
  countriesApiStatus: number;
  categoriesApiStatus: number;
  totalChannelRecords: number;
  totalStreamRecords: number;
  totalLogoRecords: number;
  matchedChannelCount: number;
  channelsWithPlayableFormat: number;
  failedRequestsCount: number;
  lastUpdated: string;
  errors: string[];
  endpointUrls: {
    channels: string;
    streams: string;
    logos: string;
    countries: string;
    categories: string;
    playlist: string;
  };
}

let iptvChannelsCache: ChannelData[] | null = null;
let iptvCategoriesCache: string[] = [];
let iptvCountriesCache: { code: string; name: string; flag?: string }[] = [];
let iptvCacheTimestamp = 0;
const IPTV_TTL = 30 * 60 * 1000; // 30 minutes

let iptvDiagnostics: IptvDiagnosticsData = {
  channelsApiStatus: 0,
  streamsApiStatus: 0,
  logosApiStatus: 0,
  countriesApiStatus: 0,
  categoriesApiStatus: 0,
  totalChannelRecords: 0,
  totalStreamRecords: 0,
  totalLogoRecords: 0,
  matchedChannelCount: 0,
  channelsWithPlayableFormat: 0,
  failedRequestsCount: 0,
  lastUpdated: '',
  errors: [],
  endpointUrls: {
    channels: 'https://iptv-org.github.io/api/channels.json',
    streams: 'https://iptv-org.github.io/api/streams.json',
    logos: 'https://iptv-org.github.io/api/logos.json',
    countries: 'https://iptv-org.github.io/api/countries.json',
    categories: 'https://iptv-org.github.io/api/categories.json',
    playlist: 'https://iptv-org.github.io/iptv/index.m3u',
  },
};

async function loadIptvData(forceRefresh = false): Promise<ChannelData[]> {
  const now = Date.now();
  if (!forceRefresh && iptvChannelsCache && now - iptvCacheTimestamp < IPTV_TTL) {
    return iptvChannelsCache;
  }

  const errors: string[] = [];
  try {
    const fetchWithMeta = async (url: string) => {
      try {
        const res = await fetch(url);
        return { ok: res.ok, status: res.status, json: res.ok ? await res.json() : [] };
      } catch (err: any) {
        errors.push(`Failed to fetch ${url}: ${err.message}`);
        return { ok: false, status: 0, json: [] };
      }
    };

    const [channelsRes, streamsRes, logosRes, countriesRes, categoriesRes] = await Promise.all([
      fetchWithMeta(iptvDiagnostics.endpointUrls.channels),
      fetchWithMeta(iptvDiagnostics.endpointUrls.streams),
      fetchWithMeta(iptvDiagnostics.endpointUrls.logos),
      fetchWithMeta(iptvDiagnostics.endpointUrls.countries),
      fetchWithMeta(iptvDiagnostics.endpointUrls.categories),
    ]);

    iptvDiagnostics.channelsApiStatus = channelsRes.status;
    iptvDiagnostics.streamsApiStatus = streamsRes.status;
    iptvDiagnostics.logosApiStatus = logosRes.status;
    iptvDiagnostics.countriesApiStatus = countriesRes.status;
    iptvDiagnostics.categoriesApiStatus = categoriesRes.status;

    const channels: any[] = channelsRes.json || [];
    const streams: any[] = streamsRes.json || [];
    const logos: any[] = logosRes.json || [];
    const countries: any[] = countriesRes.json || [];
    const categories: any[] = categoriesRes.json || [];

    iptvDiagnostics.totalChannelRecords = channels.length;
    iptvDiagnostics.totalStreamRecords = streams.length;
    iptvDiagnostics.totalLogoRecords = logos.length;
    if (channelsRes.status !== 200 || streamsRes.status !== 200) {
      iptvDiagnostics.failedRequestsCount += 1;
    }

    // 1. Map logos by channel ID: logos.channel === channels.id
    const logoMap = new Map<string, string>();
    for (const l of logos) {
      if (l.channel && l.url && (!logoMap.has(l.channel) || l.in_use)) {
        logoMap.set(l.channel, l.url);
      }
    }

    // 2. Map streams by channel ID: streams.channel === channels.id
    const streamMap = new Map<string, { url: string; quality?: string | null }>();
    for (const s of streams) {
      if (s.channel && s.url && s.url.startsWith('http') && !streamMap.has(s.channel)) {
        streamMap.set(s.channel, { url: s.url, quality: s.quality || null });
      }
    }

    // 3. Map countries by code
    const countryMap = new Map<string, { name: string; code: string; flag?: string }>();
    for (const c of countries) {
      countryMap.set(c.code, { name: c.name, code: c.code, flag: c.flag || '' });
    }

    // 4. Curated top verified channels
    const curated: ChannelData[] = [
      {
        id: 'NASATVMedia.us',
        name: 'NASA TV HD',
        country: 'US',
        countryName: 'United States',
        countryFlag: '🇺🇸',
        category: 'science',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
        streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
        quality: '1080p',
      },
      {
        id: 'DWEnglish.de',
        name: 'DW News (English)',
        country: 'DE',
        countryName: 'Germany',
        countryFlag: '🇩🇪',
        category: 'news',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Deutsche_Welle_symbol_2012.svg',
        streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
        quality: '720p',
      },
    ];

    const compiled: ChannelData[] = [];
    const catSet = new Set<string>();
    const countryListMap = new Map<string, { code: string; name: string; flag?: string }>();

    // Add curated verified streams
    for (const cur of curated) {
      compiled.push(cur);
      catSet.add(cur.category);
      countryListMap.set(cur.country, { code: cur.country, name: cur.countryName, flag: cur.countryFlag });
    }

    // Join channels with streams and logos
    for (const c of channels) {
      const stream = streamMap.get(c.id);
      if (stream && c.name && !c.is_nsfw) {
        const cat = (c.categories && c.categories[0]) || 'general';
        catSet.add(cat);

        const countryInfo = countryMap.get(c.country);
        const countryName = countryInfo ? countryInfo.name : c.country || 'Global';
        const countryFlag = countryInfo?.flag || '';

        if (c.country) {
          countryListMap.set(c.country, {
            code: c.country,
            name: countryName,
            flag: countryFlag,
          });
        }

        compiled.push({
          id: c.id,
          name: c.name,
          country: c.country || 'Global',
          countryName,
          countryFlag,
          category: cat,
          logo: logoMap.get(c.id) || '',
          streamUrl: stream.url,
          quality: stream.quality,
        });
      }
    }

    iptvChannelsCache = compiled;
    iptvCategoriesCache = Array.from(catSet).sort();
    
    // Sort countries alphabetically by name, ensuring Bangladesh (BD) and USA are prominent
    iptvCountriesCache = Array.from(countryListMap.values()).sort((a, b) => {
      if (a.code === 'BD') return -1;
      if (b.code === 'BD') return 1;
      return a.name.localeCompare(b.name);
    });

    iptvCacheTimestamp = now;

    // Update diagnostics
    iptvDiagnostics.matchedChannelCount = compiled.length;
    iptvDiagnostics.channelsWithPlayableFormat = compiled.filter((c) =>
      c.streamUrl.includes('.m3u8') || c.streamUrl.includes('.mpd') || c.streamUrl.startsWith('http')
    ).length;
    iptvDiagnostics.lastUpdated = new Date().toISOString();
    iptvDiagnostics.errors = errors;

    return compiled;
  } catch (error: any) {
    console.error('Error in loadIptvData:', error);
    iptvDiagnostics.errors.push(error.message || String(error));
    if (iptvChannelsCache) return iptvChannelsCache;
    return [];
  }
}

// Pre-warm IPTV cache on boot
loadIptvData().catch((err) => console.warn('Pre-warming IPTV data failed:', err));

// Live stream proxy for CORS compliance
app.get('/api/livetv/proxy', async (req: Request, res: Response) => {
  try {
    const streamUrl = req.query.url as string;
    if (!streamUrl || !streamUrl.startsWith('http')) {
      return res.status(400).send('Invalid stream URL');
    }

    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).send('Remote stream failed');
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const text = await response.text();
    if (text.includes('#EXTM3U')) {
      const parsedBase = new URL(response.url || streamUrl);
      const baseUrl = parsedBase.origin + parsedBase.pathname.substring(0, parsedBase.pathname.lastIndexOf('/') + 1);

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
          if (trimmed.startsWith('/')) return `${parsedBase.origin}${trimmed}`;
          return `${baseUrl}${trimmed}`;
        })
        .join('\n');

      return res.send(rewritten);
    }

    res.send(text);
  } catch (err: any) {
    res.status(502).send(err.message || 'Stream proxy error');
  }
});

// Diagnostics endpoint (Admin)
app.get('/api/livetv/diagnostics', async (_req: Request, res: Response) => {
  if (!iptvChannelsCache) {
    await loadIptvData();
  }
  res.json(iptvDiagnostics);
});

// Force refresh endpoint
app.post('/api/livetv/refresh', async (_req: Request, res: Response) => {
  try {
    const channels = await loadIptvData(true);
    res.json({ success: true, count: channels.length, diagnostics: iptvDiagnostics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to refresh IPTV data' });
  }
});

app.get('/api/livetv/channels', async (req: Request, res: Response) => {
  try {
    const { country, category, search, page = '1', limit = '30' } = req.query;
    const channels = await loadIptvData();

    let filtered = channels;

    if (country && country !== 'all') {
      const targetCountry = (country as string).toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.country.toLowerCase() === targetCountry ||
          (c.countryName && c.countryName.toLowerCase() === targetCountry)
      );
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(
        (c) => c.category.toLowerCase() === (category as string).toLowerCase()
      );
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 30, 100);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const items = filtered.slice(start, start + limitNum);

    res.json({
      page: pageNum,
      totalPages,
      totalResults: total,
      results: items,
      categories: iptvCategoriesCache,
      countries: iptvCountriesCache,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load live TV channels' });
  }
});

// Config for Player Servers
app.get('/api/config/player-servers', (_req: Request, res: Response) => {
  res.json({
    servers: [
      {
        id: 'server1',
        name: 'Server 1',
        description: 'CineSrc Fast CDN (Embed & Multi-Source)',
        isDefault: true,
      },
      {
        id: 'server2',
        name: 'Server 2',
        description: 'Cloud Mirror (Alternate Playback Stream)',
        isDefault: false,
      },
    ],
  });
});

// Vite Middleware for Development / Static serve for Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MovieNest server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
