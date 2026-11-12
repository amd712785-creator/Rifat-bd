import React, { useState, useEffect } from 'react';
import { Bookmark, Clock, Play, Trash2, Film, Tv, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserWatchlist,
  getUserWatchHistory,
  removeFromWatchlist,
} from '../../services/firestore';
import { WatchlistItem, WatchHistoryItem, MediaItem } from '../../types';
import { getImageUrl } from '../../services/tmdb';

interface MyListViewProps {
  onSelectMedia: (item: MediaItem) => void;
  onWatchMedia: (item: MediaItem) => void;
  onRequireAuth: () => void;
}

export const MyListView: React.FC<MyListViewProps> = ({
  onSelectMedia,
  onWatchMedia,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>('watchlist');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [wList, hList] = await Promise.all([
          getUserWatchlist(user.uid),
          getUserWatchHistory(user.uid),
        ]);
        if (mounted) {
          setWatchlist(wList);
          setHistory(hList);
        }
      } catch (err) {
        console.error('Failed to load user list/history', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleRemoveWatchlist = async (item: WatchlistItem) => {
    if (!user) return;
    try {
      await removeFromWatchlist(user.uid, item.mediaType, item.mediaId);
      setWatchlist(watchlist.filter((w) => w.id !== item.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Bookmark className="w-12 h-12 text-neutral-600" />
        <h2 className="text-xl font-bold text-white">Your Personal Watchlist & History</h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          Sign in to save your favorite movies and track your watch progress across all devices.
        </p>
        <button
          onClick={onRequireAuth}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ios-glass p-4 sm:p-5 rounded-3xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl ios-glass border border-white/20 flex items-center justify-center text-red-500 shadow-sm">
            <Bookmark className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">My Library</h1>
            <p className="text-xs text-neutral-300/80">
              Manage saved titles and recent playback sessions
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex ios-glass rounded-2xl p-1 border border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              activeTab === 'watchlist'
                ? 'ios-pill-active text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist ({watchlist.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              activeTab === 'history'
                ? 'ios-pill-active text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl sm:rounded-2xl ios-skeleton border border-white/10" />
          ))}
        </div>
      ) : activeTab === 'watchlist' ? (
        watchlist.length > 0 ? (
          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3 animate-ios-fade-up">
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  onSelectMedia({
                    id: parseInt(item.mediaId, 10),
                    title: item.title,
                    poster_path: item.posterPath,
                    vote_average: item.voteAverage,
                    media_type: item.mediaType,
                    overview: '',
                    backdrop_path: null,
                    vote_count: 0,
                  })
                }
                className="group relative flex flex-col ios-glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition cursor-pointer select-none"
              >
                <div className="relative aspect-[2/3] w-full bg-neutral-900">
                  {item.posterPath ? (
                    <img
                      src={getImageUrl(item.posterPath, 'w500')}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Film className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white uppercase">
                    {item.mediaType}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWatchlist(item);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-neutral-400 hover:text-white transition"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                    <span>{item.voteAverage ? `⭐ ${item.voteAverage.toFixed(1)}` : '—'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchMedia({
                          id: parseInt(item.mediaId, 10),
                          title: item.title,
                          poster_path: item.posterPath,
                          vote_average: item.voteAverage,
                          media_type: item.mediaType,
                          overview: '',
                          backdrop_path: null,
                          vote_count: 0,
                        });
                      }}
                      className="text-red-400 hover:underline font-semibold"
                    >
                      Watch
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-400 ios-glass rounded-3xl border border-white/15 p-8 shadow-sm">
            <Bookmark className="w-10 h-10 text-neutral-500 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-white">Your Watchlist is Empty</p>
            <p className="text-xs text-neutral-400 mt-1">
              Click the bookmark icon on any movie or TV series to save it for later.
            </p>
          </div>
        )
      ) : history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {history.map((h) => (
            <div
              key={h.id}
              onClick={() =>
                onWatchMedia({
                  id: parseInt(h.mediaId, 10),
                  title: h.title,
                  poster_path: h.posterPath,
                  media_type: h.mediaType,
                  overview: '',
                  backdrop_path: null,
                  vote_average: 0,
                  vote_count: 0,
                })
              }
              className="p-3 rounded-2xl ios-glass-card border border-white/10 hover:border-white/25 transition flex gap-3 cursor-pointer group active:scale-[0.98] select-none"
            >
              <div className="relative w-20 aspect-[2/3] shrink-0 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                {h.posterPath ? (
                  <img
                    src={getImageUrl(h.posterPath, 'w300')}
                    alt={h.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Film className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                  <Play className="w-5 h-5 fill-white text-white drop-shadow-md" />
                </div>
              </div>

              <div className="flex flex-col justify-between py-1 min-w-0">
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    {h.mediaType === 'tv' ? `TV • S${h.season || 1} E${h.episode || 1}` : 'MOVIE'}
                  </span>
                  <h4 className="text-xs font-semibold text-white/95 truncate mt-0.5">{h.title}</h4>
                </div>

                <div className="text-[11px] text-neutral-400">
                  Watched {new Date(h.watchedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-neutral-400 ios-glass rounded-3xl border border-white/15 p-8 shadow-sm">
          <Clock className="w-10 h-10 text-neutral-500 mx-auto mb-2.5" />
          <p className="text-sm font-semibold text-white">No Watch History Yet</p>
          <p className="text-xs text-neutral-400 mt-1">
            Titles you play will automatically appear here so you can pick up where you left off.
          </p>
        </div>
      )}
    </div>
  );
};
