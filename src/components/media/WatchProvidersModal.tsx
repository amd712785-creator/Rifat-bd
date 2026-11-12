import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Globe, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { fetchWatchProviders, getImageUrl } from '../../services/tmdb';
import { CountryWatchProviders } from '../../types';

interface WatchProvidersModalProps {
  movieId: number | string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
];

export const WatchProvidersModal: React.FC<WatchProvidersModalProps> = ({
  movieId,
  movieTitle,
  isOpen,
  onClose,
}) => {
  const [selectedCountry, setSelectedCountry] = useState('BD');
  const [providersData, setProvidersData] = useState<Record<string, CountryWatchProviders>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchWatchProviders(movieId)
      .then((res) => {
        if (!mounted) return;
        setProvidersData(res.results || {});
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to fetch watch providers');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [movieId, isOpen]);

  if (!isOpen) return null;

  const currentCountryData: CountryWatchProviders | undefined = providersData[selectedCountry];
  const hasProviders =
    currentCountryData &&
    ((currentCountryData.flatrate && currentCountryData.flatrate.length > 0) ||
      (currentCountryData.rent && currentCountryData.rent.length > 0) ||
      (currentCountryData.buy && currentCountryData.buy.length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-ios-backdrop">
      <div className="relative w-full max-w-xl ios-glass-elevated border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.85)] space-y-6 max-h-[90vh] overflow-y-auto animate-ios-modal">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-200 border border-red-500/40 backdrop-blur-md">
                TMDB Watch Providers
              </span>
              <span className="text-xs text-neutral-300 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ios-glass border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Legal Sources
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-2 line-clamp-1">
              {movieTitle}
            </h2>
            <p className="text-xs text-neutral-300/80 mt-0.5">
              Check official licensed streaming platforms and digital stores by region.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full ios-glass hover:bg-white/20 text-neutral-300 hover:text-white border border-white/20 transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Country Selector Tabs */}
        <div>
          <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5 mb-2.5">
            <Globe className="w-3.5 h-3.5 text-red-500" />
            <span>Select Region / Country:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_COUNTRIES.map((c) => {
              const isSelected = selectedCountry === c.code;
              const hasDataForC = !!providersData[c.code];
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between border transition active:scale-95 ${
                    isSelected
                      ? 'ios-pill-active text-white font-bold shadow-md'
                      : 'ios-glass text-neutral-300 border-white/10 hover:border-white/25 hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  {hasDataForC && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-xs">Querying TMDB and JustWatch streaming registries...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !hasProviders ? (
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">
              No Licensed Providers Confirmed for{' '}
              {SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry)?.name || selectedCountry}
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              TMDB and JustWatch have not recorded official subscription or on-demand streaming
              rights for this title in this specific region yet. You can check neighboring regions
              such as <strong className="text-neutral-200">India (IN)</strong> or use MovieNest's
              authorized stream player.
            </p>
            {selectedCountry !== 'IN' && providersData['IN'] && (
              <button
                onClick={() => setSelectedCountry('IN')}
                className="mt-2 px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition border border-neutral-700"
              >
                Switch to India (IN)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Subscription (Flatrate) */}
            {currentCountryData?.flatrate && currentCountryData.flatrate.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Subscription Streaming
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentCountryData.flatrate.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="p-2.5 rounded-2xl ios-glass-card border border-white/10 flex items-center gap-2.5"
                    >
                      <img
                        src={getImageUrl(provider.logo_path, 'w300')}
                        alt={provider.provider_name}
                        className="w-8 h-8 rounded-xl object-cover shadow-sm border border-white/10"
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {provider.provider_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rent */}
            {currentCountryData?.rent && currentCountryData.rent.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Rent (Digital)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentCountryData.rent.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="p-2.5 rounded-2xl ios-glass-card border border-white/10 flex items-center gap-2.5"
                    >
                      <img
                        src={getImageUrl(provider.logo_path, 'w300')}
                        alt={provider.provider_name}
                        className="w-8 h-8 rounded-xl object-cover shadow-sm border border-white/10"
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {provider.provider_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buy */}
            {currentCountryData?.buy && currentCountryData.buy.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Buy (Digital Store)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentCountryData.buy.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="p-2.5 rounded-2xl ios-glass-card border border-white/10 flex items-center gap-2.5"
                    >
                      <img
                        src={getImageUrl(provider.logo_path, 'w300')}
                        alt={provider.provider_name}
                        className="w-8 h-8 rounded-xl object-cover shadow-sm border border-white/10"
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {provider.provider_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JustWatch Link */}
            {currentCountryData?.link && (
              <div className="pt-2">
                <a
                  href={currentCountryData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl ios-glass-btn-secondary text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <span>View Full Details on JustWatch</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-300" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Required Attribution Footer */}
        <div className="border-t border-neutral-800/80 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
          <span>Data provided by JustWatch via The Movie Database (TMDB).</span>
          <span className="text-neutral-400 font-medium">Licensed streaming registry</span>
        </div>
      </div>
    </div>
  );
};
