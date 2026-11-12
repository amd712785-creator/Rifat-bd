import React, { useState, useEffect } from 'react';
import {
  Tv,
  Search,
  Radio,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { LiveTvChannel, LiveTvFavorite, IptvDiagnostics } from '../../types';
import { LiveTvPlayer } from '../livetv/LiveTvPlayer';
import { useAuth } from '../../context/AuthContext';
import {
  toggleLiveTvFavorite,
  getUserLiveTvFavorites,
} from '../../services/firestore';

interface LiveTvViewProps {
  onRequireAuth: () => void;
}

export const LiveTvView: React.FC<LiveTvViewProps> = ({ onRequireAuth }) => {
  const { user, isAdmin } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<LiveTvChannel | null>(null);
  const [channels, setChannels] = useState<LiveTvChannel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string; flag?: string }[]>([]);
  const [favorites, setFavorites] = useState<Map<string, LiveTvFavorite>>(new Map());

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);

  // Diagnostics Panel state (Admin)
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<IptvDiagnostics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load user favorites
  useEffect(() => {
    if (user) {
      getUserLiveTvFavorites(user.uid).then((favs) => {
        const map = new Map<string, LiveTvFavorite>();
        favs.forEach((f) => map.set(f.channelId, f));
        setFavorites(map);
      });
    } else {
      setFavorites(new Map());
    }
  }, [user]);

  // Load channels from backend proxy
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
      });
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedCountry !== 'all') params.set('country', selectedCountry);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/livetv/channels?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      setChannels(data.results || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
      if (data.categories) setCategories(data.categories);
      if (data.countries) setCountries(data.countries);

      // Auto-select first channel on initial load
      if (!selectedChannel && data.results && data.results.length > 0) {
        setSelectedChannel(data.results[0]);
      }
    } catch (err: any) {
      console.error('Error fetching live TV channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [selectedCategory, selectedCountry, searchQuery, page]);

  // Load diagnostics if admin
  const loadDiagnostics = async () => {
    try {
      const res = await fetch('/api/livetv/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (e) {
      console.error('Failed to load diagnostics', e);
    }
  };

  useEffect(() => {
    if (isAdmin && showDiagnostics) {
      loadDiagnostics();
    }
  }, [isAdmin, showDiagnostics]);

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/livetv/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data.diagnostics);
        await fetchChannels();
      }
    } catch (err) {
      console.error('Refresh error', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (channel: LiveTvChannel) => {
    if (!user) {
      onRequireAuth();
      return;
    }

    try {
      const isFav = favorites.has(channel.id);
      await toggleLiveTvFavorite({
        userId: user.uid,
        channelId: channel.id,
        name: channel.name,
        logo: channel.logo || '',
        country: channel.country,
        category: channel.category,
      });

      setFavorites((prev) => {
        const next = new Map(prev);
        if (isFav) next.delete(channel.id);
        else
          next.set(channel.id, {
            id: `${user.uid}_${channel.id}`,
            userId: user.uid,
            channelId: channel.id,
            name: channel.name,
            logo: channel.logo || '',
            country: channel.country,
            category: channel.category,
          });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const displayedChannels =
    activeTab === 'favorites'
      ? channels.filter((c) => favorites.has(c.id))
      : channels;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ios-glass p-4 sm:p-5 rounded-3xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl ios-glass border border-white/20 flex items-center justify-center text-red-500 shadow-sm">
            <Radio className="w-5 h-5 drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Live TV Channels</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white border border-red-400/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                IPTV-ORG
              </span>
            </div>
            <p className="text-xs text-neutral-300/80">
              {totalResults > 0
                ? `${totalResults.toLocaleString()} verified broadcast channels joined from official IPTV-org datasets`
                : 'Free public television channels powered by the verified IPTV-org network'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search channel name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-3.5 py-2 pl-9 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500/80 focus:bg-white/[0.08] transition"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </div>

          {/* Admin Diagnostics Toggle */}
          {isAdmin && (
            <button
              onClick={() => {
                setShowDiagnostics(!showDiagnostics);
                if (!showDiagnostics) loadDiagnostics();
              }}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                showDiagnostics
                  ? 'bg-amber-400/20 text-amber-200 border-amber-300/40 shadow-sm'
                  : 'ios-glass text-neutral-300 border-white/15 hover:text-white'
              }`}
              title="Toggle IPTV-org API Diagnostics"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Diagnostics</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Diagnostics Panel */}
      {isAdmin && showDiagnostics && (
        <div className="bg-[#12131f] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">IPTV-Org API Live Diagnostics</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Admin Exclusive
              </span>
            </div>

            <button
              onClick={handleForceRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Re-fetching APIs...' : 'Force Refresh Datasets'}</span>
            </button>
          </div>

          {diagnostics ? (
            <div className="space-y-4 text-xs">
              {/* Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Channels API</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status {diagnostics.channelsApiStatus}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {diagnostics.totalChannelRecords.toLocaleString()} records
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Streams API</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status {diagnostics.streamsApiStatus}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {diagnostics.totalStreamRecords.toLocaleString()} records
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Logos API</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status {diagnostics.logosApiStatus}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {diagnostics.totalLogoRecords.toLocaleString()} logos
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Countries API</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status {diagnostics.countriesApiStatus}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Metadata joined</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400 block mb-1">Categories API</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status {diagnostics.categoriesApiStatus}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Metadata joined</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3 rounded-xl border border-neutral-800/80">
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase">Matched Channels</span>
                  <p className="text-base font-bold text-white">
                    {diagnostics.matchedChannelCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase">Playable Format URLs</span>
                  <p className="text-base font-bold text-emerald-400">
                    {diagnostics.channelsWithPlayableFormat.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase">Failed API Requests</span>
                  <p className="text-base font-bold text-neutral-300">
                    {diagnostics.failedRequestsCount}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase">Cache Last Updated</span>
                  <p className="text-xs text-neutral-400">
                    {diagnostics.lastUpdated ? new Date(diagnostics.lastUpdated).toLocaleTimeString() : 'Active'}
                  </p>
                </div>
              </div>

              {/* Console Errors */}
              {diagnostics.errors && diagnostics.errors.length > 0 ? (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Exact Console Errors:
                  </span>
                  {diagnostics.errors.map((e, idx) => (
                    <p key={idx} className="font-mono text-[11px]">{e}</p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero API failures or JSON parsing errors reported. All endpoints responding cleanly.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Main Broadcast Player Section */}
      <div className="max-w-4xl mx-auto">
        <LiveTvPlayer
          channel={selectedChannel}
          isFavorite={selectedChannel ? favorites.has(selectedChannel.id) : false}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>

      {/* Filter and Category Bar */}
      <div className="space-y-4">
        {/* Quick Country Buttons (including Bangladesh) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-neutral-300 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass border border-white/10">
            <Globe className="w-3.5 h-3.5 text-red-500" /> Country:
          </span>

          <button
            onClick={() => {
              setSelectedCountry('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              selectedCountry === 'all'
                ? 'ios-pill-active text-white font-bold shadow-sm'
                : 'ios-glass text-neutral-300 border border-white/15 hover:text-white'
            }`}
          >
            All Countries
          </button>

          {/* Bangladesh prominent filter */}
          <button
            onClick={() => {
              setSelectedCountry('BD');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
              selectedCountry === 'BD'
                ? 'bg-emerald-600/90 text-white border border-emerald-400/50 shadow-[0_4px_16px_rgba(16,185,129,0.35)] backdrop-blur-md'
                : 'ios-glass text-neutral-300 border border-white/15 hover:border-emerald-400/50 hover:text-white'
            }`}
          >
            <span>🇧🇩</span>
            <span>Bangladesh (BD)</span>
          </button>

          {/* Popular countries quick tags */}
          {[
            { code: 'US', name: 'United States', flag: '🇺🇸' },
            { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
            { code: 'IN', name: 'India', flag: '🇮🇳' },
            { code: 'DE', name: 'Germany', flag: '🇩🇪' },
            { code: 'FR', name: 'France', flag: '🇫🇷' },
            { code: 'CA', name: 'Canada', flag: '🇨🇦' },
          ].map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setSelectedCountry(c.code);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                selectedCountry === c.code
                  ? 'ios-pill-active text-white font-bold shadow-sm'
                  : 'ios-glass text-neutral-300 border border-white/15 hover:text-white'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 ios-glass p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                activeTab === 'all'
                  ? 'ios-pill-active text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Channels ({totalResults.toLocaleString()})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'ios-pill-active text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Favorites ({favorites.size})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="ios-glass border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500/80 cursor-pointer"
            >
              <option value="all" className="bg-[#12131e] text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#12131e] text-white">
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Complete Countries Dropdown */}
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setPage(1);
              }}
              className="ios-glass border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500/80 cursor-pointer"
            >
              <option value="all" className="bg-[#12131e] text-white">All Countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#12131e] text-white">
                  {c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Channel Cards Grid */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
            <p className="text-xs text-neutral-400">Loading live broadcast channels...</p>
          </div>
        ) : displayedChannels.length > 0 ? (
          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
            {displayedChannels.map((ch) => {
              const isSelected = selectedChannel?.id === ch.id;
              const isFav = favorites.has(ch.id);
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannel(ch);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between group active:scale-[0.95] select-none hover:-translate-y-1 ${
                    isSelected
                      ? 'bg-red-500/25 border-red-400/60 shadow-[0_0_24px_rgba(239,68,68,0.45)] ios-glow-active'
                      : 'ios-glass-card border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 flex items-center gap-1 border border-neutral-800">
                      {ch.countryFlag && <span>{ch.countryFlag}</span>}
                      <span>{ch.country}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(ch);
                      }}
                      className="p-1 rounded text-neutral-500 hover:text-red-400 transition"
                      title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Channel Logo */}
                  <div className="w-14 h-14 mx-auto my-1 flex items-center justify-center">
                    {ch.logo ? (
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain filter drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-xs">
                        {ch.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-2 space-y-1">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                      {ch.name}
                    </h4>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
                      <span className="capitalize">{ch.category}</span>
                      {ch.quality && (
                        <span className="px-1 rounded bg-neutral-800 font-mono text-[9px] text-emerald-400 font-bold">
                          {ch.quality}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-400 bg-[#10111a] rounded-2xl border border-neutral-800">
            <Radio className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No channels found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try choosing "All Countries" or resetting the category filter.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && activeTab === 'all' && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 disabled:opacity-40 flex items-center gap-1 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-neutral-400">
              Page <span className="text-white font-bold">{page}</span> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 disabled:opacity-40 flex items-center gap-1 hover:text-white"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
