import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Home, Compass, Tv, Bookmark, User, Flame } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'hindi', label: 'Hindi', icon: Flame },
    { id: 'livetv', label: 'Live TV', icon: Tv },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'mylist', label: 'My List', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tappedTab, setTappedTab] = useState<string | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === currentTab);
    if (activeIndex === -1 || !tabRefs.current[activeIndex] || !containerRef.current) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeEl = tabRefs.current[activeIndex];
    const containerEl = containerRef.current;
    if (!activeEl || !containerEl) return;

    const activeRect = activeEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    setIndicatorStyle({
      left: activeRect.left - containerRect.left,
      top: activeRect.top - containerRect.top,
      width: activeRect.width,
      height: activeRect.height,
      opacity: 1,
    });
  }, [currentTab]);

  useEffect(() => {
    updateIndicator();

    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateIndicator]);

  const handleTabClick = (tabId: string) => {
    setTappedTab(tabId);
    setTimeout(() => setTappedTab(null), 450);
    onNavigate(tabId);
  };

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 transition-all safe-area-pb pointer-events-auto">
      {/* iOS 26 Liquid Glass Floating Dock Frame */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-around px-1.5 py-1.5 rounded-full ios-glass-elevated border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.3)] backdrop-blur-2xl bg-[#080911]/80 overflow-hidden"
      >
        {/* Subtle top edge liquid refraction gleam */}
        <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-20" />

        {/* Floating Sliding Active Indicator with iOS 26 Liquid Glass Pill */}
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.4,0.64,1)] z-0 will-change-transform"
          style={{
            transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            top: 0,
            left: 0,
          }}
        >
          <div className="w-full h-full rounded-full relative overflow-hidden backdrop-blur-xl bg-gradient-to-b from-white/25 via-red-500/20 to-red-600/30 border border-white/30 shadow-[0_4px_20px_rgba(239,68,68,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(239,68,68,0.3)] ios-glow-active">
            {/* Specular curved reflection */}
            <div className="absolute top-0 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/25 rounded-full blur-[3px]" />
            {/* Luminous optic indicator dot */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444,0_0_14px_rgba(239,68,68,0.8)]" />
          </div>
        </div>

        {/* Navigation Buttons */}
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isTapped = tappedTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => handleTabClick(tab.id)}
              className="group relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-transform duration-200 active:scale-[0.84] select-none touch-manipulation cursor-pointer"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon Container with Spring Bounce Animation */}
              <div
                className={`relative transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isTapped ? 'animate-ios-pop' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isActive
                      ? 'scale-110 -translate-y-0.5 text-white drop-shadow-[0_2px_10px_rgba(239,68,68,0.85)]'
                      : 'text-neutral-400 group-hover:text-neutral-200 group-hover:scale-105'
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight transition-all duration-300 ${
                  isActive
                    ? 'font-bold text-white scale-[1.03] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
                    : 'font-medium text-neutral-400 group-hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

