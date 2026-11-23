import React, { useEffect, useRef, useState } from 'react';
import {
  getAverageWellness,
  getBondLevelInfo,
  getCatMoodSummary,
  getDailyCareCount,
  getProfileMilestones,
} from '../game/logic';
import {
  ACCESSORIES,
  AccessoryId,
  CareTaskKey,
  DayLogEntry,
  FUR_PALETTES,
  FurId,
  HudSnapshot,
  StatKey,
} from '../game/types';

export type ProfileTab = 'overview' | 'days' | 'milestones';

interface CatProfileModalProps {
  open: boolean;
  initialTab?: ProfileTab;
  hud: HudSnapshot;
  onClose: () => void;
  onOpenRename: () => void;
  onAdvanceDay: () => void;
}

const VITAL_META: Array<{ key: StatKey; label: string; barClass: string }> = [
  { key: 'hunger', label: 'Hunger', barClass: 'bg-emerald-400' },
  { key: 'hygiene', label: 'Hygiene', barClass: 'bg-sky-400' },
  { key: 'energy', label: 'Energy', barClass: 'bg-purple-400' },
  { key: 'fun', label: 'Fun', barClass: 'bg-pink-400' },
];

const CARE_TASKS: Array<{ key: CareTaskKey; label: string; room: string }> = [
  { key: 'fed', label: 'Feed', room: 'Kitchen' },
  { key: 'bathed', label: 'Bath', room: 'Bathroom' },
  { key: 'played', label: 'Play', room: 'Playroom' },
  { key: 'slept', label: 'Rest', room: 'Bedroom' },
];

function CatPortraitSvg({ fur, accessory }: { fur: FurId; accessory: AccessoryId }) {
  const pal = FUR_PALETTES[fur] ?? FUR_PALETTES.classic;
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-16 h-16 shrink-0"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      {/* Cozy meadow portrait backdrop */}
      <rect x="0" y="0" width="32" height="32" fill="#17243b" />
      <rect x="0" y="22" width="32" height="10" fill="#29483b" />
      <rect x="3" y="4" width="2" height="2" fill="#ffe066" opacity="0.6" />
      <rect x="26" y="6" width="2" height="2" fill="#ffe066" opacity="0.5" />

      {/* Ears */}
      <rect x="6" y="7" width="6" height="6" fill={pal.patch} stroke={pal.outline} strokeWidth="1.5" />
      <rect x="20" y="7" width="6" height="6" fill={pal.patch} stroke={pal.outline} strokeWidth="1.5" />
      <rect x="8" y="9" width="2.5" height="2.5" fill={pal.earInner} />
      <rect x="21.5" y="9" width="2.5" height="2.5" fill={pal.earInner} />

      {/* Shoulders */}
      <rect x="8" y="23" width="16" height="7" fill={pal.body} stroke={pal.outline} strokeWidth="1.5" />
      <rect x="11" y="25" width="10" height="5" fill={pal.shade} opacity="0.5" />

      {/* Head */}
      <rect x="6" y="11" width="20" height="14" fill={pal.body} stroke={pal.outline} strokeWidth="1.5" />
      {/* Forehead patch */}
      <rect x="7" y="12" width="7" height="4" fill={pal.patch} />
      <rect x="20" y="12" width="5" height="3" fill={pal.patch} />

      {/* Eyes */}
      <rect x="10" y="16" width="3" height="3.5" fill={pal.outline} />
      <rect x="19" y="16" width="3" height="3.5" fill={pal.outline} />
      <rect x="10.5" y="16.5" width="1.2" height="1.2" fill="#ffffff" />
      <rect x="19.5" y="16.5" width="1.2" height="1.2" fill="#ffffff" />

      {/* Blush & nose/smile */}
      <rect x="8" y="19.5" width="2.5" height="1.5" fill={pal.blush} />
      <rect x="21.5" y="19.5" width="2.5" height="1.5" fill={pal.blush} />
      <rect x="15" y="19.5" width="2" height="1.5" fill="#eb6c7d" />
      <rect x="13.5" y="21.5" width="5" height="1.2" fill={pal.outline} />

      {/* Equipped accessory */}
      {accessory === 'bow' && (
        <g>
          <rect x="18" y="7" width="3.5" height="3" fill="#ff5e99" stroke="#09090d" strokeWidth="1" />
          <rect x="22" y="7" width="3.5" height="3" fill="#ff5e99" stroke="#09090d" strokeWidth="1" />
          <rect x="20.5" y="7.5" width="2" height="2" fill="#ffd1e3" />
        </g>
      )}
      {accessory === 'shades' && (
        <g>
          <rect x="8.5" y="15.5" width="6" height="4" fill="#182034" stroke="#09090d" strokeWidth="1" />
          <rect x="17.5" y="15.5" width="6" height="4" fill="#182034" stroke="#09090d" strokeWidth="1" />
          <rect x="14.5" y="16.5" width="3" height="1.5" fill="#09090d" />
          <rect x="9.5" y="16.5" width="2" height="1" fill="#7ce0ff" />
          <rect x="18.5" y="16.5" width="2" height="1" fill="#7ce0ff" />
        </g>
      )}
      {accessory === 'daisy' && (
        <g>
          <rect x="20" y="6.5" width="5" height="5" fill="#ffffff" stroke="#09090d" strokeWidth="1" />
          <rect x="21.5" y="8" width="2" height="2" fill="#ffd43b" />
        </g>
      )}
      {accessory === 'scarf' && (
        <g>
          <rect x="7" y="23.5" width="18" height="3.5" fill="#e6485d" stroke="#09090d" strokeWidth="1" />
          <rect x="19" y="26.5" width="4" height="4" fill="#e6485d" stroke="#09090d" strokeWidth="1" />
          <rect x="10" y="24.5" width="3" height="1.5" fill="#ffd43b" />
          <rect x="16" y="24.5" width="3" height="1.5" fill="#ffd43b" />
        </g>
      )}
      {accessory === 'frog' && (
        <g>
          <rect x="7" y="7" width="18" height="5" fill="#5cc86b" stroke="#09090d" strokeWidth="1.2" />
          <rect x="9" y="4.5" width="4" height="4" fill="#5cc86b" stroke="#09090d" strokeWidth="1" />
          <rect x="19" y="4.5" width="4" height="4" fill="#5cc86b" stroke="#09090d" strokeWidth="1" />
          <rect x="10.2" y="5.7" width="1.6" height="1.6" fill="#09090d" />
          <rect x="20.2" y="5.7" width="1.6" height="1.6" fill="#09090d" />
        </g>
      )}
      {accessory === 'crown' && (
        <g>
          <polygon
            points="10,11 10,5.5 13.5,8.5 16,4.5 18.5,8.5 22,5.5 22,11"
            fill="#ffd43b"
            stroke="#09090d"
            strokeWidth="1.2"
          />
          <rect x="15" y="8" width="2" height="2" fill="#ff4d6d" />
        </g>
      )}
    </svg>
  );
}

