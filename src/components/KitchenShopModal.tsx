import React, { useEffect, useRef } from 'react';
import { FOODS, FoodId, FRIDGE_CAPACITY } from '../game/types';

interface KitchenShopModalProps {
  open: boolean;
  coins: number;
  fridgeCount: number;
  fridgeCapacity?: number;
  onClose: () => void;
  onBuy: (foodId: FoodId) => void;
}

function FoodPixelIcon({ id }: { id: FoodId }) {
  if (id === 'fish') {
    return (
      <svg viewBox="0 0 20 20" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="3" y="6" width="10" height="8" fill="#6ec8f5" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="13" y="5" width="4" height="10" fill="#48a3d4" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="6" y="8" width="2" height="2" fill="#090d1a" />
        <rect x="5" y="7" width="4" height="1.5" fill="#b8ebff" />
      </svg>
    );
  }
  if (id === 'milk') {
    return (
      <svg viewBox="0 0 20 20" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="5" y="5" width="10" height="12" fill="#ffffff" stroke="#090d1a" strokeWidth="1.5" />
        <polygon points="5,5 10,2 15,5" fill="#d9ecff" stroke="#090d1a" strokeWidth="1.4" />
        <rect x="6" y="9" width="8" height="4" fill="#6ec8f5" />
      </svg>
    );
  }
  if (id === 'boba') {
    return (
      <svg viewBox="0 0 20 20" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="9" y="1" width="2.5" height="6" fill="#ff6b9d" stroke="#090d1a" strokeWidth="1" />
        <rect x="5" y="6" width="10" height="11" fill="#e6b88a" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="4" y="5" width="12" height="2.5" fill="#fff5e6" stroke="#090d1a" strokeWidth="1.2" />
        <rect x="6.5" y="13" width="2" height="2" fill="#2e1a12" />
        <rect x="9.5" y="14" width="2" height="2" fill="#2e1a12" />
        <rect x="12" y="12.5" width="2" height="2" fill="#2e1a12" />
      </svg>
    );
  }
  if (id === 'sushi') {
    return (
      <svg viewBox="0 0 20 20" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="3" y="8" width="14" height="7" fill="#ffffff" stroke="#090d1a" strokeWidth="1.5" />
        <rect x="3" y="5" width="14" height="4.5" fill="#ff7b54" stroke="#090d1a" strokeWidth="1.4" />
        <rect x="8.5" y="5" width="3" height="10" fill="#1e2b24" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="w-7 h-7 shrink-0" aria-hidden="true">
      <rect x="3" y="9" width="14" height="8" fill="#ffe0b2" stroke="#090d1a" strokeWidth="1.5" />
      <rect x="3" y="6" width="14" height="4" fill="#ff9ec0" stroke="#090d1a" strokeWidth="1.4" />
      <rect x="8" y="3" width="4" height="4" fill="#ff4d6d" stroke="#090d1a" strokeWidth="1.2" />
    </svg>
  );
}

export const KitchenShopModal: React.FC<KitchenShopModalProps> = ({
  open,
  coins,
  fridgeCount,
  fridgeCapacity = FRIDGE_CAPACITY,
  onClose,
  onBuy,
}) => {
  const swipeStartYRef = useRef<number | null>(null);

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

  const isFridgeFull = fridgeCount >= fridgeCapacity;
  const fillPct = Math.min(100, Math.round((fridgeCount / fridgeCapacity) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#07100c]/82"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kitchen-shop-title"
      data-testid="kitchen-shop-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mobile-sheet-enter w-full sm:max-w-[390px] bg-[#242e4f] border-t-4 border-x-0 border-b-0 sm:border-4 border-[#0a0c14] rounded-t-2xl rounded-b-none sm:rounded-xl px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_0_rgba(0,0,0,0.5)] flex flex-col gap-3 max-h-[86dvh] sm:max-h-[90dvh] overflow-y-auto overscroll-contain">
        {/* Mobile Bottom-Sheet Drag Handle */}
        <div
          className="sm:hidden flex justify-center py-1 -mt-1 cursor-grab touch-none"
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          aria-hidden="true"
        >
          <div className="w-11 h-1.5 rounded-full bg-slate-400/55" />
        </div>

        <div
          className="flex items-center justify-between gap-2"
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 18 18" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path
                d="M1.5 3H4L5.8 11.5H14.5L16.5 5.5H5"
                fill="none"
                stroke="#ffd43b"
                strokeWidth="2"
                strokeLinecap="square"
              />
              <circle cx="7" cy="14.5" r="1.6" fill="#ffd43b" />
              <circle cx="13.5" cy="14.5" r="1.6" fill="#ffd43b" />
            </svg>
            <h2 id="kitchen-shop-title" className="text-[10.5px] sm:text-[11px] text-amber-200">
              MEADOW GROCERY
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-btn !py-1.5 !px-2.5 !text-[8.5px]"
            aria-label="Close grocery shop"
          >
            X
          </button>
        </div>

        {/* Coins + Fridge Capacity Bar */}
        <div className="bg-[#151c33] border-2 border-[#090d1a] rounded-lg p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[8px]">
            <span className={isFridgeFull ? 'text-rose-300' : 'text-emerald-300'} data-testid="shop-fridge-status">
              {isFridgeFull
                ? `FRIDGE FULL (${fridgeCount}/${fridgeCapacity})`
                : `FRIDGE SPACE: ${fridgeCount}/${fridgeCapacity}`}
            </span>
            <span className="text-amber-300 tabular-nums" data-testid="shop-coins">
              COINS: {coins}
            </span>
          </div>
          <div className="stat-track">
            <div
              className={`stat-fill ${isFridgeFull ? 'bg-rose-500' : 'bg-emerald-400'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          {isFridgeFull && (
            <p className="text-[7.5px] text-rose-200 leading-relaxed">
              Your fridge is packed! Close shop & drag items from the fridge to the table.
            </p>
          )}
        </div>

        {/* Grocery List */}
        <div className="flex flex-col gap-2">
          {FOODS.map((food) => {
            const canAfford = coins >= food.cost;
            const disabled = isFridgeFull || !canAfford;
            return (
              <div
                key={food.id}
                className="flex items-center justify-between gap-2.5 bg-[#1b233d] border-2 border-[#090d1a] rounded-lg px-2.5 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-[#12182b] border-2 border-[#090d1a] flex items-center justify-center shrink-0">
                    <FoodPixelIcon id={food.id} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[9px] text-amber-50">{food.label}</span>
                    <span className="text-[7px] text-emerald-300/90 leading-snug">
                      +{food.hunger} HGR · +{food.fun} FUN
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`shop-buy-${food.id}`}
                  disabled={disabled}
                  onClick={() => onBuy(food.id)}
                  className={`px-btn min-h-[38px] !px-2.5 !py-1.5 !text-[8px] shrink-0 ${
                    isFridgeFull
                      ? '!bg-[#4f3b4a] !text-rose-200 opacity-80 cursor-not-allowed'
                      : !canAfford
                        ? '!bg-[#3a405a] !text-slate-300 opacity-70 cursor-not-allowed'
                        : 'px-btn-green'
                  }`}
                >
                  {isFridgeFull ? 'FULL' : food.cost === 0 ? 'FREE' : `${food.cost}C`}
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-btn px-btn-amber min-h-[42px] w-full !text-[9px]"
        >
          DONE SHOPPING
        </button>
      </div>
    </div>
  );
};
