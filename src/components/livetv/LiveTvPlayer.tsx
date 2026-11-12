import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Tv,
} from 'lucide-react';
import { LiveTvChannel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toggleLiveTvFavorite, isMediaInWatchlist } from '../../services/firestore';

interface LiveTvPlayerProps {
  channel: LiveTvChannel | null;
  isFavorite?: boolean;
  onToggleFavorite?: (channel: LiveTvChannel) => void;
}

export const LiveTvPlayer: React.FC<LiveTvPlayerProps> = ({
  channel,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!channel || !videoRef.current) return;

    setIsLoading(true);
    setStreamError(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    const streamUrl = channel.streamUrl;

    if (!streamUrl) {
      setStreamError('No broadcast stream URL is configured for this channel.');
      setIsLoading(false);
      return;
    }

    let isDestroyed = false;
    let attemptedProxy = false;

    const startHls = (sourceUrl: string) => {
      if (isDestroyed || !videoRef.current) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(sourceUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setStreamError(null);
          video.play().catch(() => {
            setIsMuted(true);
            video.muted = true;
            video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Attempt proxy fallback if direct stream fails
                if (!attemptedProxy) {
                  attemptedProxy = true;
                  const proxyUrl = `/api/livetv/proxy?url=${encodeURIComponent(streamUrl)}`;
                  hls.loadSource(proxyUrl);
                  hls.startLoad();
                  return;
                }
                setStreamError(
                  'This broadcast stream is currently offline, geoblocked, or experiencing downtime. Please select another channel.'
                );
                hls.destroy();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setStreamError('Unable to decode broadcast format.');
                hls.destroy();
                break;
            }
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari iOS/macOS HLS
        video.src = sourceUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          setStreamError(null);
          video.play().catch(() => {
            setIsMuted(true);
            video.muted = true;
            video.play().catch(() => {});
          });
        });
        video.addEventListener('error', () => {
          if (!attemptedProxy) {
            attemptedProxy = true;
            video.src = `/api/livetv/proxy?url=${encodeURIComponent(streamUrl)}`;
            return;
          }
          setIsLoading(false);
          setStreamError('Broadcaster stream could not be loaded.');
        });
      } else {
        setStreamError('HLS live streaming is not supported in this browser.');
        setIsLoading(false);
      }
    };

    startHls(streamUrl);

    return () => {
      isDestroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, retryCount]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video bg-[#0d0e14] rounded-2xl border border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
        <Tv className="w-12 h-12 text-neutral-600 mb-3" />
        <h3 className="text-base font-semibold text-neutral-200">Select a Channel to Watch</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Explore hundreds of free worldwide IPTV channels below.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Player Frame */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center group"
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          controls={false}
        />

        {/* Channel Badge Overlay */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-[11px] font-bold text-white shadow-lg uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
            {channel.category.toUpperCase()}
          </span>
        </div>

        {/* Loading state */}
        {isLoading && !streamError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 pointer-events-none">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Tuning into {channel.name}...</p>
            <p className="text-xs text-neutral-400 mt-1">Connecting to live HLS broadcast</p>
          </div>
        )}

        {/* Error overlay */}
        {streamError && (
          <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center z-20">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Broadcast Stream Offline</h4>
            <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">{streamError}</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reconnect
            </button>
          </div>
        )}

        {/* Hover Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition shadow"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition shadow"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel info bar */}
      <div className="flex items-center justify-between bg-[#12131a] p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-10 h-10 object-contain rounded-lg bg-neutral-900 p-1 border border-neutral-800"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-white font-bold text-sm">
              {channel.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {channel.name}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {channel.country}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 capitalize">{channel.category} Channel</p>
          </div>
        </div>

        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(channel)}
            className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              isFavorite
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
