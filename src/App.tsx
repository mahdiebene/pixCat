import { useEffect, useRef, useState } from 'react';
import { CatProfileModal, ProfileTab } from './components/CatProfileModal';
import { HudBar } from './components/HudBar';
import { KitchenShopModal } from './components/KitchenShopModal';
import { MobileRoomDock } from './components/MobileRoomDock';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RenameModal } from './components/RenameModal';
import { MochiGameEngine } from './game/engine';
import { createInitialProgress, isValidRoomScreen } from './game/logic';
import { FRIDGE_CAPACITY, H, HudSnapshot, ROOM_HINTS, ScreenId, W } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  screen: 'title',
  miniGameActive: false,
  petName: 'MOCHI',
  coins: 25,
  muted: false,
  stats: { hunger: 82, hygiene: 78, energy: 85, fun: 80 },
  hint: ROOM_HINTS.title,
  fridgeCount: 2,
  fridgeCapacity: FRIDGE_CAPACITY,
  tableCount: 0,
  profile: {
    fur: 'classic',
    accessory: 'none',
    ownedAccessories: ['none', 'bow'],
    highScore: 0,
    progress: createInitialProgress(),
  },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MochiGameEngine | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [toast, setToast] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>('overview');
  const [renameOpen, setRenameOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const requestedRoom = params.get('room');
    let initialScreen: ScreenId = 'title';
    if (requestedRoom && isValidRoomScreen(requestedRoom)) {
      initialScreen = requestedRoom;
    } else if (autostart) {
      initialScreen = 'hub';
    }

    const engine = new MochiGameEngine(canvas, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onToast: (message) => {
        setToast(message);
        if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(''), 2600);
      },
    });

    engineRef.current = engine;
    engine.start(initialScreen);

    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keep engine modal lock strictly synchronized across all overlays
  useEffect(() => {
    engineRef.current?.setModalOpen(renameOpen || shopOpen || profileOpen || installModalOpen);
  }, [renameOpen, shopOpen, profileOpen, installModalOpen]);

  // Automatically close kitchen shop if player navigates away from kitchen
  useEffect(() => {
    if (hud.screen !== 'kitchen' && shopOpen) {
      setShopOpen(false);
    }
  }, [hud.screen, shopOpen]);

  const openProfile = (tab: ProfileTab = 'overview') => {
    setProfileTab(tab);
    setProfileOpen(true);
  };
  const closeProfile = () => setProfileOpen(false);
  const openRename = () => {
    setProfileOpen(false);
    setRenameOpen(true);
  };
  const closeRename = () => setRenameOpen(false);
  const openShop = () => setShopOpen(true);
  const closeShop = () => setShopOpen(false);

  const saveRename = (name: string) => {
    const res = engineRef.current?.renamePet(name);
    if (res?.ok) {
      setRenameOpen(false);
      setProfileOpen(true);
    }
  };

  const showMobileDock = hud.screen !== 'title' && !hud.miniGameActive;
  const fridgeFull = hud.fridgeCount >= hud.fridgeCapacity;

  return (
    <main className="h-[100dvh] sm:min-h-[100dvh] sm:h-auto w-full flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden sm:overflow-visible">
      <OfflineIndicator />

      <div className="w-full h-full sm:h-auto sm:max-w-[820px] flex flex-col">
        <div className="pixel-frame flex-1 min-h-0 sm:flex-none flex flex-col sm:gap-2 sm:p-2.5">
          {/* Top HUD Bar (Visible on Hub and all Rooms, hidden on Title Screen) */}
          {hud.screen !== 'title' && (
            <HudBar
              hud={hud}
              onOpenProfile={openProfile}
              onToggleMute={() => engineRef.current?.toggleMute()}
              onNavigate={() => {
                if (shopOpen) setShopOpen(false);
                if (profileOpen) setProfileOpen(false);
                engineRef.current?.navigateFromHud();
              }}
              onModalToggle={(open) => setInstallModalOpen(open)}
            />
          )}

          {/* Full-Bleed Mobile Portrait / Crisp 4:3 Desktop Interactive Stage */}
          <div className="canvas-stage" data-testid="canvas-stage">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="pixel-canvas w-full h-full"
              data-testid="game-canvas"
              aria-label="Mochi Pixel Talking Cat interactive room canvas"
            />

            {/* Kitchen Shopping Cart CTA anchored over upper-right meadow negative space */}
            {hud.screen === 'kitchen' && (
              <button
                type="button"
                data-testid="kitchen-shop-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  openShop();
                }}
                aria-label={`Open grocery shop (${hud.fridgeCount} of ${hud.fridgeCapacity} in fridge)`}
                className={`absolute top-2.5 right-2.5 z-10 px-btn min-h-[42px] !py-1.5 !px-2.5 !text-[8.5px] ${
                  fridgeFull ? '!bg-[#c94a68] !text-white' : 'px-btn-amber'
                }`}
              >
                <svg viewBox="0 0 18 18" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    d="M1.5 3H4L5.8 11.5H14.5L16.5 5.5H5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                  <circle cx="7" cy="14.5" r="1.5" fill="currentColor" />
                  <circle cx="13.5" cy="14.5" r="1.5" fill="currentColor" />
                </svg>
                <span>{fridgeFull ? 'FULL' : `${hud.fridgeCount}/${hud.fridgeCapacity}`}</span>
              </button>
            )}

            {/* Accessible Title Screen PLAY CTA anchored cleanly in thumb zone */}
            {hud.screen === 'title' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-[10%] sm:bottom-[13%] pb-[env(safe-area-inset-bottom)] sm:pb-0 flex flex-col items-center gap-3 px-4">
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    engineRef.current?.startGameFromTitle();
                  }}
                  className="pointer-events-auto px-play-btn min-h-[52px] sm:min-h-0 px-10 sm:px-7 py-3 sm:py-2.5 text-[15px] tracking-wider"
                >
                  PLAY
                </button>
                <div className="pointer-events-auto">
                  <PWAInstallButton
                    onModalToggle={(open) => setInstallModalOpen(open)}
                  />
                </div>
              </div>
            )}

            {/* Non-intrusive Pixel Toast Feedback */}
            {toast && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 bg-[#f4efe6] text-[#2a3356] border-[3px] border-[#0a0c14] rounded-lg px-3 py-1.5 text-[8.5px] leading-relaxed shadow-[0_4px_0_rgba(0,0,0,0.45)] text-center max-w-[90%] z-20"
              >
                {toast}
              </div>
            )}
          </div>

          {/* Single-Line Quiet Diegetic Hint Strip (Compact 1-line on mobile to maximize canvas space) */}
          <div
            className={`hint-bar shrink-0 rounded-none sm:rounded-[10px] border-x-0 sm:border-[3px] px-2.5 sm:px-3 py-1 sm:py-2 text-center text-[7px] sm:text-[8.5px] text-amber-100/90 leading-snug sm:leading-relaxed truncate sm:whitespace-normal ${
              hud.screen === 'title' ? 'hidden sm:block' : 'block'
            } ${!showMobileDock ? 'pb-[calc(env(safe-area-inset-bottom)+8px)] sm:pb-2' : ''}`}
            data-testid="room-hint"
            title={hud.hint}
          >
            {hud.hint}
          </div>

          {/* Thumb-Zone Bottom Room Navigation Dock (Mobile Only) */}
          {showMobileDock && (
            <MobileRoomDock
              hud={hud}
              onSelectRoom={(room) => {
                if (shopOpen) closeShop();
                engineRef.current?.navigateToRoom(room);
              }}
            />
          )}
        </div>
      </div>

      <CatProfileModal
        open={profileOpen}
        initialTab={profileTab}
        hud={hud}
        onClose={closeProfile}
        onOpenRename={openRename}
        onAdvanceDay={() => {
          engineRef.current?.advanceDay();
        }}
      />

      <RenameModal
        open={renameOpen}
        currentName={hud.petName}
        onCancel={closeRename}
        onSave={saveRename}
      />

      <KitchenShopModal
        open={shopOpen}
        coins={hud.coins}
        fridgeCount={hud.fridgeCount}
        fridgeCapacity={hud.fridgeCapacity}
        onClose={closeShop}
        onBuy={(foodId) => {
          engineRef.current?.buyGroceryItem(foodId);
        }}
      />
    </main>
  );
}
