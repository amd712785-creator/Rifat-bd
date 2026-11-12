import React, { useState } from 'react';
import {
  Film,
  Search,
  Sparkles,
  Shield,
  User as UserIcon,
  LogOut,
  Tv,
  Bookmark,
  Compass,
  Menu,
  X,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenAuth }) => {
  const { user, userProfile, isAdmin, isVIP, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigate('search', { query: quickSearch.trim() });
      setQuickSearch('');
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'hindi', label: 'Hindi Movies', badge: '10K+' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'livetv', label: 'Live TV' },
    { id: 'explore', label: 'Explore' },
    { id: 'mylist', label: 'My List' },
  ];

  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full px-3 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="ios-glass-elevated rounded-2xl sm:rounded-3xl px-3 sm:px-5 h-16 flex items-center justify-between gap-3 border border-white/[0.14] shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)]">
          {/* Official MovieNest Image Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer select-none group active:scale-95 transition-transform duration-200"
          >
            <img
              src="/movienest-logo.png"
              alt="MovieNest"
              className="h-10 sm:h-12 max-h-12 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(239,68,68,0.45)] group-hover:scale-105 transition-all duration-300"
            />
          </div>

          {/* Desktop Navigation Links - iOS 26 Segmented Liquid Glass Dock */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-x-0.5 lg:space-x-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'ios-pill-active text-white font-bold ios-glow-active'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* VIP CTA Link */}
            <button
              onClick={() => onNavigate('vip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                currentTab === 'vip'
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-amber-200 border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>VIP</span>
            </button>

            {/* Admin Link if admin */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  currentTab === 'admin'
                    ? 'ios-glass-btn-primary text-white'
                    : 'text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Quick Search & User Actions */}
          <div className="flex items-center gap-2.5">
            {/* Search Input (Desktop Spotlight Glass) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex items-center relative w-52"
            >
              <input
                type="text"
                placeholder="Spotlight Search..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-xs text-white placeholder-neutral-400 pl-8 pr-3 py-1.5 rounded-full border border-white/[0.12] focus:outline-none focus:border-red-500/60 focus:bg-white/[0.1] focus:ring-2 focus:ring-red-500/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* User Profile or Sign-in */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] shadow-sm active:scale-95 transition-all duration-200"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="w-7 h-7 rounded-full object-cover border border-white/25"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {isVIP && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase shadow-xs">
                      VIP
                    </span>
                  )}
                </button>

                {/* Dropdown Menu - iOS 26 Glass Sheet */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 ios-glass-elevated rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.25)] border border-white/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">
                        {user.displayName || 'Member'}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ID: {user.uid.slice(0, 8)}...
                        </span>
                        {isVIP && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-300 font-bold border border-amber-400/30">
                            VIP ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-neutral-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2.5 transition active:scale-98"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('mylist');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-neutral-200 hover:text-white hover:bg-white/[0.08] flex items-center gap-2.5 transition active:scale-98"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                        <span>My Watchlist</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('vip');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-500/15 flex items-center gap-2.5 transition active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>VIP Membership</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 flex items-center gap-2.5 transition active:scale-98"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="border-t border-white/10 my-1" />

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 flex items-center gap-2.5 transition active:scale-98"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="ios-glass-btn-primary px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md active:scale-95 transition-all duration-200"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/[0.06] border border-white/12 text-neutral-300 hover:text-white active:scale-95 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0d14] border-b border-neutral-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate(link.id);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('vip');
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-neutral-800"
          >
            <Sparkles className="w-4 h-4" />
            <span>VIP Upgrade</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('admin');
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-neutral-800"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
