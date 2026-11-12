import React, { useState, useEffect } from 'react';
import { Search, Compass, Filter, Loader2, Sparkles } from 'lucide-react';
import { MediaCard } from '../media/MediaCard';
import { MediaItem } from '../../types';
import { searchMedia, fetchGenres, discoverMedia } from '../../services/tmdb';
import { useAuth } from '../../context/AuthContext';
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
} from '../../services/firestore';

interface ExploreViewProps {
  initialQuery?: string;
  onSelectMedia: (item: MediaItem) => void;
  onWatchMedia: (item: MediaItem) => void;
  onRequireAuth: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  initialQuery = '',
  onSelectMedia,
  onWatchMedia,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [mediaType, setMediaType] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  // Load genres
  useEffect(() => {
    fetchGenres('movie').then(setGenres).catch(console.error);
  }, []);

  // Sync initial query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Load watchlist
  useEffect(() => {
    if (user) {
      getUserWatchlist(user.uid).then((items) => {
        setWatchlistIds(new Set(items.map((i) => `${i.mediaType}_${i.mediaId}`)));
      });
    }
  }, [user]);

  // Debounced search or discover
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        let items: MediaItem[] = [];
        if (query.trim()) {
          const res = await searchMedia(query.trim(), mediaType, 1);
          items = (res.results || []).filter(
            (i: any) => i.poster_path && (i.title || i.name)
          );
        } else if (selectedGenre) {
          const type = mediaType === 'tv' ? 'tv' : 'movie';
          const res = await discoverMedia(type, {
            with_genres: String(selectedGenre),
            sort_by: 'popularity.desc',
          });
          items = (res.results || []).map((i: any) => ({ ...i, media_type: type }));
        } else {
          // Default trending discover
          const res = await searchMedia('action', 'movie', 1);
          items = (res.results || []).filter((i: any) => i.poster_path);
        }

        if (mounted) {
          setResults(items);
        }
      } catch (err) {
        console.error('Explore search error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [query, mediaType, selectedGenre]);

  const handleToggleWatchlist = async (item: MediaItem) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const type = item.media_type || (mediaType === 'tv' ? 'tv' : 'movie');
    const key = `${type}_${item.id}`;
    const inList = watchlistIds.has(key);

    try {
      if (inList) {
        await removeFromWatchlist(user.uid, type, String(item.id));
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        await addToWatchlist({
          userId: user.uid,
          mediaId: String(item.id),
          mediaType: type,
          title: item.title || item.name || 'Untitled',
          posterPath: item.poster_path,
          voteAverage: item.vote_average || 0,
          releaseDate: item.release_date || item.first_air_date,
        });
        setWatchlistIds((prev) => new Set(prev).add(key));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Search Header */}
      <div className="ios-glass p-6 sm:p-7 rounded-3xl border border-white/15 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl ios-glass border border-white/20 flex items-center justify-center text-red-500 shadow-sm">
              <Compass className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Search & Explore</h1>
              <p className="text-xs text-neutral-300/80">
                Instantly search TMDB's official global catalog
              </p>
            </div>
          </div>

          {/* Media Type Filter */}
          <div className="flex ios-glass rounded-2xl p-1 border border-white/10 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setMediaType('multi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                mediaType === 'multi' ? 'ios-pill-active text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaType('movie')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                mediaType === 'movie' ? 'ios-pill-active text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                mediaType === 'tv' ? 'ios-pill-active text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Type a movie title, actor, director, or TV show..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedGenre(null);
            }}
            className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-4 py-3.5 pl-12 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] shadow-inner transition"
          />
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-4" />
        </div>

        {/* Genre Tags Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {genres.map((g) => {
            const isSelected = selectedGenre === g.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGenre(isSelected ? null : g.id);
                  setQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'ios-pill-active text-white font-bold shadow-md'
                    : 'ios-glass text-neutral-300 border border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl sm:rounded-2xl ios-skeleton border border-white/10" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
          {results.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onSelect={onSelectMedia}
              onWatch={onWatchMedia}
              onToggleWatchlist={handleToggleWatchlist}
              isInWatchlist={watchlistIds.has(
                `${item.media_type || (mediaType === 'tv' ? 'tv' : 'movie')}_${item.id}`
              )}
            />
          ))}
        </div>
      ) : (
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-center p-6 text-neutral-400">
          <p className="text-sm font-semibold">No titles found matching your search.</p>
          <p className="text-xs text-neutral-500 mt-1">
            Check the spelling or try selecting a genre chip above.
          </p>
        </div>
      )}
    </div>
  );
};
