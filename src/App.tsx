import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { TelegramButton } from './components/layout/TelegramButton';
import { HomeView } from './components/views/HomeView';
import { HindiMoviesView } from './components/views/HindiMoviesView';
import { MoviesView } from './components/views/MoviesView';
import { TvShowsView } from './components/views/TvShowsView';
import { LiveTvView } from './components/views/LiveTvView';
import { ExploreView } from './components/views/ExploreView';
import { MyListView } from './components/views/MyListView';
import { VipPage } from './components/vip/VipPage';
import { ProfileView } from './components/views/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MediaDetailsView } from './components/media/MediaDetailsView';
import { AuthModal } from './components/auth/AuthModal';
import { MediaItem, AdminSettings } from './types';
import { getAdminSettings } from './services/firestore';
import { Film, Shield, Info, Heart, Sparkles, AlertCircle } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [searchMeta, setSearchMeta] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<{
    id: number | string;
    type: 'movie' | 'tv';
    autoplay?: boolean;
  } | null>(null);

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  // Settings
  const [siteSettings, setSiteSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    getAdminSettings().then(setSiteSettings).catch(console.error);
  }, []);

  const handleNavigate = (tab: string, meta?: any) => {
    if (meta?.query) {
      setSearchMeta(meta.query);
      setCurrentTab('explore');
    } else {
      setCurrentTab(tab);
    }
    // Close detail overlay on tab navigation
    setSelectedMedia(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMedia = (item: MediaItem) => {
    setSelectedMedia({
      id: item.id,
      type: item.media_type === 'tv' ? 'tv' : 'movie',
      autoplay: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatchMedia = (item: MediaItem) => {
    if (!user) {
      setAuthModalMessage('Please sign in or create an account to start streaming.');
      setAuthModalOpen(true);
      return;
    }
    setSelectedMedia({
      id: item.id,
      type: item.media_type === 'tv' ? 'tv' : 'movie',
      autoplay: true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuth = (message?: string) => {
    setAuthModalMessage(message || 'Please sign in to proceed with this action.');
    setAuthModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#06070d] text-neutral-100 flex flex-col selection:bg-red-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* iOS 26 Ambient Liquid Refraction Meshes (Glowing background depth for frosted glass) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] bg-purple-600/8 rounded-full blur-[160px] mix-blend-screen" />
        <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute -bottom-40 right-10 w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[140px] mix-blend-screen" />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={() => {
          setAuthModalMessage(undefined);
          setAuthModalOpen(true);
        }}
      />

      {/* Global Admin Announcement Banner */}
      {siteSettings?.announcementNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div className="ios-glass rounded-2xl px-4 py-2.5 text-center text-xs text-red-200/90 flex items-center justify-center gap-2 border border-red-500/20 bg-gradient-to-r from-red-950/30 via-white/[0.04] to-red-950/30 shadow-lg shadow-black/20">
            <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="font-medium tracking-tight">{siteSettings.announcementNotice}</span>
          </div>
        </div>
      )}

      {/* Configurable AdSense Placement Header */}
      {siteSettings?.adPlacements?.enabled && siteSettings?.adPlacements?.publisherId && (
        <div className="max-w-7xl mx-auto px-4 pt-3 w-full">
          <div className="p-2 rounded-2xl ios-glass border border-white/10 text-center text-[11px] text-neutral-400">
            <span>Advertisement Banner Slot</span>
            <div className="h-16 flex items-center justify-center text-neutral-500 font-mono text-xs">
              AdSense [{siteSettings.adPlacements.publisherId}]
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-12">
        {/* If a media detail is selected, display MediaDetailsView */}
        {selectedMedia ? (
          <div key={`media-${selectedMedia.id}`} className="animate-ios-page-enter">
            <MediaDetailsView
              mediaId={selectedMedia.id}
              mediaType={selectedMedia.type}
              autoplay={selectedMedia.autoplay}
              onClose={() => setSelectedMedia(null)}
              onSelectMedia={handleSelectMedia}
              onRequireAuth={() => handleRequireAuth('Please sign in to watch full movies and TV shows.')}
            />
          </div>
        ) : (
          <div key={currentTab} className="animate-ios-page-enter">
            {currentTab === 'home' && (
              <HomeView
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onNavigate={handleNavigate}
                onRequireAuth={() => handleRequireAuth('Please sign in to save titles to your watchlist.')}
              />
            )}

            {currentTab === 'hindi' && (
              <HindiMoviesView
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onRequireAuth={() => handleRequireAuth('Please sign in to stream Hindi movies.')}
              />
            )}

            {currentTab === 'movies' && (
              <MoviesView
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onRequireAuth={() => handleRequireAuth('Please sign in to stream movies.')}
              />
            )}

            {currentTab === 'tv' && (
              <TvShowsView
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onRequireAuth={() => handleRequireAuth('Please sign in to stream TV series.')}
              />
            )}

            {currentTab === 'livetv' && (
              <LiveTvView
                onRequireAuth={() => handleRequireAuth('Please sign in to bookmark favorite channels.')}
              />
            )}

            {currentTab === 'explore' && (
              <ExploreView
                initialQuery={searchMeta}
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onRequireAuth={() => handleRequireAuth('Please sign in to bookmark titles.')}
              />
            )}

            {currentTab === 'mylist' && (
              <MyListView
                onSelectMedia={handleSelectMedia}
                onWatchMedia={handleWatchMedia}
                onRequireAuth={() => handleRequireAuth('Please sign in to access your Watchlist and History.')}
              />
            )}

            {currentTab === 'vip' && (
              <VipPage
                onRequireAuth={() => handleRequireAuth('Please sign in to upgrade to VIP membership.')}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                onNavigate={handleNavigate}
                onRequireAuth={() => handleRequireAuth()}
              />
            )}

            {currentTab === 'admin' && <AdminDashboard />}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={selectedMedia ? '' : currentTab}
        onNavigate={(tab) => {
          setSelectedMedia(null);
          handleNavigate(tab);
        }}
      />

      {/* Floating Telegram Button (iOS 26 Liquid Glass) */}
      <TelegramButton />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        message={authModalMessage}
      />

      {/* Footer */}
      <footer className="w-full bg-[#07080d] border-t border-neutral-900 pt-10 pb-20 md:pb-10 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/movienest-logo.png"
                alt="MovieNest"
                className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(239,68,68,0.3)]"
              />
              <span className="text-[10px] text-neutral-500 ml-1">v2.0 Production</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
              <button onClick={() => handleNavigate('home')} className="hover:text-white transition">
                Home
              </button>
              <button onClick={() => handleNavigate('movies')} className="hover:text-white transition">
                Movies
              </button>
              <button onClick={() => handleNavigate('tv')} className="hover:text-white transition">
                TV Shows
              </button>
              <button onClick={() => handleNavigate('livetv')} className="hover:text-white transition">
                Live TV
              </button>
              <button onClick={() => handleNavigate('vip')} className="hover:text-amber-400 transition">
                VIP Plans
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-900/80 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
            <p>
              © {new Date().getFullYear()} MovieNest. All rights reserved. Film and television metadata provided by TMDB. Public television feeds provided by IPTV-org.
            </p>
            <p className="text-[10px] text-neutral-600">
              Authorized embed player: CineSrc CDN. Real events tracked securely via Cloud Firestore.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
