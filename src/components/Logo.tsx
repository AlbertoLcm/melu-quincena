import React from 'react';

type LogoProps = {
  className?: string;
  size?: number | string;
};

export const Logo: React.FC<LogoProps> = ({ className = '', size = 24 }) => {
  const idSuffix = React.useId().replace(/:/g, '');
  const needsId = `needs-grad-${idSuffix}`;
  const wantsId = `wants-grad-${idSuffix}`;
  const savingsId = `savings-grad-${idSuffix}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={needsId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={wantsId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={savingsId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      
      {/* Needs (50%) - Left Stroke */}
      <path
        d="M 24 75 L 24 25"
        stroke={`url(#${needsId})`}
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Wants (30%) - Center Arch */}
      <path
        d="M 24 25 C 32 10, 42 10, 50 25 L 50 75"
        stroke={`url(#${wantsId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Savings (20%) - Right Arch */}
      <path
        d="M 50 45 C 58 32, 68 32, 76 45 L 76 75"
        stroke={`url(#${savingsId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
