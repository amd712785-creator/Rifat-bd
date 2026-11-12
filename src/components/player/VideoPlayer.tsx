import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Maximize2,
  AlertCircle,
  Server,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Film,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { recordWatchHistory, logViewEvent } from '../../services/firestore';
import { reportPlaybackFailure } from '../../services/tmdb';

interface VideoPlayerProps {
  mediaType: 'movie' | 'tv';
  tmdbId: number | string;
  title: string;
  posterPath?: string | null;
  season?: number;
  episode?: number;
  maxEpisodes?: number;
  onEpisodeChange?: (season: number, episode: number) => void;
  server1Base?: string;
  server2Base?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  mediaType,
  tmdbId,
  title,
  posterPath,
  season = 1,
  episode = 1,
  maxEpisodes = 1,
  onEpisodeChange,
  server1Base = 'https://cinesrc.st/embed',
  server2Base = 'https://vidsrc.to/embed',
}) => {
  const { user } = useAuth();
  const [activeServer, setActiveServer] = useState<'server1' | 'server2'>('server1');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Exact Movie and TV URLs
  const getEmbedUrl = (server: 'server1' | 'server2') => {
    if (server === 'server1') {
      if (mediaType === 'movie') {
        return `https://cinesrc.st/embed/movie/${tmdbId}`;
      } else {
        return `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}`;
      }
    } else {
      if (mediaType === 'movie') {
        return `${server2Base}/movie/${tmdbId}`;
      } else {
        return `${server2Base}/tv/${tmdbId}/${season}/${episode}`;
      }
    }
  };

  const currentUrl = getEmbedUrl(activeServer);

  // Record playback event once per item/episode
  useEffect(() => {
    setIframeLoaded(false);
    setLoadError(null);

    if (user) {
      const historyItem: any = {
        userId: user.uid,
        mediaId: String(tmdbId),
        mediaType,
        title,
        posterPath: posterPath || null,
      };
      if (mediaType === 'tv') {
        historyItem.season = typeof season === 'number' ? season : 1;
        historyItem.episode = typeof episode === 'number' ? episode : 1;
      }

      recordWatchHistory(historyItem);

      logViewEvent({
        mediaId: String(tmdbId),
        mediaType,
        title,
        userId: user.uid,
      });
    }

    // Safeguard: Check if iframe completely failed to connect
    const errorTimer = setTimeout(() => {
      if (!iframeLoaded) {
        // Just note in state without covering the iframe completely
      }
    }, 20000);

    return () => clearTimeout(errorTimer);
  }, [mediaType, tmdbId, season, episode, activeServer]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setLoadError(null);
  };

  const handleIframeError = () => {
    const reason = `Unable to connect to ${activeServer === 'server1' ? 'Server 1 (CineSrc)' : 'Server 2'}. Provider might be restricted or offline.`;
    setLoadError(reason);
    reportPlaybackFailure({
      tmdbId,
      title,
      reason,
    });
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handlePrevEpisode = () => {
    if (mediaType === 'tv' && episode > 1 && onEpisodeChange) {
      onEpisodeChange(season, episode - 1);
    }
  };

  const handleNextEpisode = () => {
    if (mediaType === 'tv' && onEpisodeChange && episode < maxEpisodes) {
      onEpisodeChange(season, episode + 1);
    }
  };

  const reloadIframe = () => {
    setLoadError(null);
    setIframeLoaded(false);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Controls & Server Selector with iOS 26 Liquid Glass */}
      <div className="flex flex-wrap items-center justify-between gap-3 ios-glass p-3 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-2.5">
          <Server className="w-4 h-4 text-red-500" />
          <span className="text-xs font-semibold text-neutral-300">Server:</span>
          <div className="flex ios-glass rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => {
                setActiveServer('server1');
                setLoadError(null);
                setIframeLoaded(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition active:scale-95 ${
                activeServer === 'server1'
                  ? 'ios-pill-active text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Server 1
            </button>
            <button
              onClick={() => {
                setActiveServer('server2');
                setLoadError(null);
                setIframeLoaded(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition active:scale-95 ${
                activeServer === 'server2'
                  ? 'ios-pill-active text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Server 2
            </button>
          </div>
        </div>

        {/* TV Series Season & Episode Controls */}
        {mediaType === 'tv' && onEpisodeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-300 font-medium px-2 py-0.5 rounded-full ios-glass border border-white/10">
              Season {season} • Episode {episode}
            </span>
            <button
              onClick={handlePrevEpisode}
              disabled={episode <= 1}
              className="p-1.5 rounded-lg ios-glass border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
              title="Previous Episode"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextEpisode}
              disabled={episode >= maxEpisodes}
              className="p-1.5 rounded-lg ios-glass border border-white/10 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
              title="Next Episode"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action options */}
        <div className="flex items-center gap-2">
          <button
            onClick={reloadIframe}
            className="p-1.5 px-2.5 rounded-xl ios-glass hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Reload Video Player"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 px-3 rounded-xl ios-glass-btn-secondary text-neutral-200 hover:text-white text-xs flex items-center gap-1.5 transition active:scale-95 font-medium"
            title="Open in dedicated player tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden sm:inline">Pop-out</span>
          </a>
        </div>
      </div>

      {/* Main Responsive Player Frame */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85)] group"
      >
        {/* Direct Provider Iframe */}
        <iframe
          ref={iframeRef}
          key={`${activeServer}_${mediaType}_${tmdbId}_${season}_${episode}`}
          src={currentUrl}
          title={`${title} Video Player`}
          className="w-full h-full border-0 relative z-10"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="eager"
          referrerPolicy="origin"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />

        {/* Non-blocking subtle loading badge in corner during handshake */}
        {!iframeLoaded && !loadError && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-semibold text-neutral-300 border border-white/10 pointer-events-none">
            <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
            <span>Connecting {activeServer === 'server1' ? 'CineSrc' : 'Server 2'}...</span>
          </div>
        )}

        {/* Error Fallback Overlay only if fatal failure */}
        {loadError && (
          <div className="absolute inset-0 bg-black/95 p-6 flex flex-col items-center justify-center text-center z-30 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-1" />
            <div>
              <h4 className="text-base font-bold text-white mb-1">Streaming Handshake Failed</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">{loadError}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveServer(activeServer === 'server1' ? 'server2' : 'server1');
                  setLoadError(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Switch to {activeServer === 'server1' ? 'Server 2' : 'Server 1'}
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
              <button
                onClick={reloadIframe}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Hover Fullscreen Action Button */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFullscreen}
            className="p-2.5 rounded-full ios-glass hover:bg-white/20 border border-white/20 text-white shadow-lg transition active:scale-90"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 px-1 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Provider: {activeServer === 'server1' ? 'CineSrc CDN' : 'Cloud Mirror 2'}
        </span>
        <span className="font-mono text-neutral-400">
          TMDB #{tmdbId} {mediaType === 'tv' && `(S${season}:E${episode})`}
        </span>
      </div>
    </div>
  );
};
