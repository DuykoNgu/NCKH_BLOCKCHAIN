import React, { useMemo } from 'react';

interface UserAvatarProps {
  address: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ address, avatarUrl, size = 40, className = '' }) => {
  // Generate a unique placeholder if no avatarUrl
  const identicon = useMemo(() => {
    if (!address) return null;
    
    // Simple hash for colors
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue1 = Math.abs(hash % 360);
    const hue2 = Math.abs((hash * 13) % 360);
    
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`rounded-full shadow-inner ${className}`}
      >
        <defs>
          <linearGradient id={`grad-${address}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: `hsl(${hue1}, 70%, 60%)`, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: `hsl(${hue2}, 80%, 40%)`, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#grad-${address})`} />
        {/* Geometric patterns for unique look */}
        <circle cx="50" cy="50" r="30" fill="white" fillOpacity="0.2" />
        <rect x="25" y="25" width="50" height="50" transform={`rotate(${hue1 % 90} 50 50)`} fill="white" fillOpacity="0.1" />
      </svg>
    );
  }, [address, size, className]);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        width={size}
        height={size}
        className={`rounded-full object-cover shadow-sm ${className}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return identicon;
};
