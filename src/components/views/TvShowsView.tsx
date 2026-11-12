import React, { useState, useEffect } from 'react';
import { Tv, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { MediaCard } from '../media/MediaCard';
import { MediaItem } from '../../types';
import { fetchTVShows, fetchGenres, discoverMedia } from '../../services/tmdb';
import { useAuth } from '../../context/AuthContext';
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
} from '../../services/firestore';

interface TvShowsViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onWatchMedia: (item: MediaItem) => void;
  onRequireAuth: () => void;
}

export const TvShowsView: React.FC<TvShowsViewProps> = ({
  onSelectMedia,
  onWatchMedia,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<'popular' | 'top_rated' | 'on_the_air' | 'airing_today'>(
    'popular'
  );
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tvShows, setTvShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  // Load TV genres
  useEffect(() => {
    fetchGenres('tv').then(setGenres).catch(console.error);
  }, []);

  // Load content
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedGenre) {
          data = await discoverMedia('tv', {
            with_genres: selectedGenre,
            page,
            sort_by: category === 'top_rated' ? 'vote_average.desc' : 'popularity.desc',
          });
        } else {
          data = await fetchTVShows(category, page);
        }

        if (!mounted) return;
        setTvShows((data.results || []).map((t: any) => ({ ...t, media_type: 'tv' })));
        setTotalPages(Math.min(data.total_pages || 1, 50));

        if (user) {
          const wList = await getUserWatchlist(user.uid);
          if (mounted) {
            setWatchlistIds(new Set(wList.map((i) => `tv_${i.mediaId}`)));
          }
        }
      } catch (err) {
        console.error('Error fetching TV shows', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [category, selectedGenre, page, user]);

  const handleToggleWatchlist = async (item: MediaItem) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const key = `tv_${item.id}`;
    const inList = watchlistIds.has(key);

    try {
      if (inList) {
        await removeFromWatchlist(user.uid, 'tv', String(item.id));
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        await addToWatchlist({
          userId: user.uid,
          mediaId: String(item.id),
          mediaType: 'tv',
          title: item.name || item.title || 'Untitled',
          posterPath: item.poster_path,
          voteAverage: item.vote_average || 0,
          releaseDate: item.first_air_date,
        });
        setWatchlistIds((prev) => new Set(prev).add(key));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ios-glass p-4 sm:p-5 rounded-3xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl ios-glass border border-white/20 flex items-center justify-center text-red-500 shadow-sm">
            <Tv className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">TV Shows & Series</h1>
            <p className="text-xs text-neutral-300/80">
              Binge full seasons, episodes, and trending broadcast television
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Tabs */}
          <div className="flex ios-glass rounded-2xl p-1 border border-white/10 shadow-inner">
            {[
              { id: 'popular', label: 'Popular' },
              { id: 'top_rated', label: 'Top Rated' },
              { id: 'on_the_air', label: 'On Air' },
              { id: 'airing_today', label: 'Today' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id as any);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  category === cat.id
                    ? 'ios-pill-active text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Genre Dropdown */}
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setPage(1);
            }}
            className="ios-glass border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500/80 cursor-pointer"
          >
            <option value="" className="bg-[#12131e] text-white">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id} className="bg-[#12131e] text-white">
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl sm:rounded-2xl ios-skeleton border border-white/10" />
          ))}
        </div>
      ) : tvShows.length > 0 ? (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
          {tvShows.map((s) => (
            <MediaCard
              key={s.id}
              item={s}
              mediaType="tv"
              onSelect={onSelectMedia}
              onWatch={onWatchMedia}
              onToggleWatchlist={handleToggleWatchlist}
              isInWatchlist={watchlistIds.has(`tv_${s.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 text-neutral-400">
          <p className="text-sm font-semibold">No TV shows found matching selected filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-full ios-glass border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-neutral-400 font-medium px-3 py-1.5 rounded-full ios-glass border border-white/10">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-full ios-glass border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
