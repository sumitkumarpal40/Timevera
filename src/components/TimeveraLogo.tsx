import React from 'react';

interface TimeveraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'red' | 'white';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const TimeveraLogo: React.FC<TimeveraLogoProps> = ({
  size = 'md',
  variant = 'gold',
  showText = true,
  showTagline = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-base', sub: 'text-[7px] tracking-[3px]' },
    md: { icon: 42, text: 'text-xl', sub: 'text-[8px] tracking-[4px]' },
    lg: { icon: 58, text: 'text-2xl sm:text-3xl', sub: 'text-[9px] sm:text-[10px] tracking-[5px]' },
    xl: { icon: 84, text: 'text-3xl sm:text-4xl', sub: 'text-[11px] sm:text-[12px] tracking-[6px]' },
  };

  const dim = sizeMap[size];

  // Colors
  const isGold = variant === 'gold';
  const isRed = variant === 'red';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Geometric Watch Emblem based on uploaded Timevera Logo */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={dim.icon}
          height={dim.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            {/* Gold Metallic Gradient */}
            <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5e199" />
              <stop offset="25%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#aa7c11" />
              <stop offset="75%" stopColor="#f3e5ab" />
              <stop offset="100%" stopColor="#996515" />
            </linearGradient>

            <linearGradient id="goldShine" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="50%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#996515" />
            </linearGradient>

            {/* Red Accent Gradient */}
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* Watch Bezel Shadow */}
            <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Outer Watch Dial Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={isRed ? 'url(#redGradient)' : 'url(#goldMetallic)'}
            strokeWidth="5.5"
            filter="url(#logoShadow)"
          />

          {/* Inner Precision Ticks / Caliber Indices */}
          {/* Top Notch / 12 o'clock */}
          <rect x="47.5" y="6" width="5" height="9" rx="1" fill={isRed ? '#dc2626' : 'url(#goldShine)'} />
          {/* 3 o'clock notch */}
          <rect x="85" y="47.5" width="9" height="5" rx="1" fill={isRed ? '#dc2626' : 'url(#goldShine)'} />
          {/* 6 o'clock notch */}
          <rect x="47.5" y="85" width="5" height="9" rx="1" fill={isRed ? '#dc2626' : 'url(#goldShine)'} />
          {/* 9 o'clock notch */}
          <rect x="6" y="47.5" width="9" height="5" rx="1" fill={isRed ? '#dc2626' : 'url(#goldShine)'} />

          {/* Caliber sub-ticks (inner track) */}
          <circle
            cx="50"
            cy="50"
            r="37"
            stroke={isRed ? '#ef4444' : '#d4af37'}
            strokeWidth="1.2"
            strokeDasharray="2 6"
            opacity="0.75"
          />

          {/* Central 'T' Bar (Top of Emblem) */}
          <path
            d="M26 31 C 26 28, 38 27, 50 27 C 62 27, 74 28, 74 31 C 74 34, 60 35, 55 35 L 55 45 L 45 45 L 45 35 C 40 35, 26 34, 26 31 Z"
            fill={isRed ? 'url(#redGradient)' : 'url(#goldShine)'}
          />

          {/* Central 'V' Monogram + Watch Hands Geometry (The Iconic Timevera V) */}
          {/* Outer V Wings */}
          <path
            d="M28 36 L 50 78 L 72 36 L 63 36 L 50 63 L 37 36 Z"
            fill={isRed ? 'url(#redGradient)' : 'url(#goldMetallic)'}
            filter="url(#logoShadow)"
          />

          {/* Inner Watch Hand Arrow inside the V (Center Pinion) */}
          <circle cx="50" cy="46" r="3.5" fill={isRed ? '#991b1b' : '#5c3a07'} stroke={isRed ? '#fca5a5' : '#fff3b0'} strokeWidth="1" />
          
          {/* Clock Hands pointing inside V */}
          <path
            d="M 50 46 L 43 40 L 46 39 L 50 43 L 54 39 L 57 40 Z"
            fill={isRed ? '#dc2626' : 'url(#goldShine)'}
          />
          <path
            d="M 49 46 L 50 58 L 51 46 Z"
            fill={isRed ? '#b91c1c' : '#85580a'}
          />

          {/* Bottom V flourish connecting back into the circle */}
          <path
            d="M 46 76 L 50 84 L 54 76 Z"
            fill={isRed ? 'url(#redGradient)' : 'url(#goldMetallic)'}
          />
        </svg>
      </div>

      {/* Typography Side */}
      {showText && (
        <div className="flex flex-col items-start justify-center">
          <div
            className={`font-brand font-extrabold ${dim.text} tracking-[2.5px] sm:tracking-[3.5px] leading-none transition-colors ${
              isRed
                ? 'text-[#E5C07B]'
                : 'text-[#F8FAFC] group-hover:text-[#D4AF37]'
            }`}
          >
            TIMEVERA
          </div>
          {showTagline && (
            <span
              className={`font-medium uppercase ${dim.sub} mt-1 leading-none text-[#D4AF37] tracking-[3px]`}
            >
              PRECISION • LUXURY • HERITAGE
            </span>
          )}
        </div>
      )}
    </div>
  );
};
