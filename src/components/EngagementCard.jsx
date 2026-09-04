import React from 'react';

/**
 * Helper to render the main card icon (accepts React node or icon key string)
 */
const renderMainIcon = (icon) => {
  if (React.isValidElement(icon)) return icon;

  switch (icon) {
    case 'croissant-rouge':
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9 9 0 0 0 12 3z" fill="#0D2F4F" fillOpacity="0.12" />
          <path d="M18 4v4m-2-2h4" stroke="#D4AF37" strokeWidth="1.8" />
        </svg>
      );

    case 'welove-el-jem':
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M5 21V10a7 7 0 0 1 14 0v11" />
          <path d="M9 21v-5a3 3 0 0 1 6 0v5" fill="#0D2F4F" fillOpacity="0.12" />
          <path d="M12 3v3M8 6h8" stroke="#D4AF37" strokeWidth="1.8" />
        </svg>
      );

    case 'club-robotique':
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#0D2F4F" fillOpacity="0.1" />
          <circle cx="9" cy="10" r="1.5" fill="#0D2F4F" />
          <circle cx="15" cy="10" r="1.5" fill="#0D2F4F" />
          <path d="M9 15h6" stroke="#D4AF37" strokeWidth="2" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#D4AF37" strokeWidth="1.6" />
        </svg>
      );

    case 'kafel-el-yatim':
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#0D2F4F" fillOpacity="0.12" />
          <path d="M12 11v4m-2-2h4" stroke="#D4AF37" strokeWidth="1.8" />
        </svg>
      );

    case 'club-sportif-isimed':
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
          <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" fill="#0D2F4F" fillOpacity="0.12" />
          <path d="M12 16v4M8 20h8" stroke="#D4AF37" strokeWidth="1.8" />
        </svg>
      );

    case 'engagement-personnel':
    default:
      return (
        <svg className="w-6 h-6 text-[#0D2F4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" fill="#0D2F4F" fillOpacity="0.15" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#D4AF37" strokeWidth="1.8" />
          <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="#0D2F4F" strokeWidth="1.6" />
        </svg>
      );
  }
};

/**
 * Helper to render the bottom decorative motif
 */
const renderBottomIcon = (bottomIcon) => {
  if (React.isValidElement(bottomIcon)) return bottomIcon;

  switch (bottomIcon) {
    case 'star-crescent':
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.9h7.3l-5.9 4.3 2.3 7-6.1-4.4-6.1 4.4 2.3-7-5.9-4.3h7.3z" fillOpacity="0.8" />
        </svg>
      );
    case 'heritage-rosette':
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="3" transform="rotate(45 12 12)" stroke="#D4AF37" fill="#D4AF37" fillOpacity="0.15" />
          <circle cx="12" cy="12" r="2" fill="#D4AF37" />
        </svg>
      );
    case 'tech-diamond':
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2" fillOpacity="0.8" />
        </svg>
      );
    case 'compassion-circle':
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" stroke="#D4AF37" fill="#D4AF37" fillOpacity="0.12" />
          <path d="M12 8v8M8 12h8" stroke="#D4AF37" strokeWidth="1.8" />
        </svg>
      );
    case 'trophy-laurel':
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity="0.8" />
        </svg>
      );
    case 'civic-starburst':
    default:
      return (
        <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="#D4AF37" fillOpacity="0.25" stroke="#D4AF37" strokeWidth="1.6" />
        </svg>
      );
  }
};

/**
 * Compact, Clickable EngagementCard Component
 * 
 * Props:
 * - title: string
 * - description: string
 * - icon: ReactNode | string
 * - bottomIcon: ReactNode | string
 * - index: number
 * - onClick: () => void
 * - isSelected: boolean
 */
const EngagementCard = ({ title, description, icon, bottomIcon, index = 0, onClick, isSelected = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between items-center text-center w-full h-full
                 bg-[#FAF7F2] rounded-2xl sm:rounded-3xl px-3.5 py-4
                 border ${isSelected ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-[0_12px_30px_-5px_rgba(13,47,79,0.18)]' : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/75'}
                 shadow-[0_6px_20px_-4px_rgba(13,47,79,0.06)] hover:shadow-[0_14px_30px_-4px_rgba(13,47,79,0.14)]
                 transition-all duration-300 ease-out
                 hover:-translate-y-1.5 cursor-pointer select-none outline-none
                 opacity-0 animate-fade-in-up`}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'forwards',
      }}
      aria-label={`Voir l'engagement ${title}`}
    >
      {/* 1. Tunisian / Arabic Architectural Arch Header Motif */}
      <div className="w-full flex flex-col items-center mb-2">
        <div className="relative w-12 h-4 flex items-center justify-center">
          <svg className="w-12 h-4 text-[#D4AF37]/45 group-hover:text-[#D4AF37]/80 transition-colors duration-300" viewBox="0 0 64 24" fill="none">
            <path
              d="M2 22 C14 22 18 4 32 2 C46 4 50 22 62 22"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="32" cy="2" r="1.6" fill="#D4AF37" />
          </svg>
        </div>

        {/* 2. Top Main Icon inside white circle with refined gold ring */}
        <div className="relative -mt-0.5 w-12 h-12 rounded-full bg-white flex items-center justify-center 
                        shadow-[0_3px_10px_rgba(13,47,79,0.06)] border border-[#D4AF37]/35 
                        group-hover:scale-105 group-hover:border-[#D4AF37] transition-all duration-300">
          <div className="flex items-center justify-center">
            {renderMainIcon(icon)}
          </div>
        </div>
      </div>

      {/* 3. Card Body: Association Name & Golden Separator */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-1 py-1">
        {/* Title */}
        <h3 className="text-[#0D2F4F] font-serif font-bold text-xs sm:text-[13.5px] leading-snug tracking-wide text-center group-hover:text-[#0D2F4F] transition-colors">
          {title}
        </h3>

        {/* Golden Separator with Central Diamond (Losange) */}
        <div className="w-full flex items-center justify-center my-2 gap-1.5">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[8px] transform rotate-45 select-none group-hover:scale-125 transition-transform duration-300">
            ◆
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]" />
        </div>
      </div>

      {/* 4. Bottom Decorative Motif & Click prompt */}
      <div className="w-full flex flex-col items-center pt-1 border-t border-[#D4AF37]/15">
        <div className="flex items-center justify-center text-[#D4AF37] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
          {renderBottomIcon(bottomIcon)}
        </div>
      </div>
    </button>
  );
};

export { renderMainIcon, renderBottomIcon };
export default EngagementCard;
