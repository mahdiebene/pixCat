import React from 'react';
import { FUR_PALETTES, HudSnapshot, StatKey } from '../game/types';
import { ProfileTab } from './CatProfileModal';
import { PWAInstallButton } from './PWAInstallButton';

interface HudBarProps {
  hud: HudSnapshot;
  onOpenProfile: (tab?: ProfileTab) => void;
  onToggleMute: () => void;
  onNavigate: () => void;
  onModalToggle?: (open: boolean) => void;
}

const STAT_META: Array<{
  key: StatKey;
  label: string;
  textClass: string;
  baseFill: string;
}> = [
  { key: 'hunger', label: 'HUNGER', textClass: 'text-amber-200', baseFill: 'bg-emerald-400' },
  { key: 'hygiene', label: 'HYGIENE', textClass: 'text-sky-200', baseFill: 'bg-sky-400' },
  { key: 'energy', label: 'ENERGY', textClass: 'text-purple-200', baseFill: 'bg-purple-400' },
  { key: 'fun', label: 'FUN', textClass: 'text-pink-200', baseFill: 'bg-pink-400' },
];

function StatIcon({ type }: { type: StatKey }) {
  if (type === 'hunger') {
    return (
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" aria-hidden="true">
        <rect x="2" y="5" width="8" height="6" fill="#6ec8f5" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="10" y="4" width="4" height="8" fill="#48a3d4" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="4" y="7" width="2" height="2" fill="#090d1a" />
      </svg>
    );
  }
  if (type === 'hygiene') {
    return (
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" aria-hidden="true">
        <rect x="3" y="4" width="7" height="7" fill="#a8ecff" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="10" y="2" width="4" height="4" fill="#ffffff" stroke="#090d1a" strokeWidth="1.2" />
        <rect x="5" y="6" width="2" height="2" fill="#ffffff" />
      </svg>
    );
  }
  if (type === 'energy') {
    return (
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" aria-hidden="true">
        <path
          d="M11 2C6.5 2 3 5.5 3 10C3 12.2 4.5 14 7 14C10.5 14 13 11.5 13 9C10 10 8 8 8 5C8 3.6 9.2 2.4 11 2Z"
          fill="#ffd43b"
          stroke="#090d1a"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" aria-hidden="true">
      <path
        d="M8 14L2.5 8.5C1.2 7.2 1.2 4.8 2.8 3.5C4.3 2.3 6.5 2.8 8 4.6C9.5 2.8 11.7 2.3 13.2 3.5C14.8 4.8 14.8 7.2 13.5 8.5L8 14Z"
        fill="#ff5e8e"
        stroke="#090d1a"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export const HudBar: React.FC<HudBarProps> = ({
  hud,
  onOpenProfile,
  onToggleMute,
  onNavigate,
  onModalToggle,
}) => {
  const pal = FUR_PALETTES[hud.profile.fur] ?? FUR_PALETTES.classic;
  const currentDay = hud.profile.progress.currentDay;

  return (
    <div
      className="hud-panel rounded-none sm:rounded-[10px] border-x-0 border-t-0 sm:border-[3px] px-2.5 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 sm:py-2 flex flex-col gap-2 shrink-0"
      data-testid="hud-bar"
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            data-testid="hud-profile-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenProfile('overview');
            }}
            className="px-btn px-btn-cream min-h-[38px] sm:min-h-0 !py-1.5 !px-2 !text-[8px] sm:!text-[9px]"
            aria-label={`Open ${hud.petName} profile`}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
              <rect x="3" y="2" width="3" height="3" fill={pal.patch} stroke="#09090d" strokeWidth="1.2" />
              <rect x="10" y="2" width="3" height="3" fill={pal.patch} stroke="#09090d" strokeWidth="1.2" />
              <rect x="2" y="5" width="12" height="9" fill={pal.body} stroke="#09090d" strokeWidth="1.4" />
              <rect x="5" y="8" width="2" height="2" fill="#09090d" />
              <rect x="9" y="8" width="2" height="2" fill="#09090d" />
              <rect x="7" y="10" width="2" height="1.5" fill="#eb6c7d" />
            </svg>
            <span className="truncate max-w-[68px] sm:max-w-none" data-testid="pet-name">
              {hud.petName}
            </span>
          </button>

          <button
            type="button"
            data-testid="hud-day-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenProfile('days');
            }}
            className="flex items-center gap-1 min-h-[38px] sm:min-h-0 bg-[#12182e] hover:bg-[#1a2342] border-2 border-[#080b14] rounded-md px-2 py-1 text-[8px] sm:text-[8.5px] text-emerald-300 tabular-nums shrink-0 whitespace-nowrap transition-colors"
            aria-label={`Day ${currentDay} progress`}
          >
            <svg viewBox="0 0 14 14" className="w-3 h-3 shrink-0" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" fill="#ffd43b" stroke="#090d1a" strokeWidth="1.3" />
              <rect x="6.3" y="0.5" width="1.4" height="2" fill="#ffd43b" />
              <rect x="6.3" y="11.5" width="1.4" height="2" fill="#ffd43b" />
              <rect x="0.5" y="6.3" width="2" height="1.4" fill="#ffd43b" />
              <rect x="11.5" y="6.3" width="2" height="1.4" fill="#ffd43b" />
            </svg>
            <span className="sm:hidden">D{currentDay}</span>
            <span className="hidden sm:inline">DAY {currentDay}</span>
          </button>

          <div
            className="flex items-center gap-1 min-h-[38px] sm:min-h-0 bg-[#12182e] border-2 border-[#080b14] rounded-md px-2 py-1 text-[8px] sm:text-[9px] text-amber-300 tabular-nums shrink-0"
            aria-label={`${hud.coins} coins`}
            data-testid="coin-count"
          >
            <svg viewBox="0 0 14 14" className="w-3 h-3 shrink-0" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" fill="#ffd43b" stroke="#090d1a" strokeWidth="1.5" />
              <rect x="6" y="4" width="2" height="6" fill="#d98c00" />
            </svg>
            <span>{hud.coins}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact onModalToggle={onModalToggle} />

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="px-btn min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 !py-1.5 !px-2.5 !text-[9px]"
            aria-label={hud.muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={hud.muted}
          >
            {hud.muted ? (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M2 6H5L9 3V13L5 10H2V6Z" fill="#ffffff" />
                <path d="M11 6L15 10M15 6L11 10" stroke="#ff77a8" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M2 6H5L9 3V13L5 10H2V6Z" fill="#ffffff" />
                <path
                  d="M11 5.5C12.2 6.6 12.2 9.4 11 10.5M13 3.5C15 5.6 15 10.4 13 12.5"
                  stroke="#75f0a8"
                  strokeWidth="1.8"
                  fill="none"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onNavigate();
            }}
            className="px-btn px-btn-green min-h-[38px] sm:min-h-0 !py-1.5 !px-2.5 !text-[8.5px] sm:!text-[9px]"
            aria-label={hud.screen === 'hub' ? 'Back to title screen' : 'Open room map'}
          >
            {hud.screen === 'hub' ? 'TITLE' : 'MAP'}
          </button>
        </div>
      </div>

      {/* Compact single-row 4-column stat strip on mobile, labeled 4-column on desktop */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-0.5">
        {STAT_META.map((item) => {
          const val = hud.stats[item.key];
          const fillClass =
            val < 25 ? 'bg-rose-500' : val < 50 ? 'bg-amber-400' : item.baseFill;
          return (
            <div key={item.key} className="flex flex-col gap-1" data-testid={`stat-${item.key}`}>
              <div className={`flex items-center justify-between text-[7px] sm:text-[7.5px] ${item.textClass}`}>
                <span className="flex items-center gap-1">
                  <StatIcon type={item.key} />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
                <span className="tabular-nums">{val}%</span>
              </div>
              <div className="stat-track">
                <div className={`stat-fill ${fillClass}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
