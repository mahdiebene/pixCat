import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  onModalToggle?: (open: boolean) => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  onModalToggle,
}) => {
  const { canPrompt, isIOSInstallable, isInstalled, installApp } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || (!canPrompt && !isIOSInstallable)) return null;

  const openGuide = () => {
    setShowIOSGuide(true);
    onModalToggle?.(true);
  };

  const closeGuide = () => {
    setShowIOSGuide(false);
    onModalToggle?.(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (canPrompt) {
      void installApp();
    } else if (isIOSInstallable) {
      openGuide();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'px-btn px-btn-amber min-h-[38px] min-w-[38px] !py-1.5 !px-2 !text-[8px]'
            : 'px-btn px-btn-amber min-h-[44px] px-4 py-2 !text-[9px]'
        }
        aria-label="Install Mochi app on device"
        title="Install Mochi as an app"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
          <path d="M7 2H9V8H11.5L8 11.5L4.5 8H7V2Z" fill="#090c14" />
          <rect x="3" y="12.5" width="10" height="2" fill="#090c14" />
        </svg>
        {!compact && <span>INSTALL APP</span>}
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="hud-panel w-full max-w-[340px] p-4 flex flex-col gap-3 text-center">
            <h2 id="ios-install-title" className="text-[11px] text-amber-300 leading-relaxed">
              INSTALL MOCHI ON HOME SCREEN
            </h2>
            <p className="text-[8.5px] text-amber-50/90 leading-loose">
              1. Tap the Safari Share button at the bottom of your screen.
            </p>
            <p className="text-[8.5px] text-amber-50/90 leading-loose">
              2. Scroll down and tap &ldquo;Add to Home Screen&rdquo; to play full-screen offline!
            </p>
            <button
              type="button"
              onClick={closeGuide}
              className="px-btn px-btn-green min-h-[44px] w-full mt-1"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
