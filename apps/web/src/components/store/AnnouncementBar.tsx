'use client';

import React from 'react';

interface AnnouncementBarProps {
  text?: string;
  isActive?: boolean;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  text = '✨ FREE EXPRESS SHIPPING ACROSS INDIA ON ALL ORDERS ABOVE ₹999 | CODE: RAMPRS15 ✨',
  isActive = true,
}) => {
  if (!isActive) return null;

  return (
    <div className="bg-black text-white text-xs font-medium tracking-luxury py-2.5 px-4 text-center border-b border-neutral-800 uppercase flex items-center justify-center gap-2">
      <span>{text}</span>
    </div>
  );
};

