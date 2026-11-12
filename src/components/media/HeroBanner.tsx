import React, { useState, useEffect } from 'react';
import { Play, Info, Bookmark, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../../types';
import { getBackdropUrl } from '../../services/tmdb';

interface HeroBannerProps {
  items: MediaItem[];
  onWatch: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onToggleWatchlist?: (item: MediaItem) => void;
  isInWatchlist?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  onWatch,
  onMoreInfo,
  onToggleWatchlist,
  isInWatchlist = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6));
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full h-[55vh] md:h-[70vh] bg-neutral-900/40 animate-pulse rounded-2xl flex items-center justify-center">
        <div className="text-neutral-600 text-sm">Loading featured titles...</div>
      </div>
    );
  }

  const current = items[currentIndex] || items[0];
  const backdropUrl = getBackdropUrl(current.backdrop_path || current.poster_path);
  const title = current.title || current.name || 'Featured Title';
  const releaseDate = current.release_date || current.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = current.vote_average ? current.vote_average.toFixed(1) : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? Math.min(items.length, 6) - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6));
  };

  return (
    <div className="relative w-full min-h-[480px] sm:min-h-[520px] h-[64vh] md:h-[75vh] max-h-[640px] rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)] mb-8 group select-none border border-white/15 ios-glass">
      {/* Background Backdrop Image with smooth iOS 26 zoom-fade */}
      {backdropUrl && (
        <img
          key={current.id}
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-top animate-ios-banner"
        />
      )}

      {/* Multi-step Liquid Dark Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/65 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06070a] via-[#06070a]/85 to-transparent w-full md:w-3/4" />

      {/* Content Container - Elevated bottom padding on mobile/tablet prevents any overlap with bottom slider controls */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-8 md:p-12 pb-16 sm:pb-20 md:pb-12 max-w-xl md:max-w-2xl pr-4 sm:pr-6 md:pr-48 lg:pr-56">
        <div key={current.id} className="animate-ios-fade-up">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 sm:mb-3.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/90 text-white shadow-[0_4px_16px_rgba(239,68,68,0.4)] border border-red-400/40 backdrop-blur-md">
              TRENDING NOW
            </span>
            {rating && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 backdrop-blur-md text-amber-200 border border-amber-300/30 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {rating}
              </span>
            )}
            {year && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white/80 ios-glass border border-white/15">
                {year}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[11px] uppercase font-bold text-white/70 ios-glass border border-white/15">
              {current.media_type === 'tv' ? 'TV SERIES' : 'FEATURE FILM'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] mb-2 sm:mb-3">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-xs sm:text-sm text-neutral-300/95 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-4 sm:mb-6 max-w-xl drop-shadow">
            {current.overview || 'Explore details, full cast, trailer, and high-definition streaming.'}
          </p>
        </div>

        {/* Action Buttons - Perfectly aligned, full clickability, elevated z-index, zero collision */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 relative z-30 pt-0.5">
          <button
            onClick={() => onWatch(current)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl ios-glass-btn-primary text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white shrink-0" />
            <span className="whitespace-nowrap">Watch Now</span>
          </button>

          <button
            onClick={() => onMoreInfo(current)}
            className="px-4.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl ios-glass-btn-secondary text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 backdrop-blur-md hover:scale-105 active:scale-95 transition shrink-0 border border-white/20 cursor-pointer shadow-sm"
          >
            <Info className="w-4 h-4 text-white/80 shrink-0" />
            <span className="whitespace-nowrap">More Info</span>
          </button>

          {onToggleWatchlist && (
            <button
              onClick={() => onToggleWatchlist(current)}
              className={`p-2.5 sm:p-3 rounded-2xl border backdrop-blur-md transition hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${
                isInWatchlist
                  ? 'bg-red-500/30 border-red-400/60 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                  : 'ios-glass-btn-secondary text-white hover:bg-white/20'
              }`}
              title={isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-red-400 text-red-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Hero Carousel Navigation Pill - Safely positioned without covering action buttons */}
      {items.length > 1 && (
        <div className="absolute bottom-3.5 right-4 sm:bottom-5 sm:right-6 md:bottom-8 md:right-8 z-20 flex items-center gap-1.5 sm:gap-2 ios-glass px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          <button
            onClick={handlePrev}
            className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 text-white transition active:scale-90"
            title="Previous"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-1.5">
            {items.slice(0, 6).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-5 sm:w-6 bg-red-500 shadow-[0_0_8px_#ef4444]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 text-white transition active:scale-90"
            title="Next"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
