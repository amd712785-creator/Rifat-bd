import React, { useState } from 'react';
import { Star, Play, Bookmark, Film, Tv } from 'lucide-react';
import { MediaItem } from '../../types';
import { getImageUrl } from '../../services/tmdb';

interface MediaCardProps {
  item: MediaItem;
  mediaType?: 'movie' | 'tv';
  onSelect: (item: MediaItem) => void;
  onWatch?: (item: MediaItem) => void;
  onToggleWatchlist?: (item: MediaItem) => void;
  isInWatchlist?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  mediaType = item.media_type || 'movie',
  onSelect,
  onWatch,
  onToggleWatchlist,
  isInWatchlist = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const title = item.title || item.name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const posterUrl = getImageUrl(item.poster_path, 'w500');

  const resolvedType = item.media_type || mediaType;

  return (
    <div
      onClick={() => onSelect({ ...item, media_type: resolvedType })}
      className="group relative flex flex-col ios-glass-card rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300 hover:shadow-[0_12px_28px_rgba(239,68,68,0.2),0_4px_14px_rgba(0,0,0,0.6)] hover:-translate-y-1 active:scale-[0.96] active:duration-100 cursor-pointer select-none"
    >
      {/* Poster image container with strict 2/3 ratio */}
      <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
        {/* iOS Skeleton Shimmer while image loads */}
        {posterUrl && !imageLoaded && (
          <div className="absolute inset-0 ios-skeleton z-0" />
        )}

        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-neutral-400 bg-neutral-900/60">
            {resolvedType === 'movie' ? (
              <Film className="w-8 h-8 mb-1.5 text-white/40" />
            ) : (
              <Tv className="w-8 h-8 mb-1.5 text-white/40" />
            )}
            <span className="text-[11px] font-medium text-neutral-300 line-clamp-2">{title}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold tracking-wider uppercase ios-glass text-white/90 border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            {resolvedType === 'tv' ? 'TV' : 'MOVIE'}
          </span>
          {rating && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-400/20 backdrop-blur-md text-amber-200 border border-amber-300/30 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              {rating}
            </span>
          )}
        </div>

        {/* Gradient overlay on hover with Liquid Glass Action Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-2.5 z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            {onWatch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWatch({ ...item, media_type: resolvedType });
                }}
                className="flex-1 py-1 px-2 rounded-lg sm:rounded-xl ios-glass-btn-primary text-white text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 shadow-md transition active:scale-95"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Watch</span>
              </button>
            )}
            {onToggleWatchlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist({ ...item, media_type: resolvedType });
                }}
                className={`p-1.5 rounded-lg sm:rounded-xl border backdrop-blur-md transition active:scale-95 ${
                  isInWatchlist
                    ? 'bg-red-500/30 border-red-400/60 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : 'ios-glass-btn-secondary text-white hover:bg-white/15'
                }`}
                title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-3 h-3 ${isInWatchlist ? 'fill-red-400 text-red-400' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-2 sm:p-2.5 flex flex-col flex-grow justify-between bg-black/20 backdrop-blur-sm">
        <h4 className="text-[11px] sm:text-xs font-semibold text-white/95 truncate group-hover:text-red-400 transition-colors">
          {title}
        </h4>
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 mt-1">
          <span className="font-medium text-neutral-400">{year || '—'}</span>
          <span className="text-[8px] sm:text-[9px] uppercase px-1 py-0.2 rounded bg-white/[0.06] border border-white/10 text-neutral-300 font-semibold tracking-wider">HD</span>
        </div>
      </div>
    </div>
  );
};
