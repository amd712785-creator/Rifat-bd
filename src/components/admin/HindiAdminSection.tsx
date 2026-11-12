import React, { useState, useEffect } from 'react';
import {
  Globe,
  Download,
  RefreshCw,
  Server,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Trash2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  fetchHindiStatus,
  importHindiMovies,
  fetchPlaybackConfig,
  updatePlaybackConfig,
  fetchHindiDiagnostics,
  clearHindiDiagnostics,
  fetchWatchProviders,
} from '../../services/tmdb';
import { HindiCatalogStatus, HindiPlaybackConfig, FailedPlaybackLog } from '../../types';

export const HindiAdminSection: React.FC = () => {
  const [status, setStatus] = useState<HindiCatalogStatus | null>(null);
  const [playbackConfig, setPlaybackConfig] = useState<HindiPlaybackConfig | null>(null);
  const [diagnostics, setDiagnostics] = useState<{
    catalogCount: number;
    pagesImported: number;
    lastSyncTime: string | null;
    failedPlaybackLogs: FailedPlaybackLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [importingPages, setImportingPages] = useState<number>(5);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Custom Stream Mapping Inputs
  const [customTmdbId, setCustomTmdbId] = useState('');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customStreamLabel, setCustomStreamLabel] = useState('');

  // Provider Test Input
  const [testTmdbId, setTestTmdbId] = useState('864692'); // Pathaan as default sample
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingProvider, setTestingProvider] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [st, cfg, diag] = await Promise.all([
        fetchHindiStatus(),
        fetchPlaybackConfig(),
        fetchHindiDiagnostics(),
      ]);
      setStatus(st);
      setPlaybackConfig(cfg);
      setDiagnostics(diag);
    } catch (e: any) {
      console.error('Failed to load Hindi admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await importHindiMovies(importingPages);
      setImportResult(
        `Imported ${res.pagesImported} pages. Added ${res.newImportedCount} new unique movies. Total catalog size: ${res.totalCatalogSize}.`
      );
      await loadAllData();
    } catch (err: any) {
      setImportResult(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSource = async (key: 'server1Enabled' | 'server2Enabled' | 'licensedOnlyMode') => {
    if (!playbackConfig) return;
    const newConfig = {
      ...playbackConfig,
      [key]: !playbackConfig[key],
    };
    try {
      await updatePlaybackConfig({ [key]: newConfig[key] });
      setPlaybackConfig(newConfig);
      setActionMessage(`Updated ${key} successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTmdbId.trim() || !customStreamUrl.trim()) return;
    try {
      const updatedStreams = {
        ...(playbackConfig?.customStreams || {}),
        [customTmdbId.trim()]: {
          streamUrl: customStreamUrl.trim(),
          label: customStreamLabel.trim() || 'Custom Authorized Stream',
        },
      };
      await updatePlaybackConfig({ customStreams: updatedStreams });
      if (playbackConfig) {
        setPlaybackConfig({ ...playbackConfig, customStreams: updatedStreams });
      }
      setCustomTmdbId('');
      setCustomStreamUrl('');
      setCustomStreamLabel('');
      setActionMessage('Custom authorized stream added.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveCustomStream = async (tmdbId: string) => {
    if (!playbackConfig) return;
    const updatedStreams = { ...playbackConfig.customStreams };
    delete updatedStreams[tmdbId];
    try {
      await updatePlaybackConfig({ customStreams: updatedStreams });
      setPlaybackConfig({ ...playbackConfig, customStreams: updatedStreams });
      setActionMessage('Custom stream removed.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClearLogs = async () => {
    try {
      await clearHindiDiagnostics();
      if (diagnostics) {
        setDiagnostics({ ...diagnostics, failedPlaybackLogs: [] });
      }
      setActionMessage('Playback diagnostics cleared.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestWatchProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTmdbId.trim()) return;
    setTestingProvider(true);
    setTestResult(null);
    try {
      const res = await fetchWatchProviders(testTmdbId.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestingProvider(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-xs">Loading Hindi catalog & playback control center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-red-950/30 to-[#11121d] p-6 rounded-3xl border border-amber-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black">
              Hindi Engine v2.0
            </span>
            <span className="text-xs text-amber-300 font-semibold">
              TMDB Auto-Discovery & Source Manager
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Hindi Movies Auto-Discovery & Playback Controls
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl">
            Manage the continuous automated catalog sync, licensed video source policies,
            TMDB Watch Providers registry, and real-time failure diagnostics.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11121d] p-5 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Cached Hindi Movies
          </span>
          <div className="text-2xl font-black text-white">{status?.totalMovies || 0}</div>
          <span className="text-[11px] text-neutral-500">
            Across {status?.pagesImported || 0} pages imported
          </span>
        </div>

        <div className="bg-[#11121d] p-5 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Catalog Refresh Schedule
          </span>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Every 6 Hours (Auto-Active)
          </div>
          <span className="text-[11px] text-neutral-500">
            Last sync:{' '}
            {status?.lastSyncTime ? new Date(status.lastSyncTime).toLocaleTimeString() : 'Recently'}
          </span>
        </div>

        <div className="bg-[#11121d] p-5 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Authorized Sources
          </span>
          <div className="text-sm font-bold text-white pt-1">
            Server 1: {playbackConfig?.server1Enabled ? 'Active' : 'Disabled'} | Server 2:{' '}
            {playbackConfig?.server2Enabled ? 'Active' : 'Disabled'}
          </div>
          <span className="text-[11px] text-neutral-500">
            {Object.keys(playbackConfig?.customStreams || {}).length} Custom Mapped Streams
          </span>
        </div>

        <div className="bg-[#11121d] p-5 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Reported Stream Errors
          </span>
          <div className="text-2xl font-black text-rose-400">
            {diagnostics?.failedPlaybackLogs?.length || 0}
          </div>
          <span className="text-[11px] text-neutral-500">Real-time client diagnostics</span>
        </div>
      </div>

      {/* 1. AUTO-DISCOVERY & BATCH IMPORTER */}
      <div className="bg-[#11121d] p-6 rounded-3xl border border-neutral-800 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">TMDB Auto-Discovery & Batch Import</h3>
              <p className="text-xs text-neutral-400">
                Queries TMDB API with <code className="text-amber-400">with_original_language=hi</code> and
                deduplicates by TMDB ID.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300">Pages to discover:</span>
            <select
              value={importingPages}
              onChange={(e) => setImportingPages(parseInt(e.target.value, 10))}
              disabled={isImporting}
              className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none"
            >
              <option value={5}>5 Pages (~100 titles)</option>
              <option value={10}>10 Pages (~200 titles)</option>
              <option value={20}>20 Pages (~400 titles)</option>
              <option value={25}>25 Pages (~500 titles)</option>
            </select>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing From TMDB...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Start Batch Import</span>
              </>
            )}
          </button>
        </div>

        {importResult && (
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-amber-300 font-medium">
            {importResult}
          </div>
        )}
      </div>

      {/* 2. PLAYBACK SOURCE MANAGEMENT */}
      <div className="bg-[#11121d] p-6 rounded-3xl border border-neutral-800 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Playback Source Management</h3>
            <p className="text-xs text-neutral-400">
              Configure active CDN embed servers, licensed streams, and strict licensed playback mode.
            </p>
          </div>
        </div>

        {/* Source Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Server 1 (CineSrc Fast CDN)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  playbackConfig?.server1Enabled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {playbackConfig?.server1Enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Direct TMDB-mapped movie embed (https://cinesrc.st/embed/movie/{'{tmdb_id}'}).
            </p>
            <button
              onClick={() => handleToggleSource('server1Enabled')}
              className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition border border-neutral-700"
            >
              Toggle Server 1
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Server 2 (Mirror Stream)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  playbackConfig?.server2Enabled
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {playbackConfig?.server2Enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Alternative CDN mirror fallback for high-load or regional connectivity.
            </p>
            <button
              onClick={() => handleToggleSource('server2Enabled')}
              className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition border border-neutral-700"
            >
              Toggle Server 2
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Strict Licensed-Only Mode</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  playbackConfig?.licensedOnlyMode
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {playbackConfig?.licensedOnlyMode ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              If enabled, unconfirmed titles show "Currently unavailable to watch" + JustWatch links.
            </p>
            <button
              onClick={() => handleToggleSource('licensedOnlyMode')}
              className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition border border-neutral-700"
            >
              Toggle Strict Policy
            </button>
          </div>
        </div>

        {/* Custom Stream Mapping Form */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Add Custom Authorized Stream / HLS Mapping
          </h4>
          <form onSubmit={handleAddCustomStream} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="TMDB Movie ID (e.g., 864692)"
              value={customTmdbId}
              onChange={(e) => setCustomTmdbId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              required
            />
            <input
              type="text"
              placeholder="Authorized Stream URL (HLS / .m3u8 / embed)"
              value={customStreamUrl}
              onChange={(e) => setCustomStreamUrl(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 sm:col-span-2"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Label"
                value={customStreamLabel}
                onChange={(e) => setCustomStreamLabel(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                Save
              </button>
            </div>
          </form>

          {/* Existing Custom Streams */}
          {playbackConfig?.customStreams && Object.keys(playbackConfig.customStreams).length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-neutral-400">
                Configured Custom Streams:
              </span>
              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60">
                {Object.entries(playbackConfig.customStreams).map(([id, info]) => (
                  <div key={id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono text-red-400 font-bold">TMDB #{id}</span>
                      <span className="text-neutral-400 ml-2 font-medium">({info.label})</span>
                      <p className="text-[11px] text-neutral-500 truncate max-w-md mt-0.5">
                        {info.streamUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomStream(id)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. TMDB WATCH PROVIDERS TESTER */}
      <div className="bg-[#11121d] p-6 rounded-3xl border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">TMDB Watch Providers (JustWatch) Live Inspector</h3>
            <p className="text-xs text-neutral-400">
              Query real regional legal availability (Bangladesh BD, India IN, USA, etc.) for any TMDB ID.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestWatchProvider} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="TMDB Movie ID (e.g. 864692)"
            value={testTmdbId}
            onChange={(e) => setTestTmdbId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            disabled={testingProvider}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 flex items-center gap-1.5 transition"
          >
            {testingProvider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Inspect</span>
          </button>
        </form>

        {testResult && (
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Attribution: {testResult.attribution || 'Data provided by JustWatch'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-emerald-400">Bangladesh (BD) Status:</span>
                <p className="mt-1 text-neutral-400">
                  {testResult.results?.BD ? (
                    `Confirmed providers: ${
                      testResult.results.BD.flatrate?.map((p: any) => p.provider_name).join(', ') || 'Rent/Buy only'
                    }`
                  ) : (
                    'No licensed streaming providers confirmed for Bangladesh on JustWatch.'
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">India (IN) Status:</span>
                <p className="mt-1 text-neutral-400">
                  {testResult.results?.IN ? (
                    `Confirmed streaming: ${
                      testResult.results.IN.flatrate?.map((p: any) => p.provider_name).join(', ') || 'Rent/Buy only'
                    }`
                  ) : (
                    'Not listed for India.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. FAILED PLAYBACK DIAGNOSTICS */}
      <div className="bg-[#11121d] p-6 rounded-3xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Failed Playback Diagnostics</h3>
              <p className="text-xs text-neutral-400">
                Real-time incident reports recorded when a video player experiences network, CORS, or provider errors.
              </p>
            </div>
          </div>

          {diagnostics?.failedPlaybackLogs && diagnostics.failedPlaybackLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Clear Diagnostics</span>
            </button>
          )}
        </div>

        {diagnostics?.failedPlaybackLogs && diagnostics.failedPlaybackLogs.length > 0 ? (
          <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/40">
            {diagnostics.failedPlaybackLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-400 font-bold">TMDB #{log.tmdbId}</span>
                    <span className="text-white font-semibold">{log.title}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{log.reason}</p>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-900/30 rounded-2xl border border-neutral-800">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <span>Zero playback failures reported. All streams operational.</span>
          </div>
        )}
      </div>
    </div>
  );
};
