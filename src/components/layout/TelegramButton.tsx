import React from 'react';

export const TelegramButton: React.FC = () => {
  return (
    <aside
      aria-label="Telegram Community"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center group select-none animate-ios-float"
    >
      <a
        href="https://t.me/rifat_hossain125"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Telegram"
        className="relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-full ios-glass-elevated border border-white/25 hover:border-sky-400/50 shadow-[0_12px_36px_rgba(34,158,217,0.35),0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_44px_rgba(34,158,217,0.55),0_6px_20px_rgba(0,0,0,0.8)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-90"
      >
        {/* Ambient liquid glow layer */}
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#229ED9]/40 via-[#2AABEE]/30 to-transparent blur-md group-hover:blur-lg opacity-80 group-hover:opacity-100 transition-all duration-300 -z-10"
          aria-hidden="true"
        />

        {/* Specular hairline inner reflection */}
        <span
          className="absolute inset-[1px] rounded-full border border-white/20 pointer-events-none"
          aria-hidden="true"
        />

        {/* Official Telegram Logo (SVG) */}
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full overflow-hidden shadow-[0_2px_10px_rgba(34,158,217,0.5)] transition-transform duration-300 group-hover:rotate-6">
          <svg
            className="w-full h-full"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Blue disc background with official gradient */}
            <circle cx="12" cy="12" r="12" fill="url(#telegram-blue-grad)" />
            {/* White paper airplane */}
            <path
              d="M5.433 11.892l11.458-4.63c.531-.197 1.002.126.83.844l-1.95 9.192c-.144.667-.534.832-1.077.518l-2.977-2.195-1.436 1.383c-.159.159-.292.292-.598.292l.213-3.031 5.518-4.986c.24-.213-.053-.332-.372-.119L8.22 13.313l-2.937-.918c-.639-.199-.652-.638.15-.903z"
              fill="#ffffff"
            />
            <defs>
              <linearGradient
                id="telegram-blue-grad"
                x1="12"
                y1="0"
                x2="12"
                y2="24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#2AABEE" />
                <stop offset="1" stopColor="#229ED9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Expandable text label on hover (Desktop) */}
        <span className="hidden md:inline-block max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-out whitespace-nowrap text-xs font-semibold text-white/95 pr-1 drop-shadow-sm">
          Join Telegram
        </span>

        {/* Active status pulse dot */}
        <span
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0b12] shadow-[0_0_8px_#34d399]"
          title="Online"
        />
      </a>
    </aside>
  );
};
