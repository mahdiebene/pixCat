import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+8px)] left-1/2 -translate-x-1/2 z-40 bg-[#2a3356] text-amber-200 border-2 border-[#090c14] rounded-md px-3 py-1 text-[8px] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
    >
      OFFLINE MODE · SAVED LOCALLY
    </div>
  );
};
