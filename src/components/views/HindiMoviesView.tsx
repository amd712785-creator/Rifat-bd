import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  TrendingUp,
  Award,
  History,
  Sword,
  Smile,
  Heart,
  Skull,
  Theater,
  Search,
  Filter,
  Play,
  Info,
  Calendar,
  Star,
  Loader2,
  AlertCircle,
  Film,
  Globe,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { MediaItem, HindiCategoryKey } from '../../types';
import { fetchHindiMovies, getImageUrl, getBackdropUrl } from '../../services/tmdb';
import { WatchProvidersModal } from '../media/WatchProvidersModal';

interface HindiMoviesViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onWatchMedia: (item: MediaItem) => void;
  onRequireAuth: () => void;
}

interface CategoryOption {
  key: HindiCategoryKey;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const HINDI_CATEGORIES: CategoryOption[] = [
  {
    key: 'popular',
    label: 'Popular Hindi',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    description: 'Most-watched Hindi blockbusters and viral sensations',
  },
  {
    key: 'latest',
    label: 'Latest Hindi',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    description: 'Fresh cinematic releases and new theatrical debuts',
  },
  {
    key: 'trending',
    label: 'Trending Now',
    icon: <TrendingUp className="w-4 h-4 text-red-500" />,
    description: 'Currently accelerating viewership across audiences',
  },
  {
    key: 'top_rated',
    label: 'Top Rated',
    icon: <Award className="w-4 h-4 text-yellow-400" />,
    description: 'Critically acclaimed masterpieces with top audience scores',
  },
  {
    key: 'classic',
    label: 'Golden Classics',
    icon: <History className="w-4 h-4 text-amber-600" />,
    description: 'Legendary Bollywood era before 2000 (Sholay, DDLJ, etc.)',
  },
  {
    key: 'action',
    label: 'Hindi Action',
    icon: <Sword className="w-4 h-4 text-rose-500" />,
    description: 'High-octane stunts, cop universe, and explosive thrillers',
  },
  {
    key: 'comedy',
    label: 'Hindi Comedy',
    icon: <Smile className="w-4 h-4 text-yellow-300" />,
    description: 'Laugh-out-loud family comedies and iconic slapstick',
  },
  {
    key: 'romance',
    label: 'Hindi Romance',
    icon: <Heart className="w-4 h-4 text-pink-500" />,
    description: 'Passionate love stories, timeless musical romances',
  },
  {
    key: 'thriller',
    label: 'Hindi Thriller',
    icon: <Skull className="w-4 h-4 text-purple-400" />,
    description: 'Edge-of-the-seat mysteries, suspense, and dark noir',
  },
  {
    key: 'drama',
    label: 'Hindi Drama',
    icon: <Theater className="w-4 h-4 text-cyan-400" />,
    description: 'Emotional narratives, biographical epics, and social stories',
  },
];

export const HindiMoviesView: React.FC<HindiMoviesViewProps> = ({
  onSelectMedia,
  onWatchMedia,
  onRequireAuth,
}) => {
  const [activeCategory, setActiveCategory] = useState<HindiCategoryKey>('popular');
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Watch Providers Modal
  const [providerModalMovie, setProviderModalMovie] = useState<{ id: number; title: string } | null>(
    null
  );

  // Featured Hero movie
  const [featuredMovie, setFeaturedMovie] = useState<MediaItem | null>(null);

  // Fetch Hindi movies
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchHindiMovies(activeCategory, page, submittedSearch, yearFilter || undefined)
      .then((data) => {
        if (!mounted) return;
        const list: MediaItem[] = data.results || [];
        setMovies(list);
        setTotalPages(Math.min(data.total_pages || 1, 500));
        setTotalResults(data.total_results || 0);

        // Set featured movie from first result if on page 1
        if (page === 1 && list.length > 0 && !submittedSearch) {
          const withBackdrop = list.find((m) => m.backdrop_path) || list[0];
          setFeaturedMovie(withBackdrop);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load Hindi movies');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeCategory, page, submittedSearch, yearFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(searchQuery.trim());
  };

  const handleCategorySelect = (catKey: HindiCategoryKey) => {
    setActiveCategory(catKey);
    setPage(1);
    setSubmittedSearch('');
    setSearchQuery('');
  };

  const currentCategoryInfo = HINDI_CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Heading */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 ios-glass-elevated p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/20 via-red-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-[0_4px_16px_rgba(245,158,11,0.3)] border border-white/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              Bollywood Hub
            </span>
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full ios-glass border border-white/15">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              10,000+ Hindi Titles
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Hindi Movies <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-red-500 bg-clip-text text-transparent">Auto-Discovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300/90 leading-relaxed">
            Discover thousands of authentic Bollywood and Hindi cinema masterpieces. From the
            golden classics of Dilwale Dulhania Le Jayenge to high-octane modern blockbusters,
            stream with real TMDB metadata and JustWatch legal availability.
          </p>
        </div>
      </div>

      {/* Featured Blockbuster Hero (when available on page 1) */}
      {featuredMovie && !submittedSearch && page === 1 && (
        <div className="relative rounded-3xl overflow-hidden border border-white/15 ios-glass shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="relative h-72 sm:h-96 w-full">
            <img
              src={getBackdropUrl(featuredMovie.backdrop_path)}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06070a] via-[#06070a]/85 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/25 border border-amber-300/40 text-amber-200 backdrop-blur-md shadow-sm">
                  Featured Hindi Blockbuster
                </span>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/60 border border-white/15 text-amber-300 backdrop-blur-md">
                  <Star className="w-3 h-3 fill-amber-300" />
                  {featuredMovie.vote_average ? featuredMovie.vote_average.toFixed(1) : '7.8'}
                </span>
                {featuredMovie.release_date && (
                  <span className="text-xs text-white/70 px-2.5 py-0.5 rounded-full ios-glass border border-white/10">
                    {featuredMovie.release_date.substring(0, 4)}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                {featuredMovie.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300/90 line-clamp-2 leading-relaxed">
                {featuredMovie.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onWatchMedia(featuredMovie)}
                  className="px-6 py-2.5 rounded-2xl ios-glass-btn-primary text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_8px_24px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Now</span>
                </button>

                <button
                  onClick={() =>
                    setProviderModalMovie({
                      id: Number(featuredMovie.id),
                      title: featuredMovie.title || featuredMovie.name || 'Untitled',
                    })
                  }
                  className="px-4 py-2.5 rounded-2xl ios-glass-btn-secondary text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Check Providers</span>
                </button>

                <button
                  onClick={() => onSelectMedia(featuredMovie)}
                  className="px-4 py-2.5 rounded-2xl ios-glass-btn-secondary text-neutral-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Info className="w-4 h-4 text-neutral-300" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10 Hindi Categories Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Browse Categories
            </span>
            <span className="text-xs text-neutral-400">({HINDI_CATEGORIES.length} Collections)</span>
          </div>
          {currentCategoryInfo && (
            <span className="hidden sm:inline text-xs text-neutral-400 italic">
              {currentCategoryInfo.description}
            </span>
          )}
        </div>

        {/* Liquid Glass Segmented Pill Dock */}
        <div className="ios-glass p-1.5 rounded-2xl border border-white/15 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          {HINDI_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.key && !submittedSearch;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategorySelect(cat.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 relative ${
                  isSelected
                    ? 'ios-pill-active text-white font-bold ios-glow-active'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Year Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ios-glass p-3.5 rounded-2xl border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Hindi movies by title or keyword (e.g., Jawan, Sholay, 3 Idiots)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.1] transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg ios-glass-btn-primary text-white text-xs font-bold transition active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-neutral-300">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#12131e] text-white">
                All Years
              </option>
              <option value="2026" className="bg-[#12131e] text-white">
                2026 Releases
              </option>
              <option value="2025" className="bg-[#12131e] text-white">
                2025 Releases
              </option>
              <option value="2024" className="bg-[#12131e] text-white">
                2024 Releases
              </option>
              <option value="2023" className="bg-[#12131e] text-white">
                2023 Blockbusters
              </option>
              <option value="2022" className="bg-[#12131e] text-white">
                2022
              </option>
              <option value="2020" className="bg-[#12131e] text-white">
                2020
              </option>
              <option value="2010" className="bg-[#12131e] text-white">
                2010s Hits
              </option>
              <option value="2000" className="bg-[#12131e] text-white">
                2000s Classics
              </option>
            </select>
          </div>

          {(submittedSearch || yearFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSubmittedSearch('');
                setYearFilter('');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl ios-glass-btn-secondary text-neutral-300 text-xs font-semibold transition active:scale-95"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div>
          {submittedSearch ? (
            <span>
              Search results for <strong className="text-white">"{submittedSearch}"</strong> in Hindi
              catalog ({totalResults} found)
            </span>
          ) : (
            <span>
              Showing <strong className="text-white">{currentCategoryInfo?.label}</strong> ({totalResults}{' '}
              titles in registry)
            </span>
          )}
        </div>
        <div>
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-neutral-400">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className="text-xs">Querying TMDB Hindi movies catalog...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-900/40 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to load Hindi movies</h3>
          <p className="text-xs text-neutral-400">{error}</p>
          <button
            onClick={() => setPage((p) => p)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition"
          >
            Retry Loading
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#10111a] border border-neutral-800 space-y-3">
          <Film className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Hindi Movies Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try searching for a different title or select another category from the bar above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
          {movies.map((movie) => {
            const posterUrl = getImageUrl(movie.poster_path, 'w500');
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
            const year = movie.release_date ? movie.release_date.substring(0, 4) : '';

            return (
              <div
                key={movie.id}
                onClick={() => onSelectMedia(movie)}
                className="group relative rounded-xl sm:rounded-2xl ios-glass-card border border-white/10 hover:border-white/25 overflow-hidden transition-all duration-300 hover:shadow-[0_12px_28px_rgba(239,68,68,0.2),0_4px_14px_rgba(0,0,0,0.6)] hover:-translate-y-1 flex flex-col cursor-pointer select-none"
              >
                {/* Poster Container with strict 2/3 ratio */}
                <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 bg-neutral-900/60">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Gradient Overlay with Glass Buttons */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-2.5 space-y-1.5 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchMedia(movie);
                      }}
                      className="w-full py-1.5 rounded-lg sm:rounded-xl ios-glass-btn-primary text-white text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md transition active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Watch</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProviderModalMovie({
                          id: Number(movie.id),
                          title: movie.title || movie.name || 'Untitled',
                        });
                      }}
                      className="w-full py-1 rounded-lg sm:rounded-xl ios-glass-btn-secondary text-neutral-200 text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Providers</span>
                    </button>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-amber-400/25 border border-amber-300/40 text-amber-200 backdrop-blur-md">
                      HI
                    </span>
                    {rating && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-black/60 text-amber-300 border border-white/15 flex items-center gap-0.5 backdrop-blur-md">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        {rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1 bg-black/20 backdrop-blur-sm">
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-semibold text-white/95 line-clamp-1 group-hover:text-red-400 transition">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">
                      {year && <span>{year}</span>}
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold text-[9px]">Ready</span>
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchMedia(movie);
                      }}
                      className="text-[10px] sm:text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 transition"
                    >
                      <Play className="w-2.5 h-2.5 fill-red-400" />
                      <span>Watch</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProviderModalMovie({
                          id: Number(movie.id),
                          title: movie.title || movie.name || 'Untitled',
                        });
                      }}
                      className="text-[9px] sm:text-[10px] font-medium text-neutral-400 hover:text-white px-1.5 py-0.5 rounded-full ios-glass border border-white/10"
                    >
                      Providers
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => {
              setPage((p) => Math.max(p - 1, 1));
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            disabled={page <= 1}
            className="px-4 py-2 rounded-full ios-glass border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-neutral-400 font-medium px-3 py-1.5 rounded-full ios-glass border border-white/10">
            Page <strong className="text-white">{page}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => {
              setPage((p) => Math.min(p + 1, totalPages));
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-full ios-glass border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Watch Providers Modal */}
      {providerModalMovie && (
        <WatchProvidersModal
          movieId={providerModalMovie.id}
          movieTitle={providerModalMovie.title}
          isOpen={!!providerModalMovie}
          onClose={() => setProviderModalMovie(null)}
        />
      )}
    </div>
  );
};
