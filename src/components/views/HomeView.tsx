import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../media/HeroBanner';
import { MediaCard } from '../media/MediaCard';
import { MediaItem } from '../../types';
import { fetchTrending, fetchMovies, fetchTVShows } from '../../services/tmdb';
import { useAuth } from '../../context/AuthContext';
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
} from '../../services/firestore';
import { ChevronRight, Flame, TrendingUp, Star, Film, Tv, Sparkles, Loader2 } from 'lucide-react';

interface HomeViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onWatchMedia: (item: MediaItem) => void;
  onNavigate: (tab: string, meta?: any) => void;
  onRequireAuth: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMedia,
  onWatchMedia,
  onNavigate,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [upcoming, setUpcoming] = useState<MediaItem[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadContent = async () => {
      setLoading(true);
      try {
        const [trendData, popMoviesData, popTvData, topRatedData, upcomingData] =
          await Promise.all([
            fetchTrending('all', 'day'),
            fetchMovies('popular', 1),
            fetchTVShows('popular', 1),
            fetchMovies('top_rated', 1),
            fetchMovies('upcoming', 1),
          ]);

        if (!mounted) return;
        setTrending(trendData.results || []);
        setPopularMovies(
          (popMoviesData.results || []).map((m: any) => ({ ...m, media_type: 'movie' }))
        );
        setPopularTV(
          (popTvData.results || []).map((t: any) => ({ ...t, media_type: 'tv' }))
        );
        setTopRated(
          (topRatedData.results || []).map((m: any) => ({ ...m, media_type: 'movie' }))
        );
        setUpcoming(
          (upcomingData.results || []).map((u: any) => ({ ...u, media_type: 'movie' }))
        );

        if (user) {
          const wList = await getUserWatchlist(user.uid);
          if (mounted) {
            setWatchlistIds(new Set(wList.map((i) => `${i.mediaType}_${i.mediaId}`)));
          }
        }
      } catch (err) {
        console.error('Failed to load home view feeds', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadContent();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleToggleWatchlist = async (item: MediaItem) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const mediaType = item.media_type || 'movie';
    const key = `${mediaType}_${item.id}`;
    const inList = watchlistIds.has(key);

    try {
      if (inList) {
        await removeFromWatchlist(user.uid, mediaType, String(item.id));
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        await addToWatchlist({
          userId: user.uid,
          mediaId: String(item.id),
          mediaType,
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

  if (loading) {
    return (
      <div className="space-y-8 animate-ios-fade-up">
        {/* Hero Banner iOS Skeleton */}
        <div className="w-full min-h-[460px] sm:min-h-[500px] rounded-3xl ios-skeleton border border-white/10" />

        {/* Section Cards iOS Skeleton */}
        <div className="space-y-4">
          <div className="w-44 h-6 rounded-xl ios-skeleton" />
          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl sm:rounded-2xl ios-skeleton border border-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderSection = (
    title: string,
    items: MediaItem[],
    icon: React.ReactNode,
    exploreTab?: string
  ) => (
    <section className="space-y-4 animate-ios-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl ios-glass border border-white/15 shadow-sm">
            {icon}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        {exploreTab && (
          <button
            onClick={() => onNavigate(exploreTab)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full ios-glass text-xs font-semibold text-white/80 hover:text-white border border-white/10 hover:border-white/25 transition active:scale-95"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
        {items.slice(0, 8).map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={onSelectMedia}
            onWatch={onWatchMedia}
            onToggleWatchlist={handleToggleWatchlist}
            isInWatchlist={watchlistIds.has(`${item.media_type || 'movie'}_${item.id}`)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      {/* Featured Hero Banner */}
      <HeroBanner
        items={trending}
        onWatch={onWatchMedia}
        onMoreInfo={onSelectMedia}
        onToggleWatchlist={handleToggleWatchlist}
        isInWatchlist={
          trending[0]
            ? watchlistIds.has(`${trending[0].media_type || 'movie'}_${trending[0].id}`)
            : false
        }
      />

      {/* Row: Trending Movies & TV */}
      {renderSection(
        'Trending This Week',
        trending,
        <Flame className="w-5 h-5 text-red-500" />,
        'explore'
      )}

      {/* Row: Popular Movies */}
      {renderSection(
        'Blockbuster Movies',
        popularMovies,
        <Film className="w-5 h-5 text-red-500" />,
        'movies'
      )}

      {/* Row: Popular TV Shows */}
      {renderSection(
        'Popular TV Series',
        popularTV,
        <Tv className="w-5 h-5 text-red-500" />,
        'tv'
      )}

      {/* Row: Top Rated */}
      {renderSection(
        'Top Rated Masterpieces',
        topRated,
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
        'movies'
      )}

      {/* Row: Recently Released & Upcoming */}
      {renderSection(
        'Coming Soon to Theaters & Digital',
        upcoming,
        <Sparkles className="w-5 h-5 text-red-400" />,
        'movies'
      )}
    </div>
  );
};
