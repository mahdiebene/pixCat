import React from 'react';
import { HudSnapshot, RoomId, StatKey } from '../game/types';

interface MobileRoomDockProps {
  hud: HudSnapshot;
  onSelectRoom: (room: RoomId) => void;
}

const ROOM_TABS: Array<{
  id: RoomId;
  label: string;
  stat: StatKey | null;
}> = [
  { id: 'bedroom', label: 'BED', stat: 'energy' },
  { id: 'bathroom', label: 'BATH', stat: 'hygiene' },
  { id: 'playroom', label: 'PLAY', stat: 'fun' },
  { id: 'kitchen', label: 'FOOD', stat: 'hunger' },
  { id: 'closet', label: 'STYLE', stat: null },
];

function RoomTabIcon({ id }: { id: RoomId }) {
  if (id === 'bedroom') {
    return (
      <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
        <path
          d="M11 2C6.5 2 3 5.5 3 10C3 12.2 4.5 14 7 14C10.5 14 13 11.5 13 9C10 10 8 8 8 5C8 3.6 9.2 2.4 11 2Z"
          fill="#ffd43b"
          stroke="#090d1a"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  if (id === 'bathroom') {
    return (
      <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
        <rect x="2.5" y="5" width="7" height="7" fill="#a8ecff" stroke="#090d1a" strokeWidth="1.4" />
        <rect x="9.5" y="2.5" width="4.5" height="4.5" fill="#ffffff" stroke="#090d1a" strokeWidth="1.3" />
        <rect x="4.5" y="7" width="2" height="2" fill="#ffffff" />
      </svg>
    );
  }
  if (id === 'playroom') {
    return (
      <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" fill="#ff6b9d" stroke="#090d1a" strokeWidth="1.5" />
        <path d="M4.5 6.5C6.5 5 9.5 5 11.5 6.5M4.5 9.5C6.5 11 9.5 11 11.5 9.5" stroke="#ffd1e3" strokeWidth="1.3" fill="none" />
      </svg>
    );
  }
  if (id === 'kitchen') {
    return (
      <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
        <rect x="2" y="5" width="8.5" height="6" fill="#6ec8f5" stroke="#090d1a" strokeWidth="1.4" />
        <rect x="10.5" y="4" width="3.5" height="8" fill="#48a3d4" stroke="#090d1a" strokeWidth="1.4" />
        <rect x="4.5" y="7" width="2" height="2" fill="#090d1a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <path
        d="M2.5 12L3.5 5L6.5 8L8 4L9.5 8L12.5 5L13.5 12H2.5Z"
        fill="#ffd43b"
        stroke="#090d1a"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export const MobileRoomDock: React.FC<MobileRoomDockProps> = ({ hud, onSelectRoom }) => {
  return (
    <nav
      aria-label="Room navigation"
      data-testid="mobile-room-dock"
      className="sm:hidden grid grid-cols-5 gap-1.5 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] bg-[#132c1f] border-t-[3px] border-[#08130d] shrink-0"
    >
      {ROOM_TABS.map((tab) => {
        const active = hud.screen === tab.id;
        const lowNeed = Boolean(tab.stat && hud.stats[tab.stat] < 38);
        return (
          <button
            key={tab.id}
            type="button"
            data-testid={`dock-${tab.id}`}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              e.currentTarget.blur();
              onSelectRoom(tab.id);
            }}
            className={`relative min-h-[50px] rounded-lg border-[2.5px] flex flex-col items-center justify-center gap-1 touch-manipulation transition-transform duration-100 active:translate-y-[2px] active:scale-[0.96] ${
              active
                ? 'bg-[#3c4a7d] border-[#ffe066] text-[#fff6c2] shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_2px_0_#090c14]'
                : 'bg-[#1f2847] border-[#090d1a] text-amber-100/85 shadow-[inset_0_2px_0_rgba(255,255,255,0.08),0_2px_0_#090c14]'
            }`}
          >
            <RoomTabIcon id={tab.id} />
            <span className="text-[6.5px] leading-none tracking-tight">{tab.label}</span>
            {lowNeed && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#090c14]"
                aria-label={`${tab.label} needs attention`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