export const CatProfileModal: React.FC<CatProfileModalProps> = ({
  open,
  initialTab = 'overview',
  hud,
  onClose,
  onOpenRename,
  onAdvanceDay,
}) => {
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const swipeStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartYRef.current === null || e.changedTouches.length === 0) return;
    const dy = e.changedTouches[0].clientY - swipeStartYRef.current;
    swipeStartYRef.current = null;
    if (dy > 62) {
      onClose();
    }
  };

  if (!open) return null;

  const { profile, stats, petName } = hud;
  const { progress } = profile;
  const bond = getBondLevelInfo(progress.xp);
  const mood = getCatMoodSummary(stats);
  const todayCareCount = getDailyCareCount(progress.todayCare);
  const todayAvgWellness = getAverageWellness(stats);
  const milestones = getProfileMilestones(profile);
  const unlockedMilestones = milestones.filter((m) => m.unlocked).length;
  const ownedWardrobe = profile.ownedAccessories.filter((id) => id !== 'none').length;
  const furLabel = FUR_PALETTES[profile.fur]?.name ?? 'CLASSIC';

  // Combine archived prior days + live Today entry for the 7-day progress chart
  const liveTodayEntry: DayLogEntry & { isToday?: boolean } = {
    dayNumber: progress.currentDay,
    date: progress.lastVisitDate,
    careCount: todayCareCount,
    avgWellness: todayAvgWellness,
    xpEarned: progress.todayXp,
    perfect: todayCareCount === 4,
    isToday: true,
  };
  const recentTimeline: Array<DayLogEntry & { isToday?: boolean }> = [
    ...progress.dayHistory.slice(-6),
    liveTodayEntry,
  ];
  const recentLogDescending = [...recentTimeline].reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#07100c]/82"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-profile-title"
      data-testid="cat-profile-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mobile-sheet-enter w-full sm:max-w-[440px] bg-[#242e4f] border-t-4 border-x-0 border-b-0 sm:border-4 border-[#0a0c14] rounded-t-2xl rounded-b-none sm:rounded-xl px-3.5 sm:px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+14px)] sm:p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_0_rgba(0,0,0,0.5)] flex flex-col gap-2.5 sm:gap-3.5 max-h-[92dvh] overflow-y-auto overscroll-contain">
        {/* Mobile Bottom-Sheet Drag Handle (swipe down to close) */}
        <div
          className="sm:hidden flex justify-center py-1 -mt-1 cursor-grab touch-none"
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          aria-hidden="true"
        >
          <div className="w-11 h-1.5 rounded-full bg-slate-400/55" />
        </div>

        {/* Identity Header */}
        <div
          className="flex items-start justify-between gap-3"
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-lg overflow-hidden border-[3px] border-[#090d1a] bg-[#151c33] shrink-0">
              <CatPortraitSvg fur={profile.fur} accessory={profile.accessory} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2
                  id="cat-profile-title"
                  className="text-[12px] sm:text-[13px] text-amber-100 truncate"
                  data-testid="profile-pet-name"
                >
                  {petName}
                </h2>
                <button
                  type="button"
                  data-testid="profile-rename-btn"
                  onClick={onOpenRename}
                  className="text-[7.5px] text-sky-300 hover:text-sky-200 underline underline-offset-4 whitespace-nowrap shrink-0 py-1 px-1"
                  aria-label={`Rename ${petName}`}
                >
                  Edit
                </button>
              </div>
              {/* Unboxed clean metadata with typographic separators */}
              <div
                className="text-[7.5px] text-slate-300 leading-snug whitespace-nowrap truncate"
                data-testid="profile-meta"
              >
                <span>{bond.stageName}</span>
                <span className="mx-1 text-slate-500" aria-hidden="true">·</span>
                <span className="text-amber-200 tabular-nums">Day {progress.currentDay}</span>
              </div>
              <div className="text-[7px] text-slate-400 leading-snug whitespace-nowrap truncate">
                <span className="text-emerald-300/90 tabular-nums">{progress.streakDays}d streak</span>
                <span className="mx-1 text-slate-500" aria-hidden="true">·</span>
                <span>Coat: {furLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-btn min-h-[38px] min-w-[38px] !py-1.5 !px-2.5 !text-[8.5px] shrink-0"
            aria-label="Close cat profile"
          >
            X
          </button>
        </div>

        {/* Bond Level Progress Bar */}
        <div className="bg-[#151c33] border-2 border-[#090d1a] rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[8px]">
            <span className="text-amber-200" data-testid="profile-bond-level">
              BOND LV.{bond.level}
            </span>
            <span className="text-slate-300 tabular-nums" data-testid="profile-bond-xp">
              {bond.xpInLevel} / {bond.xpForNext} XP
            </span>
          </div>
          <div className="stat-track">
            <div
              className="stat-fill bg-amber-400"
              style={{ width: `${bond.progressPct}%` }}
            />
          </div>
        </div>

        {/* Functional Segmented Tab Controls */}
        <div
          className="grid grid-cols-3 gap-1 p-1 bg-[#151c33] border-2 border-[#090d1a] rounded-lg"
          role="tablist"
          aria-label="Cat profile sections"
        >
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'days', label: 'Days' },
              { id: 'milestones', label: 'Awards' },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`profile-tab-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`min-h-[38px] rounded-md px-2 py-1.5 text-[8px] sm:text-[8.5px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#364677] text-amber-100 border-2 border-[#090d1a]'
                    : 'bg-transparent text-slate-300 hover:text-white border-2 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-3.5" data-testid="profile-panel-overview">
            {/* Current Wellness & Live Vitals */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px]">
                <span className="text-slate-200">Current Vitals</span>
                <span
                  className={
                    mood.tone === 'rose'
                      ? 'text-rose-300'
                      : mood.tone === 'amber'
                        ? 'text-amber-200'
                        : 'text-emerald-300'
                  }
                  data-testid="profile-mood"
                >
                  {mood.label} · {mood.avgWellness}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-[#1b233d] border-2 border-[#090d1a] rounded-lg p-3">
                {VITAL_META.map((v) => {
                  const val = stats[v.key];
                  const fillClass =
                    val < 25 ? 'bg-rose-500' : val < 50 ? 'bg-amber-400' : v.barClass;
                  return (
                    <div key={v.key} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[7.5px] text-slate-200">
                        <span>{v.label}</span>
                        <span className="tabular-nums">{val}%</span>
                      </div>
                      <div className="stat-track">
                        <div className={`stat-fill ${fillClass}`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Today's 4-Part Daily Care Routine */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px]">
                <span className="text-slate-200">Day {progress.currentDay} Care Routine</span>
                <span
                  className={
                    todayCareCount === 4 ? 'text-amber-300' : 'text-slate-300'
                  }
                  data-testid="profile-today-care"
                >
                  {todayCareCount}/4 {todayCareCount === 4 ? '· Perfect!' : '· +20C all 4'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {CARE_TASKS.map((task) => {
                  const done = progress.todayCare[task.key];
                  return (
                    <div
                      key={task.key}
                      data-testid={`care-task-${task.key}`}
                      className={`rounded-lg border-2 px-1.5 py-2 flex flex-col items-center gap-1 text-center ${
                        done
                          ? 'bg-[#1b362b] border-emerald-500/70 text-emerald-200'
                          : 'bg-[#182038] border-[#090d1a] text-slate-300'
                      }`}
                    >
                      <span className="text-[8px]">{task.label}</span>
                      <span className="text-[6.5px] opacity-90">
                        {done ? 'Done' : task.room}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Lifetime Care Stats */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[8px]">
                <span className="text-slate-200">Lifetime Care Stats</span>
                <span className="text-slate-400 tabular-nums">{progress.xp} total XP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-[#1b233d] border-2 border-[#090d1a] rounded-lg p-3">
                {[
                  { label: 'Meals', val: progress.lifetime.mealsServed },
                  { label: 'Baths', val: progress.lifetime.bathsGiven },
                  { label: 'Pets', val: progress.lifetime.petsGiven },
                  { label: 'Naps', val: progress.lifetime.napsTaken },
                  { label: 'Best Catch', val: profile.highScore },
                  { label: 'Wardrobe', val: `${ownedWardrobe}/${ACCESSORIES.length}` },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <span className="text-[7px] text-slate-400">{stat.label}</span>
                    <span className="text-[10px] text-amber-100 tabular-nums">{stat.val}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: PROGRESS OVER DAYS */}
        {tab === 'days' && (
          <div className="flex flex-col gap-2.5 sm:gap-3.5" data-testid="profile-panel-days">
            {/* Day Summary Strip */}
            <div className="grid grid-cols-3 gap-2 bg-[#1b233d] border-2 border-[#090d1a] rounded-lg p-2.5 sm:p-3">
              <div className="flex flex-col gap-1">
                <span className="text-[7px] text-slate-400">Current Day</span>
                <span className="text-[11px] text-amber-200 tabular-nums" data-testid="days-current">
                  Day {progress.currentDay}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] text-slate-400">Streak</span>
                <span className="text-[11px] text-emerald-300 tabular-nums" data-testid="days-streak">
                  {progress.streakDays}d
                </span>
                <span className="text-[6.5px] text-slate-400 tabular-nums">
                  Best {progress.bestStreak}d
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] text-slate-400">Perfect Days</span>
                <span className="text-[11px] text-sky-300 tabular-nums" data-testid="days-perfect">
                  {progress.perfectDays}
                </span>
              </div>
            </div>

            {/* 7-Day Wellness & Care Chart */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[8px]">
                <span className="text-slate-200">Daily Wellness Trend</span>
                <span className="text-slate-400">Last {recentTimeline.length}d</span>
              </div>
              <div
                className="bg-[#151c33] border-2 border-[#090d1a] rounded-lg px-2.5 pt-2.5 pb-2"
                data-testid="days-chart"
              >
                <div className="grid grid-cols-7 gap-1.5 items-end h-[84px]">
                  {Array.from({ length: 7 }, (_, idx) => {
                    const entry = recentTimeline[idx];
                    if (!entry) {
                      return (
                        <div key={`empty-${idx}`} className="flex flex-col items-center gap-1 h-full justify-end">
                          <div className="w-full h-2 rounded-sm bg-[#232d4d]/60" />
                          <span className="text-[6.5px] text-slate-500">·</span>
                        </div>
                      );
                    }
                    const barHeight = Math.max(12, Math.round((entry.avgWellness / 100) * 62));
                    const barColor = entry.perfect
                      ? 'bg-amber-400'
                      : entry.isToday
                        ? 'bg-emerald-400'
                        : 'bg-sky-400';
                    return (
                      <div
                        key={`day-${entry.dayNumber}-${idx}`}
                        className="flex flex-col items-center gap-1 h-full justify-end"
                        title={`Day ${entry.dayNumber}: ${entry.avgWellness}% wellness, ${entry.careCount}/4 care`}
                      >
                        <span className="text-[6.5px] text-slate-300 tabular-nums">
                          {entry.avgWellness}%
                        </span>
                        <div className="w-full flex items-end justify-center h-[62px]">
                          <div
                            className={`w-full max-w-[26px] rounded-t-sm border border-[#090d1a] ${barColor}`}
                            style={{ height: `${barHeight}px` }}
                          />
                        </div>
                        <span
                          className={`text-[6.5px] tabular-nums ${
                            entry.isToday ? 'text-amber-200' : 'text-slate-400'
                          }`}
                        >
                          D{entry.dayNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2 text-[6.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                    <span className="text-emerald-300">Today</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-sky-300">Past</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">★ Perfect</span>
                  </span>
                  <span className="text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                    {progress.totalDaysVisited} visits
                  </span>
                </div>
              </div>
            </section>

            {/* Daily Journal Rows */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-[8px]">
                <span className="text-slate-200">Care Journal</span>
                <span className="text-[6.5px] text-slate-400 tabular-nums whitespace-nowrap">
                  Since {progress.startedDate}
                </span>
              </div>
              <div className="bg-[#1b233d] border-2 border-[#090d1a] rounded-lg divide-y divide-slate-700/50 max-h-[124px] overflow-y-auto">
                {recentLogDescending.map((entry, idx) => (
                  <div
                    key={`${entry.dayNumber}-${idx}`}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-[7.5px]"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-amber-100 tabular-nums">
                        Day {entry.dayNumber} {entry.isToday ? '· Today' : `· ${entry.date}`}
                      </span>
                      <span className="text-[6.5px] text-slate-400 tabular-nums">
                        {entry.careCount}/4 care · +{entry.xpEarned} XP
                      </span>
                    </div>
                    <span
                      className={`tabular-nums shrink-0 ${
                        entry.perfect
                          ? 'text-amber-300'
                          : entry.avgWellness >= 70
                            ? 'text-emerald-300'
                            : 'text-slate-300'
                      }`}
                    >
                      {entry.avgWellness}%{entry.perfect ? ' ★' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Next Day Progression Control */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <button
                type="button"
                data-testid="advance-day-btn"
                disabled={todayCareCount < 1}
                onClick={onAdvanceDay}
                className={`px-btn min-h-[42px] w-full !text-[8.5px] ${
                  todayCareCount < 1
                    ? '!bg-[#3a405a] !text-slate-300 opacity-75 cursor-not-allowed'
                    : 'px-btn-green'
                }`}
              >
                {todayCareCount < 1
                  ? `CARE FOR ${petName} TO START DAY ${progress.currentDay + 1}`
                  : `TUCK IN & START DAY ${progress.currentDay + 1}`}
              </button>
              <p className="text-[6.5px] text-slate-400 text-center leading-relaxed">
                {todayCareCount < 1
                  ? 'Feed, bathe, play, or rest with your kitty to log today.'
                  : todayCareCount >= 2
                    ? 'Logs today in your journal, refreshes morning goals & awards +6 Coins.'
                    : 'Do 1 more care task for +6 Morning Coins, or start the next day now.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: MILESTONES */}
        {tab === 'milestones' && (
          <div className="flex flex-col gap-2.5" data-testid="profile-panel-milestones">
            <div className="flex items-center justify-between text-[8px]">
              <span className="text-slate-200">Meadow Milestones</span>
              <span className="text-amber-200 tabular-nums">
                {unlockedMilestones} / {milestones.length} unlocked
              </span>
            </div>

            <div className="bg-[#1b233d] border-2 border-[#090d1a] rounded-lg divide-y divide-slate-700/50">
              {milestones.map((m) => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={m.id} className="px-3 py-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-[8px]">
                      <span className={m.unlocked ? 'text-amber-200' : 'text-slate-100'}>
                        {m.title}
                      </span>
                      <span
                        className={`tabular-nums shrink-0 text-[7px] ${
                          m.unlocked ? 'text-emerald-300' : 'text-slate-400'
                        }`}
                      >
                        {m.unlocked ? 'Unlocked' : `${m.current}/${m.target}`}
                      </span>
                    </div>
                    <p className="text-[7px] text-slate-400 leading-relaxed">{m.description}</p>
                    <div className="stat-track">
                      <div
                        className={`stat-fill ${m.unlocked ? 'bg-amber-400' : 'bg-sky-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
