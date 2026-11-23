import { RetroAudio } from './audio';
import { triggerHaptic } from './haptics';
import {
  adjustStat,
  AdvanceDayResult,
  advanceToNextDay,
  applyPersistedJson,
  buyFoodToFridge,
  CareActivityKind,
  clamp,
  clampBathroomDuckPosition,
  computeStageViewport,
  consumeTableFood,
  createInitialState,
  detectRoomSwipe,
  dist,
  extractPersistedData,
  finishMiniGame,
  getCatAnchor,
  getDraggedItemPoint,
  getScreenHint,
  getTouchHitPadding,
  hitTestHubCard,
  inRect,
  isPointInBed,
  isPointOnKitchenTable,
  moveFridgeItemToTable,
  moveTableItemToFridge,
  PurchaseFeedResult,
  recordCareActivity,
  resetMiniGame,
  resolveFlyingFood,
  sanitizePetName,
  screenPointToWorld,
  stepMiniGame,
  stepToyMouse,
  stepYarnPhysics,
  syncDailyProgress,
  tryEquipAccessory,
} from './logic';
import {
  drawHubScreen,
  drawSeamlessMeadow,
  drawTitleScreen,
  setFullBleedMeadowActive,
} from './renderer/meadow';
import {
  drawBathroom,
  drawBedroom,
  drawPlayroom,
  MG_EXIT_RECT,
  MG_PLAY_AGAIN_RECT,
  MG_TOP_EXIT_RECT,
} from './renderer/roomsPart1';
import {
  drawCloset,
  drawDraggedOverlay,
  drawKitchen,
  drawParticles,
  drawSpeechBubble,
  drawTransitionOverlay,
} from './renderer/roomsPart2';
import {
  ACCESSORIES,
  FOODS,
  FoodDef,
  FoodId,
  FRIDGE_CAPACITY,
  FRIDGE_SLOTS,
  FUR_PALETTES,
  GameState,
  H,
  HudSnapshot,
  Particle,
  RoomId,
  ScreenId,
  StageViewport,
  STORAGE_KEY,
  TABLE_SLOTS,
  W,
} from './types';

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onToast: (message: string) => void;
}

const SWEET_LINES = ['PURR~ <3', 'I <3 U!', 'SO COZY!', 'NYAA~', 'BESTIES!', 'HEHE!'];
const MEOW_LINES = ['MEOW!', 'MEW MEW~', 'FISH PLS!', 'LOVE U!', 'PRRR~', 'NYAN!'];
const PARTICLE_POOL_SIZE = 128;

export class MochiGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private audio: RetroAudio;
  private callbacks: EngineCallbacks;
  private particles: Particle[];
  private particleCursor = 0;

  private rafId: number | null = null;
  private lastTs = 0;
  private statDecayAcc = 0;
  private sleepZzzAcc = 0;
  private lullabyStep = 0;
  private lastHudPush = 0;
  private hudDirty = true;
  private modalOpen = false;
  private micPressStart = 0;
  private micPressedOnDown = false;
  private activePointerId: number | null = null;
  private pointerDownX = W / 2;
  private pointerDownY = H / 2;
  private restedToastShown = false;
  private pendingDailyToast = '';
  private shakeTimer = 0;
  private shakeMag = 0;
  private viewport: StageViewport = { bufW: W, bufH: H, offsetX: 0, offsetY: 0, isPortrait: false };
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.callbacks = callbacks;
    this.audio = new RetroAudio();
    this.state = createInitialState();

    // Zero-GC pre-allocated particle ring buffer
    this.particles = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      type: 'sparkle',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
    }));

    this.loadPersistence();
    const daily = syncDailyProgress(this.state);
    if (daily.advanced) {
      this.pendingDailyToast = `Day ${this.state.progress.currentDay} · ${daily.newStreak}d streak! +${daily.bonusCoins} Coins!`;
      this.savePersistence();
    }
    this.audio.setMuted(this.state.muted);
    this.syncBodyDataset();
  }

  start(initialScreen: ScreenId = 'title'): void {
    this.state.screen = initialScreen;
    this.syncViewportSize();
    this.syncBodyDataset();
    this.pushHud(true);
    if (initialScreen !== 'title' && this.pendingDailyToast) {
      this.callbacks.onToast(this.pendingDailyToast);
      this.pendingDailyToast = '';
    }
    this.bindEvents();
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
    this.audio.dispose(this.state);
  }

  private syncViewportSize = (): void => {
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const next = computeStageViewport(rect.width, rect.height);
    if (
      next.bufW !== this.viewport.bufW ||
      next.bufH !== this.viewport.bufH ||
      next.isPortrait !== this.viewport.isPortrait
    ) {
      this.viewport = next;
      if (this.canvas.width !== next.bufW) this.canvas.width = next.bufW;
      if (this.canvas.height !== next.bufH) this.canvas.height = next.bufH;
      this.ctx.imageSmoothingEnabled = false;
    }
  };

  setModalOpen(open: boolean): void {
    this.modalOpen = open;
    if (open) {
      this.clearInputs();
      this.audio.stopRecording(this.state, true);
    }
    this.syncBodyDataset();
  }

  startGameFromTitle(): void {
    this.audio.ensure();
    this.audio.playStartChime();
    if (this.pendingDailyToast) {
      this.callbacks.onToast(this.pendingDailyToast);
      this.pendingDailyToast = '';
    }
    this.transitionTo('hub');
  }

  navigateFromHud(): void {
    this.audio.ensure();
    this.audio.playClick();
    if (this.state.screen === 'hub') {
      this.transitionTo('title');
    } else {
      this.transitionTo('hub');
    }
  }

  navigateToScreenDirect(screen: ScreenId): void {
    this.enterScreenImmediate(screen);
  }

  navigateToRoom(room: RoomId): void {
    this.audio.ensure();
    this.audio.playClick();
    triggerHaptic('tap', this.state.muted);
    if (this.state.screen === room && !this.state.playroom.miniGame.active) return;
    this.transitionTo(room);
  }

  toggleMute(): void {
    this.state.muted = !this.state.muted;
    this.audio.setMuted(this.state.muted);
    if (!this.state.muted && this.state.screen === 'bathroom' && this.state.bathroom.showerOn) {
      this.audio.setShowerSound(true);
    }
    if (!this.state.muted) this.audio.playClick();
    this.savePersistence();
    this.pushHud(true);
  }

  renamePet(rawName: string): { ok: boolean; name: string } {
    const cleaned = sanitizePetName(rawName);
    if (!cleaned) return { ok: false, name: this.state.petName };
    this.state.petName = cleaned;
    this.savePersistence();
    this.audio.playCoin();
    this.callbacks.onToast(`Say hi to ${cleaned}!`);
    this.pushHud(true);
    return { ok: true, name: cleaned };
  }

  buyGroceryItem(foodId: FoodId): PurchaseFeedResult {
    this.audio.ensure();
    const res = buyFoodToFridge(this.state, foodId);
    if (!res.ok) {
      this.audio.playClick();
      if (res.reason === 'fridge_full') {
        this.callbacks.onToast(`Fridge is full (${FRIDGE_CAPACITY}/${FRIDGE_CAPACITY})! Drag food to the table!`);
      } else if (res.reason === 'insufficient_coins' && res.food) {
        this.callbacks.onToast(`Need ${res.food.cost} coins! Play Fish Catch in Playroom!`);
      }
      return res;
    }
    this.state.kitchen.fridgeOpen = true;
    const slot = FRIDGE_SLOTS[this.state.kitchen.fridgeItems.length - 1];
    if (slot) {
      this.spawnParticles('sparkle', slot.x, slot.y, 4);
    }
    this.audio.playCoin();
    this.savePersistence();
    this.pushHud(true);
    return res;
  }

  advanceDay(): AdvanceDayResult {
    this.audio.ensure();
    const res = advanceToNextDay(this.state);
    if (!res.ok) {
      this.audio.playClick();
      this.callbacks.onToast('Complete at least 1 care task today before starting a new day!');
      return res;
    }
    // Wake cat gently for the new morning
    this.state.bedroom.sleeping = false;
    this.state.bedroom.blanketPulled = false;
    this.state.bedroom.lampOn = true;
    this.restedToastShown = false;
    this.state.cat.expression = 'happy';
    this.state.cat.exprTimer = 1.8;
    this.state.cat.speechText = `HELLO DAY ${res.dayNumber}!`;
    this.state.cat.speechTimer = 2.0;
    const cat = getCatAnchor(this.state);
    this.spawnParticles('sparkle', cat.x, cat.y - 20, 9);
    this.audio.playStartChime();
    if (res.bonusCoins > 0) this.audio.playCoin();
    this.callbacks.onToast(
      res.bonusCoins > 0
        ? `Welcome to Day ${res.dayNumber}! +${res.bonusCoins} Morning Coins!`
        : `Welcome to Day ${res.dayNumber}! Fresh care goals ready!`,
    );
    this.savePersistence();
    this.pushHud(true);
    return res;
  }

  getHudSnapshot(): HudSnapshot {
    const p = this.state.progress;
    return {
      screen: this.state.screen,
      miniGameActive: this.state.screen === 'playroom' && this.state.playroom.miniGame.active,
      petName: this.state.petName,
      coins: this.state.coins,
      muted: this.state.muted,
      stats: {
        hunger: Math.round(this.state.stats.hunger),
        hygiene: Math.round(this.state.stats.hygiene),
        energy: Math.round(this.state.stats.energy),
        fun: Math.round(this.state.stats.fun),
      },
      hint: getScreenHint(this.state),
      fridgeCount: this.state.kitchen.fridgeItems.length,
      fridgeCapacity: FRIDGE_CAPACITY,
      tableCount: this.state.kitchen.tableItems.length,
      profile: {
        fur: this.state.fur,
        accessory: this.state.accessory,
        ownedAccessories: [...this.state.ownedAccessories],
        highScore: this.state.highScore,
        progress: {
          ...p,
          todayCare: { ...p.todayCare },
          lifetime: { ...p.lifetime },
          dayHistory: p.dayHistory.map((d) => ({ ...d })),
        },
      },
    };
  }

  private loadPersistence(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      applyPersistedJson(this.state, raw);
    } catch {
      // ignore storage unavailability
    }
  }

  private savePersistence(): void {
    try {
      const data = extractPersistedData(this.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }

  private syncBodyDataset(): void {
    if (typeof document === 'undefined') return;
    const isMini = this.state.screen === 'playroom' && this.state.playroom.miniGame.active;
    document.body.dataset.state = this.modalOpen
      ? 'modal'
      : this.state.screen === 'title'
        ? 'title'
        : 'playing';
    document.body.dataset.screen = isMini ? 'minigame' : this.state.screen;
  }

  private pushHud(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastHudPush < 160) {
      this.hudDirty = true;
      return;
    }
    this.lastHudPush = now;
    this.hudDirty = false;
    this.callbacks.onHudUpdate(this.getHudSnapshot());
  }

  private transitionTo(target: ScreenId): void {
    // Allow retasking during fade-out or interrupting fade-in so fast room taps never feel dropped
    if (this.state.transition.phase === 'out') {
      this.state.transition.target = target;
      return;
    }
    if (target === this.state.screen && !this.state.playroom.miniGame.active) return;
    this.state.transition.phase = 'out';
    this.state.transition.target = target;
  }

  private exitMiniGame(): void {
    const s = this.state;
    const wasGameOver = s.playroom.miniGame.gameOver;
    const { awardedCoins } = finishMiniGame(s, true);
    this.audio.playClick();
    if (!wasGameOver) {
      if (awardedCoins > 0) {
        s.progress.lifetime.totalCoinsEarned = clamp(
          s.progress.lifetime.totalCoinsEarned + awardedCoins,
          0,
          999_999,
        );
        this.audio.playCoin();
        this.callbacks.onToast(`+${awardedCoins} Coins saved from Fish Catch!`);
      }
      if (s.playroom.miniGame.score > 0) {
        this.trackCare('minigame', false);
      }
    }
    this.savePersistence();
    this.syncBodyDataset();
    this.pushHud(true);
  }

  private enterScreenImmediate(next: ScreenId): void {
    // Settle any in-flight food or active mini-game coins so progress is never lost on room switch
    const settledFood = resolveFlyingFood(this.state);
    if (settledFood) {
      this.trackCare('feed', false);
    }
    let settledMiniGameCoins = 0;
    if (this.state.playroom.miniGame.active && !this.state.playroom.miniGame.gameOver) {
      settledMiniGameCoins = finishMiniGame(this.state, true).awardedCoins;
      if (settledMiniGameCoins > 0) {
        this.state.progress.lifetime.totalCoinsEarned = clamp(
          this.state.progress.lifetime.totalCoinsEarned + settledMiniGameCoins,
          0,
          999_999,
        );
      }
      if (this.state.playroom.miniGame.score > 0) {
        this.trackCare('minigame', false);
      }
    }
    if (settledFood || settledMiniGameCoins > 0) {
      this.savePersistence();
    }

    // Clean up any active room loops/sounds/drags/particles
    this.audio.stopAll(this.state);
    this.state.bathroom.showerOn = false;
    this.state.bathroom.waterDrops = [];
    this.state.bathroom.floatingBubbles = [];
    this.state.playroom.miniGame.active = false;
    this.state.drag = null;
    this.state.hoveredTarget = null;
    this.clearInputs();

    this.state.screen = next;
    this.state.cat.speechTimer = 0;
    this.state.cat.expression = next === 'bedroom' && this.state.bedroom.sleeping ? 'sleeping' : 'idle';
    this.syncBodyDataset();
    this.pushHud(true);
  }

  private spawnParticles(type: Particle['type'], x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
      p.active = true;
      p.type = type;
      p.x = x + (Math.random() - 0.5) * 24;
      p.y = y + (Math.random() - 0.5) * 14;
      p.vx = (Math.random() - 0.5) * 26;
      p.vy = type === 'splash' ? -30 - Math.random() * 20 : -18 - Math.random() * 24;
      p.maxLife = type === 'zzz' ? 1.35 : 0.85 + Math.random() * 0.45;
      p.life = p.maxLife;
    }
  }

  private triggerSquash(sx: number, sy: number): void {
    this.state.cat.scaleX = sx;
    this.state.cat.scaleY = sy;
  }

  private addCoins(amount: number): void {
    this.state.coins = clamp(this.state.coins + amount, 0, 999_999);
    if (amount > 0) {
      this.state.progress.lifetime.totalCoinsEarned = clamp(
        this.state.progress.lifetime.totalCoinsEarned + Math.floor(amount),
        0,
        999_999,
      );
      this.audio.playCoin();
    }
    this.savePersistence();
    this.pushHud(true);
  }

  private trackCare(kind: CareActivityKind, announce = true): void {
    const res = recordCareActivity(this.state, kind);
    if (announce) {
      const cat = getCatAnchor(this.state);
      if (res.perfectDayAchieved) {
        this.audio.playCoin();
        this.audio.playStartChime();
        triggerHaptic('success', this.state.muted);
        this.spawnParticles('sparkle', cat.x, cat.y - 24, 10);
        this.callbacks.onToast(`Perfect Day! +${res.bonusCoins} Coins & +30 Bond XP!`);
      } else if (res.leveledUp) {
        this.audio.playStartChime();
        triggerHaptic('success', this.state.muted);
        this.spawnParticles('heart', cat.x, cat.y - 24, 8);
        this.callbacks.onToast(`${this.state.petName} reached Bond Lv.${res.newLevel}!`);
      }
    }
    if (res.taskJustCompleted || res.leveledUp || res.perfectDayAchieved) {
      this.savePersistence();
      this.pushHud(true);
    }
  }

  private petCat(x: number, y: number): void {
    const s = this.state;
    if (s.bedroom.sleeping && s.screen === 'bedroom') {
      this.spawnParticles('heart', x, y - 14, 2);
      this.audio.playPurr();
      return;
    }
    s.cat.expression = 'happy';
    s.cat.exprTimer = 1.4;
    this.triggerSquash(1.1, 0.92);
    adjustStat(s, 'fun', 3);
    this.spawnParticles('heart', x, y - 16, 3);
    if (s.cat.purrCooldown <= 0) {
      this.audio.playPurr();
      s.cat.purrCooldown = 0.65;
      s.cat.speechText = SWEET_LINES[Math.floor(Math.random() * SWEET_LINES.length)];
      s.cat.speechTimer = 1.7;
      this.trackCare('pet');
      if (Math.random() < 0.25) this.addCoins(1);
    }
    this.pushHud();
  }

  private boopCat(): void {
    const s = this.state;
    if (s.bedroom.sleeping && s.screen === 'bedroom') {
      this.wakeUpCat();
      return;
    }
    s.cat.expression = 'surprised';
    s.cat.exprTimer = 0.85;
    s.cat.hopVy = -125;
    this.triggerSquash(0.86, 1.18);
    this.audio.playBoop();
    triggerHaptic('boop', this.state.muted);
    const c = getCatAnchor(s);
    this.spawnParticles('sparkle', c.x, c.y - 26, 4);
    s.cat.speechText = 'BOOP!';
    s.cat.speechTimer = 1.2;
    adjustStat(s, 'fun', 2);
    this.trackCare('pet');
    this.pushHud();
  }

  private triggerSyntheticMeow(): void {
    const s = this.state;
    this.audio.playMeow(Math.floor(Math.random() * 4));
    s.cat.expression = 'talking';
    s.cat.exprTimer = 0.7;
    s.cat.mouthOpen = 0.92;
    s.cat.hopVy = -70;
    this.triggerSquash(0.92, 1.12);
    s.cat.speechText = MEOW_LINES[Math.floor(Math.random() * MEOW_LINES.length)];
    s.cat.speechTimer = 1.8;
    const c = getCatAnchor(s);
    this.spawnParticles('note', c.x + 14, c.y - 28, 3);
    adjustStat(s, 'fun', 5);
    this.trackCare('play');
    this.pushHud();
  }

  private tuckInCat(): void {
    const s = this.state;
    s.bedroom.sleeping = true;
    s.bedroom.blanketPulled = true;
    s.bedroom.lampOn = false;
    this.restedToastShown = s.stats.energy >= 100;
    s.cat.expression = 'sleeping';
    s.cat.speechText = 'NIGHT NIGHT~';
    s.cat.speechTimer = 1.9;
    this.audio.playDrop();
    this.spawnParticles('zzz', 258, 152, 2);
    this.trackCare('nap');
    this.savePersistence();
    this.pushHud(true);
  }

  private wakeUpCat(): void {
    const s = this.state;
    s.bedroom.sleeping = false;
    s.bedroom.blanketPulled = false;
    s.bedroom.lampOn = true;
    this.restedToastShown = false;
    s.cat.expression = 'happy';
    s.cat.exprTimer = 1.3;
    s.cat.hopVy = -90;
    this.triggerSquash(1.16, 0.86);
    s.cat.speechText = 'GOOD MORNING!';
    s.cat.speechTimer = 1.8;
    this.audio.playStartChime();
    this.spawnParticles('sparkle', s.bedroom.catFloorX, s.bedroom.catFloorY - 22, 5);
    this.savePersistence();
    this.pushHud(true);
  }

  private toggleShower(): void {
    const s = this.state;
    s.bathroom.showerOn = !s.bathroom.showerOn;
    this.audio.setShowerSound(s.bathroom.showerOn);
    this.audio.playClick();
    if (s.bathroom.showerOn) {
      s.cat.speechText = 'WARM WATER~';
      s.cat.speechTimer = 1.4;
    }
    this.pushHud();
  }

  private applyFoodEatFeedback(food: FoodDef, fromBowl = false): void {
    const cat = getCatAnchor(this.state);
    if (fromBowl) {
      this.state.kitchen.bowlFood = food.id;
      this.state.kitchen.bowlTimer = 0.7;
    }
    this.audio.playCrunch();
    triggerHaptic('success', this.state.muted);
    this.state.cat.expression = 'eating';
    this.state.cat.exprTimer = 1.15;
    this.state.cat.hopVy = -62;
    this.triggerSquash(1.14, 0.88);
    this.state.cat.speechText = food.msg;
    this.state.cat.speechTimer = 1.9;
    this.spawnParticles('crumb', cat.x, cat.y - 2, 6);
    this.spawnParticles('heart', cat.x, cat.y - 28, 4);
    this.trackCare('feed');
    this.savePersistence();
    this.pushHud(true);
  }

  private feedFromTable(tableIndex: number, fromBowl = false): void {
    const res = consumeTableFood(this.state, tableIndex);
    if (!res.ok || !res.food) return;
    this.applyFoodEatFeedback(res.food, fromBowl);
  }

  private tossTableFood(tableIndex: number): void {
    const s = this.state;
    // Settle any previous in-flight treat immediately so rapid taps never lose food or feel ignored
    if (s.kitchen.flyingFood) {
      const settled = resolveFlyingFood(s);
      if (settled) this.applyFoodEatFeedback(settled, false);
    }
    const slot = TABLE_SLOTS[tableIndex];
    const foodId = s.kitchen.tableItems[tableIndex];
    if (!slot || !foodId) return;
    const food = FOODS.find((f) => f.id === foodId);
    if (!food) return;
    // Remove from plate immediately on toss so it cannot be double-eaten
    s.kitchen.tableItems.splice(tableIndex, 1);
    const cat = getCatAnchor(s);
    this.audio.playPickUp();
    s.kitchen.flyingFood = {
      id: food.id,
      sx: slot.x,
      sy: slot.y - 2,
      tx: cat.x,
      ty: cat.y - 6,
      x: slot.x,
      y: slot.y - 2,
      t: 0,
      food,
    };
    this.savePersistence();
    this.pushHud(true);
  }

  private serveFridgeItemToTable(fridgeIndex: number): void {
    const res = moveFridgeItemToTable(this.state, fridgeIndex);
    if (!res.ok) {
      this.audio.playClick();
      if (res.reason === 'table_full') {
        this.callbacks.onToast('Table is full (3/3)! Feed Mochi first!');
      }
      return;
    }
    const newSlot = TABLE_SLOTS[this.state.kitchen.tableItems.length - 1];
    if (newSlot) {
      this.spawnParticles('sparkle', newSlot.x, newSlot.y - 2, 4);
    }
    this.audio.playDrop();
    this.state.cat.expression = 'happy';
    this.state.cat.exprTimer = 0.8;
    this.savePersistence();
    this.pushHud(true);
  }

  private equipAccessoryWithFeedback(accId: (typeof ACCESSORIES)[number]['id'] | 'none'): void {
    const res = tryEquipAccessory(this.state, accId);
    if (!res.ok) {
      if (res.reason === 'insufficient_coins' && res.cost) {
        this.callbacks.onToast(`Need ${res.cost} coins! Play Fish Catch in Playroom!`);
        this.audio.playClick();
      }
      return;
    }
    if (accId === 'none') {
      this.audio.playDrop();
      this.state.cat.speechText = 'COMFY!';
      this.state.cat.speechTimer = 1.2;
    } else if (res.purchased) {
      this.audio.playCoin();
      this.state.cat.speechText = 'SO STYLISH!';
      this.state.cat.speechTimer = 1.8;
      this.state.cat.hopVy = -100;
      this.triggerSquash(0.88, 1.15);
      this.spawnParticles('sparkle', 196, 166, 9);
      this.callbacks.onToast(`Unlocked ${res.label}!`);
    } else {
      this.audio.playSparkle();
      this.state.cat.hopVy = -72;
      this.triggerSquash(0.9, 1.12);
      this.state.cat.expression = 'happy';
      this.state.cat.exprTimer = 1.0;
      this.spawnParticles('sparkle', 196, 166, 6);
    }
    if (accId !== 'none') {
      this.trackCare('style');
    }
    this.savePersistence();
    this.pushHud(true);
  }

  private equipFurWithFeedback(furId: keyof typeof FUR_PALETTES): void {
    if (!(furId in FUR_PALETTES)) return;
    this.state.fur = furId;
    this.audio.playSparkle();
    this.state.cat.hopVy = -70;
    this.triggerSquash(1.14, 0.88);
    this.state.cat.expression = 'happy';
    this.state.cat.exprTimer = 1.1;
    this.state.cat.speechText = `${FUR_PALETTES[furId].name}!`;
    this.state.cat.speechTimer = 1.4;
    this.spawnParticles('sparkle', 196, 184, 8);
    this.trackCare('style');
    this.savePersistence();
    this.pushHud(true);
  }

  private startVoiceMimic(): void {
    this.audio.startRecording(this.state, {
      onToast: (msg) => this.callbacks.onToast(msg),
      onFallbackMeow: () => this.triggerSyntheticMeow(),
      onMimicStarted: (dur) => {
        this.state.cat.expression = 'talking';
        this.state.cat.speechText = `${this.state.petName} SAYS...`;
        this.state.cat.speechTimer = dur + 0.5;
        adjustStat(this.state, 'fun', 8);
        this.trackCare('play');
        this.pushHud(true);
      },
      onMimicEnded: () => {
        if (this.state.cat.expression === 'talking') {
          this.state.cat.expression = 'idle';
        }
        this.pushHud(true);
      },
    });
    this.pushHud(true);
  }

  // ---------------------------------------------------------------------------
  // HIT TESTING & HOVER RESOLUTION
  // ---------------------------------------------------------------------------
  private computeHoverTarget(x: number, y: number): { target: string | null; cursor: string } {
    const s = this.state;

    if (s.drag) return { target: null, cursor: 'grabbing' };

    if (s.screen === 'title') {
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) return { target: 'cat', cursor: 'pointer' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'hub') {
      const room = hitTestHubCard(x, y, this.viewport.isPortrait);
      if (room) return { target: `hub:${room}`, cursor: 'pointer' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'bedroom') {
      if (dist(x, y, 98, 158) < 24) return { target: 'bedroom:lamp', cursor: 'pointer' };
      if (dist(x, y, 116, 178) < 15) return { target: 'bedroom:musicbox', cursor: 'pointer' };
      if (inRect(x, y, 80, 62, 58, 78)) return { target: 'bedroom:window', cursor: 'pointer' };
      if (dist(x, y, 278, 152) < 15) return { target: 'bedroom:bunny', cursor: 'pointer' };
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) return { target: 'cat', cursor: 'grab' };
      if (isPointInBed(x, y)) return { target: 'bedroom:bed', cursor: 'pointer' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'bathroom') {
      for (const b of s.bathroom.floatingBubbles) {
        if (dist(x, y, b.x, b.y) < b.r + 7) return { target: 'bathroom:bubble', cursor: 'pointer' };
      }
      if (dist(x, y, s.bathroom.spongeX, s.bathroom.spongeY) < 19)
        return { target: 'bathroom:sponge', cursor: 'grab' };
      if (dist(x, y, s.bathroom.towelX, s.bathroom.towelY) < 22)
        return { target: 'bathroom:towel', cursor: 'grab' };
      if (dist(x, y, s.bathroom.duckX, s.bathroom.duckY) < 18)
        return { target: 'bathroom:duck', cursor: 'grab' };
      if (dist(x, y, 252, 196) < 16)
        return { target: 'bathroom:boat', cursor: 'pointer' };
      if (inRect(x, y, 196, 66, 98, 96)) return { target: 'bathroom:shower', cursor: 'pointer' };
      if (inRect(x, y, 144, 130, 38, 36)) return { target: 'bathroom:shampoo', cursor: 'pointer' };
      if (dist(x, y, 86, 112) < 21) return { target: 'bathroom:mirror', cursor: 'pointer' };
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) return { target: 'cat', cursor: 'pointer' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'playroom') {
      if (s.playroom.miniGame.active) {
        if (
          inRect(
            x,
            y,
            MG_TOP_EXIT_RECT.x,
            MG_TOP_EXIT_RECT.y,
            MG_TOP_EXIT_RECT.w,
            MG_TOP_EXIT_RECT.h,
          )
        ) {
          return { target: 'mg:topexit', cursor: 'pointer' };
        }
        if (s.playroom.miniGame.gameOver) {
          if (
            inRect(
              x,
              y,
              MG_PLAY_AGAIN_RECT.x,
              MG_PLAY_AGAIN_RECT.y,
              MG_PLAY_AGAIN_RECT.w,
              MG_PLAY_AGAIN_RECT.h,
            )
          ) {
            return { target: 'mg:again', cursor: 'pointer' };
          }
          if (
            inRect(x, y, MG_EXIT_RECT.x, MG_EXIT_RECT.y, MG_EXIT_RECT.w, MG_EXIT_RECT.h)
          ) {
            return { target: 'mg:exit', cursor: 'pointer' };
          }
        }
        return { target: null, cursor: 'ew-resize' };
      }

      if (dist(x, y, s.playroom.yarn.x, s.playroom.yarn.y) < 19)
        return { target: 'playroom:yarn', cursor: 'grab' };
      if (dist(x, y, s.playroom.mouse.x, s.playroom.mouse.y) < 17)
        return { target: 'playroom:mouse', cursor: 'pointer' };
      if (dist(x, y, s.playroom.wand.homeX, s.playroom.wand.homeY - 6) < 22)
        return { target: 'playroom:wand', cursor: 'grab' };
      if (inRect(x, y, 96, 136, 36, 66)) return { target: 'playroom:mic', cursor: 'pointer' };
      if (dist(x, y, 142, 216) < 17) return { target: 'playroom:horn', cursor: 'pointer' };
      if (inRect(x, y, 286, 122, 60, 90)) return { target: 'playroom:arcade', cursor: 'pointer' };
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) return { target: 'cat', cursor: 'grab' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'kitchen') {
      // Plated items on dining table
      for (let i = 0; i < s.kitchen.tableItems.length; i++) {
        const slot = TABLE_SLOTS[i];
        if (slot && dist(x, y, slot.x, slot.y) < 18) {
          return { target: `kitchen:table_item:${i}`, cursor: 'grab' };
        }
      }
      // Stocked items inside open fridge
      if (s.kitchen.fridgeOpen) {
        for (let i = 0; i < s.kitchen.fridgeItems.length; i++) {
          const slot = FRIDGE_SLOTS[i];
          if (slot && dist(x, y, slot.x, slot.y) < 16) {
            return { target: `kitchen:fridge_item:${i}`, cursor: 'grab' };
          }
        }
        if (inRect(x, y, 36, 94, 22, 104)) {
          return { target: 'kitchen:fridge_door', cursor: 'pointer' };
        }
      } else if (inRect(x, y, 54, 94, 72, 108)) {
        return { target: 'kitchen:fridge', cursor: 'pointer' };
      }
      if (dist(x, y, 232, 142) < 18) return { target: 'kitchen:kettle', cursor: 'pointer' };
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) return { target: 'cat', cursor: 'pointer' };
      return { target: null, cursor: 'default' };
    }

    if (s.screen === 'closet') {
      for (const acc of ACCESSORIES) {
        if (dist(x, y, acc.shelfX, acc.shelfY) < 18) {
          return { target: `closet:acc:${acc.id}`, cursor: 'grab' };
        }
      }
      for (const pal of Object.values(FUR_PALETTES)) {
        if (dist(x, y, pal.jarX, pal.jarY) < 16) {
          return { target: `closet:fur:${pal.id}`, cursor: 'grab' };
        }
      }
      if (dist(x, y, 274, 212) < 20) return { target: 'closet:unequip', cursor: 'pointer' };
      if (inRect(x, y, 76, 78, 56, 110)) return { target: 'closet:mirror', cursor: 'pointer' };
      const cat = getCatAnchor(s);
      if (dist(x, y, cat.x, cat.y) < cat.r) {
        return { target: 'cat', cursor: s.accessory !== 'none' ? 'grab' : 'pointer' };
      }
      return { target: null, cursor: 'default' };
    }

    return { target: null, cursor: 'default' };
  }

  // ---------------------------------------------------------------------------
  // POINTER & KEYBOARD EVENT HANDLERS
  // ---------------------------------------------------------------------------
  private screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: W / 2, y: H / 2 };
    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    return screenPointToWorld(normX, normY, this.viewport);
  }

  private clearInputs(): void {
    this.state.keys.left = false;
    this.state.keys.right = false;
    this.state.pointerDown = false;
    this.state.drag = null;
    this.micPressedOnDown = false;
    this.activePointerId = null;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.modalOpen || this.state.transition.phase !== 'none') return;
    // Ignore secondary fingers while an active drag/touch is already in progress
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;

    this.audio.ensure();
    this.activePointerId = e.pointerId;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture unavailable
    }

    const pt = this.screenToWorld(e.clientX, e.clientY);
    const s = this.state;
    s.pointerDown = true;
    s.pointerIsTouch = e.pointerType === 'touch';
    const pad = getTouchHitPadding(s.pointerIsTouch);
    this.pointerDownX = pt.x;
    this.pointerDownY = pt.y;
    s.pointerX = s.lastPointerX = pt.x;
    s.pointerY = s.lastPointerY = pt.y;
    s.pointerVx = 0;
    s.pointerVy = 0;
    s.pointerDownTime = performance.now();
    s.pointerMovedDist = 0;
    s.consumedDown = false;
    this.micPressedOnDown = false;

    // Hub card navigation
    if (s.screen === 'hub') {
      const room = hitTestHubCard(pt.x, pt.y, this.viewport.isPortrait);
      if (room) {
        this.audio.playClick();
        triggerHaptic('tap', s.muted);
        this.transitionTo(room);
        s.consumedDown = true;
      }
      return;
    }

    // Playroom Fish Catch Mini-Game
    if (s.screen === 'playroom' && s.playroom.miniGame.active) {
      if (
        inRect(
          pt.x,
          pt.y,
          MG_TOP_EXIT_RECT.x - pad,
          MG_TOP_EXIT_RECT.y - pad,
          MG_TOP_EXIT_RECT.w + pad * 2,
          MG_TOP_EXIT_RECT.h + pad * 2,
        )
      ) {
        this.exitMiniGame();
        s.consumedDown = true;
        return;
      }
      if (s.playroom.miniGame.gameOver) {
        if (
          inRect(
            pt.x,
            pt.y,
            MG_PLAY_AGAIN_RECT.x - pad,
            MG_PLAY_AGAIN_RECT.y - pad,
            MG_PLAY_AGAIN_RECT.w + pad * 2,
            MG_PLAY_AGAIN_RECT.h + pad * 2,
          )
        ) {
          resetMiniGame(s);
          this.audio.playStartChime();
          triggerHaptic('tap', s.muted);
          this.pushHud(true);
          s.consumedDown = true;
          return;
        }
        if (
          inRect(
            pt.x,
            pt.y,
            MG_EXIT_RECT.x - pad,
            MG_EXIT_RECT.y - pad,
            MG_EXIT_RECT.w + pad * 2,
            MG_EXIT_RECT.h + pad * 2,
          )
        ) {
          this.exitMiniGame();
          s.consumedDown = true;
          return;
        }
      } else {
        s.playroom.miniGame.targetX = pt.x;
        s.consumedDown = true;
      }
      return;
    }

    // BEDROOM direct interactions
    if (s.screen === 'bedroom') {
      if (dist(pt.x, pt.y, 98, 158) < 24 + pad) {
        s.bedroom.lampOn = !s.bedroom.lampOn;
        this.audio.playClick();
        triggerHaptic('tap', s.muted);
        s.consumedDown = true;
        this.pushHud(true);
        return;
      }
      if (dist(pt.x, pt.y, 116, 178) < 15 + pad) {
        s.bedroom.musicBoxOn = !s.bedroom.musicBoxOn;
        this.audio.playClick();
        triggerHaptic('tap', s.muted);
        if (s.bedroom.musicBoxOn) {
          this.spawnParticles('note', 116, 168, 3);
          this.audio.playLullabyNote(this.lullabyStep++);
        }
        s.consumedDown = true;
        return;
      }
      if (inRect(pt.x, pt.y, 80, 62, 58, 78)) {
        s.bedroom.curtainsOpen = !s.bedroom.curtainsOpen;
        if (s.bedroom.curtainsOpen && !s.bedroom.lampOn) {
          s.bedroom.shootingStar = 1.0;
          this.audio.playSparkle();
        } else {
          this.audio.playClick();
        }
        triggerHaptic('tap', s.muted);
        s.consumedDown = true;
        return;
      }
      if (dist(pt.x, pt.y, 278, 152) < 15 + pad) {
        s.bedroom.bunnyBounce = 10;
        this.audio.playDuckSqueak();
        triggerHaptic('boop', s.muted);
        this.spawnParticles('heart', 278, 144, 3);
        adjustStat(s, 'fun', 2);
        if (!s.bedroom.sleeping) {
          s.cat.expression = 'happy';
          s.cat.exprTimer = 0.9;
        }
        s.consumedDown = true;
        this.pushHud();
        return;
      }
      if (s.bedroom.sleeping && isPointInBed(pt.x, pt.y)) {
        this.wakeUpCat();
        triggerHaptic('tap', s.muted);
        s.consumedDown = true;
        return;
      }
      if (!s.bedroom.sleeping && isPointInBed(pt.x, pt.y)) {
        const cat = getCatAnchor(s);
        if (dist(pt.x, pt.y, cat.x, cat.y) >= cat.r) {
          this.tuckInCat();
          triggerHaptic('tap', s.muted);
          s.consumedDown = true;
          return;
        }
      }
      return;
    }

    // BATHROOM direct interactions
    if (s.screen === 'bathroom') {
      // Pop floating bubbles first!
      for (let i = s.bathroom.floatingBubbles.length - 1; i >= 0; i--) {
        const b = s.bathroom.floatingBubbles[i];
        if (dist(pt.x, pt.y, b.x, b.y) < b.r + 7 + pad) {
          s.bathroom.floatingBubbles.splice(i, 1);
          this.audio.playBubblePop();
          triggerHaptic('tap', s.muted);
          this.spawnParticles('sparkle', b.x, b.y, 3);
          adjustStat(s, 'fun', 2);
          s.consumedDown = true;
          this.pushHud();
          return;
        }
      }
      // Grab Yellow Soap Sponge
      if (dist(pt.x, pt.y, s.bathroom.spongeX, s.bathroom.spongeY) < 19 + pad) {
        s.drag = { kind: 'sponge' };
        this.audio.playPickUp();
        triggerHaptic('pickup', s.muted);
        s.consumedDown = true;
        return;
      }
      // Grab Pink Towel
      if (dist(pt.x, pt.y, s.bathroom.towelX, s.bathroom.towelY) < 22 + pad) {
        s.drag = { kind: 'towel' };
        this.audio.playPickUp();
        triggerHaptic('pickup', s.muted);
        s.consumedDown = true;
        return;
      }
      // Grab / Squeak Rubber Ducky
      if (dist(pt.x, pt.y, s.bathroom.duckX, s.bathroom.duckY) < 18 + pad) {
        s.drag = { kind: 'duck', vx: 0, vy: 0 };
        this.audio.playDuckSqueak();
        triggerHaptic('boop', s.muted);
        this.spawnParticles('bubble', s.bathroom.duckX, s.bathroom.duckY - 10, 3);
        adjustStat(s, 'fun', 2);
        s.consumedDown = true;
        this.pushHud();
        return;
      }
      // Click Toy Sailboat
      if (dist(pt.x, pt.y, 252, 196) < 16 + pad) {
        s.bathroom.boatBob = 10;
        this.audio.playBubblePop();
        triggerHaptic('tap', s.muted);
        this.spawnParticles('splash', 252, 196, 4);
        this.spawnParticles('bubble', 252, 188, 2);
        adjustStat(s, 'fun', 2);
        s.cat.expression = 'happy';
        s.cat.exprTimer = 0.8;
        s.consumedDown = true;
        this.pushHud();
        return;
      }
      // Toggle Showerhead or Valve
      if (inRect(pt.x, pt.y, 196, 66, 98, 96)) {
        this.toggleShower();
        triggerHaptic('tap', s.muted);
        s.consumedDown = true;
        return;
      }
      // Pump Bubble Shampoo Bottles
      if (inRect(pt.x, pt.y, 144 - pad * 0.5, 130 - pad * 0.5, 38 + pad, 36 + pad)) {
        this.audio.playBubblePop();
        triggerHaptic('tap', s.muted);
        for (let i = 0; i < 5; i++) {
          if (s.bathroom.floatingBubbles.length < 18) {
            s.bathroom.floatingBubbles.push({
              x: 162 + (Math.random() - 0.5) * 20,
              y: 134,
              vx: (Math.random() - 0.5) * 32,
              vy: -22 - Math.random() * 20,
              r: 5 + Math.random() * 5,
              wobble: Math.random() * 6.28,
            });
          }
        }
        s.consumedDown = true;
        return;
      }
      return;
    }

    // PLAYROOM direct interactions
    if (s.screen === 'playroom') {
      // Grab Yarn Ball
      if (dist(pt.x, pt.y, s.playroom.yarn.x, s.playroom.yarn.y) < 19 + pad) {
        s.drag = { kind: 'yarn', vx: 0, vy: 0 };
        s.playroom.yarn.active = false;
        this.audio.playPickUp();
        triggerHaptic('pickup', s.muted);
        s.consumedDown = true;
        return;
      }
      // Wind-Up Clockwork Toy Mouse!
      if (dist(pt.x, pt.y, s.playroom.mouse.x, s.playroom.mouse.y) < 17 + pad) {
        const m = s.playroom.mouse;
        m.active = true;
        m.windTimer = 3.2;
        m.vx = m.dir * 96;
        this.audio.playClick();
        this.audio.playBoop();
        triggerHaptic('boop', s.muted);
        this.spawnParticles('sparkle', m.x, m.y - 6, 4);
        s.cat.expression = 'excited';
        s.cat.exprTimer = 1.6;
        s.cat.speechText = 'ZOOMIE MOUSE!';
        s.cat.speechTimer = 1.5;
        adjustStat(s, 'fun', 4);
        this.trackCare('play');
        s.consumedDown = true;
        this.pushHud();
        return;
      }
      // Grab Feather Wand
      if (dist(pt.x, pt.y, s.playroom.wand.homeX, s.playroom.wand.homeY - 6) < 22 + pad) {
        s.drag = { kind: 'wand' };
        this.audio.playPickUp();
        triggerHaptic('pickup', s.muted);
        s.consumedDown = true;
        return;
      }
      // Vintage Talking Mic (hold OR toggle)
      if (inRect(pt.x, pt.y, 96 - pad * 0.5, 136 - pad * 0.5, 36 + pad, 66 + pad)) {
        this.micPressedOnDown = true;
        this.micPressStart = performance.now();
        triggerHaptic('tap', s.muted);
        if (s.playroom.recording) {
          this.audio.stopRecording(s);
          this.pushHud(true);
        } else {
          this.startVoiceMimic();
        }
        s.consumedDown = true;
        return;
      }
      // Cat Toy Horn (Instant Meow!)
      if (dist(pt.x, pt.y, 142, 216) < 17 + pad) {
        s.playroom.hornBounce = 7;
        triggerHaptic('boop', s.muted);
        this.triggerSyntheticMeow();
        s.consumedDown = true;
        return;
      }
      // Fish Catch Arcade Cabinet
      if (inRect(pt.x, pt.y, 286, 122, 60, 90)) {
        this.audio.stopAll(s);
        resetMiniGame(s);
        this.audio.playStartChime();
        triggerHaptic('tap', s.muted);
        this.syncBodyDataset();
        this.pushHud(true);
        s.consumedDown = true;
        return;
      }
      return;
    }

    // KITCHEN direct interactions
    if (s.screen === 'kitchen') {
      // Grab plated food on the dining table to feed Mochi!
      for (let i = 0; i < s.kitchen.tableItems.length; i++) {
        const slot = TABLE_SLOTS[i];
        const foodId = s.kitchen.tableItems[i];
        if (slot && foodId && dist(pt.x, pt.y, slot.x, slot.y) < 18 + pad) {
          s.drag = { kind: 'table_food', tableIndex: i, foodId };
          this.audio.playPickUp();
          triggerHaptic('pickup', s.muted);
          s.consumedDown = true;
          return;
        }
      }
      // Grab stocked food from inside the open fridge!
      if (s.kitchen.fridgeOpen) {
        for (let i = 0; i < s.kitchen.fridgeItems.length; i++) {
          const slot = FRIDGE_SLOTS[i];
          const foodId = s.kitchen.fridgeItems[i];
          if (slot && foodId && dist(pt.x, pt.y, slot.x, slot.y) < 16 + pad * 0.7) {
            s.drag = { kind: 'fridge_food', fridgeIndex: i, foodId };
            this.audio.playPickUp();
            triggerHaptic('pickup', s.muted);
            s.consumedDown = true;
            return;
          }
        }
        // Close fridge when tapping swung-open door or fridge top rim
        if (inRect(pt.x, pt.y, 34, 94, 24, 104) || inRect(pt.x, pt.y, 56, 86, 68, 16)) {
          s.kitchen.fridgeOpen = false;
          this.audio.playClick();
          triggerHaptic('tap', s.muted);
          s.consumedDown = true;
          this.pushHud(true);
          return;
        }
      } else if (inRect(pt.x, pt.y, 54, 94, 72, 108)) {
        s.kitchen.fridgeOpen = true;
        this.audio.playClick();
        triggerHaptic('tap', s.muted);
        this.spawnParticles('sparkle', 86, 146, 4);
        if (s.kitchen.fridgeItems.length === 0) {
          this.callbacks.onToast('Fridge is empty! Tap the Cart icon to buy groceries!');
        }
        s.consumedDown = true;
        this.pushHud(true);
        return;
      }
      if (dist(pt.x, pt.y, 232, 142) < 18 + pad) {
        s.kitchen.kettleSteamTimer = 2.0;
        this.audio.playKettleWhistle();
        triggerHaptic('tap', s.muted);
        this.spawnParticles('heart', 238, 130, 3);
        this.spawnParticles('steam', 238, 134, 5);
        s.consumedDown = true;
        return;
      }
      return;
    }

    // CLOSET direct interactions
    if (s.screen === 'closet') {
      for (const acc of ACCESSORIES) {
        if (dist(pt.x, pt.y, acc.shelfX, acc.shelfY) < 18 + pad * 0.65) {
          s.drag = { kind: 'accessory', accId: acc.id };
          this.audio.playPickUp();
          triggerHaptic('pickup', s.muted);
          s.consumedDown = true;
          return;
        }
      }
      for (const pal of Object.values(FUR_PALETTES)) {
        if (dist(pt.x, pt.y, pal.jarX, pal.jarY) < 16 + pad * 0.65) {
          s.drag = { kind: 'fur', furId: pal.id };
          this.audio.playPickUp();
          triggerHaptic('pickup', s.muted);
          s.consumedDown = true;
          return;
        }
      }
      if (dist(pt.x, pt.y, 274, 212) < 20 + pad) {
        if (s.accessory !== 'none') this.equipAccessoryWithFeedback('none');
        else this.audio.playClick();
        triggerHaptic('tap', s.muted);
        s.consumedDown = true;
        return;
      }
      if (inRect(pt.x, pt.y, 76, 78, 56, 110)) {
        s.closet.mirrorFlash = 1.0;
        s.closet.poseTimer = 1.6;
        s.cat.hopVy = -90;
        this.triggerSquash(0.88, 1.15);
        s.cat.speechText = 'FABULOUS!';
        s.cat.speechTimer = 1.6;
        this.audio.playSparkle();
        triggerHaptic('boop', s.muted);
        this.spawnParticles('sparkle', 104, 128, 6);
        this.spawnParticles('sparkle', 196, 168, 6);
        s.consumedDown = true;
        return;
      }
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.modalOpen) return;
    if (this.state.pointerDown && this.activePointerId !== null && e.pointerId !== this.activePointerId) {
      return;
    }
    const pt = this.screenToWorld(e.clientX, e.clientY);
    const s = this.state;
    const dx = pt.x - s.pointerX;
    const dy = pt.y - s.pointerY;
    const stepDist = Math.hypot(dx, dy);

    s.lastPointerX = s.pointerX;
    s.lastPointerY = s.pointerY;
    s.pointerX = pt.x;
    s.pointerY = pt.y;
    s.pointerVx = dx * 24;
    s.pointerVy = dy * 24;

    // Mini-game smooth pointer steering (works on hover OR drag!)
    if (s.screen === 'playroom' && s.playroom.miniGame.active && !s.playroom.miniGame.gameOver) {
      s.playroom.miniGame.targetX = pt.x;
    }

    // Update hover target & cursor
    const hov = this.computeHoverTarget(pt.x, pt.y);
    s.hoveredTarget = hov.target;
    this.canvas.style.cursor = hov.cursor;

    if (!s.pointerDown) return;
    s.pointerMovedDist += stepDist;

    // Active Drag Interactions!
    if (s.drag) {
      const cat = getCatAnchor(s);
      const dragPt = getDraggedItemPoint(s);
      if (s.drag.kind === 'sponge' && s.screen === 'bathroom') {
        if (dist(dragPt.x, dragPt.y, cat.x, cat.y) < cat.r + 12) {
          s.cat.petRubDist += stepDist;
          if (s.cat.petRubDist > 13) {
            s.cat.petRubDist = 0;
            this.audio.playBubblePop();
            triggerHaptic('tap', s.muted);
            s.bathroom.soapLevel = Math.min(100, s.bathroom.soapLevel + 10);
            if (s.bathroom.soapBubbles.length < 18) {
              s.bathroom.soapBubbles.push({
                rx: (Math.random() - 0.5) * 14,
                ry: (Math.random() - 0.5) * 13,
                r: 2 + Math.random() * 2.5,
              });
            }
            this.spawnParticles('bubble', dragPt.x, dragPt.y, 2);
            s.cat.expression = 'happy';
            s.cat.exprTimer = 0.8;
            adjustStat(s, 'hygiene', 2);
            this.pushHud();
          }
        }
        return;
      }

      if (s.drag.kind === 'towel' && s.screen === 'bathroom') {
        if (dist(dragPt.x, dragPt.y, cat.x, cat.y) < cat.r + 12) {
          // Auto-shutoff shower when actively drying Mochi so water doesn't immediately re-wet them!
          if (s.bathroom.showerOn && s.bathroom.soapBubbles.length === 0) {
            this.toggleShower();
          }
          s.cat.petRubDist += stepDist;
          if (s.cat.petRubDist > 14) {
            s.cat.petRubDist = 0;
            this.audio.playPurr();
            s.cat.expression = 'happy';
            s.cat.exprTimer = 0.9;
            this.spawnParticles('sparkle', dragPt.x, dragPt.y, 2);
            if (s.bathroom.wetLevel > 0) {
              s.bathroom.wetLevel = Math.max(0, s.bathroom.wetLevel - 0.34);
              if (s.bathroom.wetLevel === 0) {
                adjustStat(s, 'hygiene', 10);
                this.addCoins(2);
                triggerHaptic('success', s.muted);
                s.cat.speechText = 'SO FLUFFY!';
                s.cat.speechTimer = 1.8;
                this.spawnParticles('sparkle', cat.x, cat.y - 16, 8);
                this.trackCare('bath');
                this.savePersistence();
                this.pushHud(true);
              }
            }
          }
        }
        return;
      }

      if (s.drag.kind === 'wand' && s.screen === 'playroom') {
        // Mochi playfully follows and hops toward the feather wand!
        s.cat.expression = 'excited';
        s.cat.exprTimer = 0.5;
        const targetCatX = clamp(pt.x, 126, 266);
        s.playroom.catX += (targetCatX - s.playroom.catX) * 0.1;
        if (dist(pt.x, pt.y, s.playroom.catX, s.playroom.catY - 22) < 42 && s.cat.hopY === 0) {
          s.cat.hopVy = -115;
          this.triggerSquash(0.86, 1.18);
          this.audio.playBoop();
          this.spawnParticles('sparkle', pt.x, pt.y, 3);
          adjustStat(s, 'fun', 3);
          this.trackCare('play');
          if (Math.random() < 0.2) this.addCoins(1);
          this.pushHud();
        }
        return;
      }

      if (s.drag.kind === 'yarn') {
        s.drag.vx = clamp(s.pointerVx, -260, 260);
        s.drag.vy = clamp(s.pointerVy, -260, 260);
        return;
      }

      if (s.drag.kind === 'duck') {
        s.drag.vx = clamp(s.pointerVx, -220, 220);
        s.drag.vy = clamp(s.pointerVy, -220, 220);
        return;
      }
      return;
    }

    // Foggy bathroom mirror rubbing!
    if (s.screen === 'bathroom' && s.bathroom.mirrorFog > 0.04 && dist(pt.x, pt.y, 86, 112) < 21) {
      s.bathroom.mirrorFog = Math.max(0, s.bathroom.mirrorFog - stepDist * 0.015);
      if (Math.random() < 0.25) this.spawnParticles('sparkle', pt.x, pt.y, 1);
      s.consumedDown = true;
      return;
    }

    // Closet: grab worn accessory directly off Mochi's head ONLY if drag started on Mochi!
    if (s.screen === 'closet' && s.accessory !== 'none' && !s.consumedDown) {
      const cat = getCatAnchor(s);
      const startedOnCat = dist(this.pointerDownX, this.pointerDownY, cat.x, cat.y) < cat.r + 6;
      if (startedOnCat && s.pointerMovedDist > 16 && dist(pt.x, pt.y, cat.x, cat.y - 10) > 28) {
        s.drag = { kind: 'worn_accessory', accId: s.accessory };
        this.audio.playPickUp();
        s.consumedDown = true;
        return;
      }
    }

    // Lifting Mochi in Bedroom or Playroom ONLY when press started on Mochi and pulls away!
    if (
      (s.screen === 'bedroom' || s.screen === 'playroom') &&
      !s.consumedDown &&
      !(s.screen === 'bedroom' && s.bedroom.sleeping) &&
      !(s.screen === 'playroom' && s.playroom.miniGame.active)
    ) {
      const cat = getCatAnchor(s);
      const startedOnCat = dist(this.pointerDownX, this.pointerDownY, cat.x, cat.y) < cat.r + 8;
      if (startedOnCat && dist(pt.x, pt.y, cat.x, cat.y) > cat.r * 0.92 && s.pointerMovedDist > 22) {
        s.drag = { kind: 'cat', offsetX: 0, offsetY: 10 };
        this.audio.playPickUp();
        this.triggerSquash(0.88, 1.14);
        s.consumedDown = true;
        return;
      }
    }

    // Petting / Rubbing Mochi in ANY screen!
    if (s.screen !== 'hub' && !(s.screen === 'playroom' && s.playroom.miniGame.active)) {
      const cat = getCatAnchor(s);
      if (dist(pt.x, pt.y, cat.x, cat.y) < cat.r) {
        s.cat.petRubDist += stepDist;
        if (s.cat.petRubDist > 24) {
          s.cat.petRubDist = 0;
          this.petCat(pt.x, pt.y);
          s.consumedDown = true;
        }
      }
    }
  };

  private onPointerCancel = (e: PointerEvent): void => {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if capture unavailable
    }
    this.activePointerId = null;
    this.state.drag = null;
    this.state.pointerDown = false;
    this.micPressedOnDown = false;
    this.canvas.style.cursor = 'default';
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if capture unavailable
    }
    this.activePointerId = null;

    const s = this.state;

    // Release hold-to-talk on mic if held > 320ms
    if (this.micPressedOnDown) {
      this.micPressedOnDown = false;
      if (s.playroom.recording && performance.now() - this.micPressStart > 320) {
        this.audio.stopRecording(s);
        this.pushHud(true);
      }
    }

    if (s.drag) {
      const dragPt = getDraggedItemPoint(s);
      const drag = s.drag;
      s.drag = null;
      const x = dragPt.x;
      const y = dragPt.y;
      const wasQuickClick = s.pointerMovedDist < 12 && performance.now() - s.pointerDownTime < 300;
      const cat = getCatAnchor(s);

      if (drag.kind === 'cat') {
        if (s.screen === 'bedroom') {
          if (isPointInBed(x, y)) {
            this.tuckInCat();
            triggerHaptic('success', s.muted);
          } else {
            s.bedroom.catFloorX = clamp(x, 128, 210);
            s.bedroom.catFloorY = clamp(y, 186, 232);
            s.cat.hopVy = -50;
            this.triggerSquash(1.18, 0.84);
            this.audio.playDrop();
          }
        } else if (s.screen === 'playroom') {
          s.playroom.catX = clamp(x, 128, 266);
          s.playroom.catY = clamp(y, 178, 224);
          s.cat.hopVy = -50;
          this.triggerSquash(1.18, 0.84);
          this.audio.playDrop();
        }
      } else if (drag.kind === 'yarn') {
        s.playroom.yarn.x = clamp(x, 82, 316);
        s.playroom.yarn.y = clamp(y, 64, 228);
        if (wasQuickClick) {
          s.playroom.yarn.vx = (s.playroom.catX - s.playroom.yarn.x) * 1.4 + (Math.random() - 0.5) * 60;
          s.playroom.yarn.vy = -150;
        } else {
          s.playroom.yarn.vx = clamp(drag.vx, -240, 240);
          s.playroom.yarn.vy = clamp(drag.vy - 40, -240, 120);
        }
        s.playroom.yarn.active = true;
        this.audio.playBoop();
        triggerHaptic('boop', s.muted);
        s.cat.expression = 'happy';
        s.cat.exprTimer = 1.1;
        adjustStat(s, 'fun', 6);
        this.trackCare('play');
        this.pushHud();
      } else if (drag.kind === 'duck') {
        if (wasQuickClick) {
          s.bathroom.duckHop = 14;
        } else {
          const clampedDuck = clampBathroomDuckPosition(x, y);
          s.bathroom.duckX = clampedDuck.x;
          s.bathroom.duckY = clampedDuck.y;
          s.bathroom.duckHop = 8;
        }
        this.audio.playDrop();
      } else if (drag.kind === 'fridge_food') {
        if (wasQuickClick || isPointOnKitchenTable(x, y)) {
          this.serveFridgeItemToTable(drag.fridgeIndex);
          triggerHaptic('tap', s.muted);
        } else if (dist(x, y, cat.x, cat.y) < 48) {
          this.audio.playClick();
          this.callbacks.onToast('Place food on the table first, then feed Mochi!');
        } else {
          this.audio.playDrop();
        }
      } else if (drag.kind === 'table_food') {
        if (wasQuickClick) {
          this.tossTableFood(drag.tableIndex);
        } else if (dist(x, y, cat.x, cat.y) < 54) {
          this.feedFromTable(drag.tableIndex, false);
        } else if (dist(x, y, 152, 238) < 36) {
          this.feedFromTable(drag.tableIndex, true);
        } else if (s.kitchen.fridgeOpen && inRect(x, y, 52, 92, 70, 108)) {
          const putBack = moveTableItemToFridge(s, drag.tableIndex);
          if (putBack.ok) {
            this.audio.playDrop();
            this.savePersistence();
            this.pushHud(true);
          } else {
            this.audio.playClick();
            this.callbacks.onToast(`Fridge is full (${FRIDGE_CAPACITY}/${FRIDGE_CAPACITY})!`);
          }
        } else {
          this.audio.playDrop();
        }
      } else if (drag.kind === 'accessory') {
        if (wasQuickClick || dist(x, y, cat.x, cat.y) < 56) {
          this.equipAccessoryWithFeedback(drag.accId);
          triggerHaptic('success', s.muted);
        } else {
          this.audio.playDrop();
        }
      } else if (drag.kind === 'worn_accessory') {
        if (dist(x, y, cat.x, cat.y) > 42) {
          this.equipAccessoryWithFeedback('none');
          triggerHaptic('tap', s.muted);
        } else {
          this.audio.playDrop();
        }
      } else if (drag.kind === 'fur') {
        if (wasQuickClick || dist(x, y, cat.x, cat.y) < 56) {
          this.equipFurWithFeedback(drag.furId);
          triggerHaptic('success', s.muted);
        } else {
          this.audio.playDrop();
        }
      } else if (drag.kind === 'sponge' || drag.kind === 'towel' || drag.kind === 'wand') {
        this.audio.playDrop();
      }

      s.pointerDown = false;
      this.canvas.style.cursor = this.computeHoverTarget(s.pointerX, s.pointerY).cursor;
      return;
    }

    // Horizontal swipe on open room background -> glide smoothly to adjacent room!
    if (
      s.pointerDown &&
      !s.consumedDown &&
      s.pointerIsTouch &&
      !(s.screen === 'playroom' && s.playroom.miniGame.active)
    ) {
      const cat = getCatAnchor(s);
      const startedNearCat = dist(this.pointerDownX, this.pointerDownY, cat.x, cat.y) < cat.r + 12;
      if (!startedNearCat) {
        const swipeTarget = detectRoomSwipe(
          s.screen,
          s.pointerX - this.pointerDownX,
          s.pointerY - this.pointerDownY,
          performance.now() - s.pointerDownTime,
        );
        if (swipeTarget) {
          this.audio.playClick();
          triggerHaptic('tap', s.muted);
          this.transitionTo(swipeTarget);
          s.pointerDown = false;
          return;
        }
      }
    }

    // Quick tap directly on Mochi -> funny boop!
    if (
      s.pointerDown &&
      !s.consumedDown &&
      s.pointerMovedDist < 12 &&
      performance.now() - s.pointerDownTime < 280
    ) {
      if (s.screen !== 'hub' && !(s.screen === 'playroom' && s.playroom.miniGame.active)) {
        const cat = getCatAnchor(s);
        if (dist(s.pointerX, s.pointerY, cat.x, cat.y) < cat.r + (s.pointerIsTouch ? 8 : 0)) {
          this.boopCat();
        }
      }
    }

    s.pointerDown = false;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.modalOpen) return;
    if (this.state.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.startGameFromTitle();
      return;
    }
    if (
      this.state.screen === 'playroom' &&
      this.state.playroom.miniGame.active &&
      this.state.playroom.miniGame.gameOver &&
      (e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      resetMiniGame(this.state);
      this.audio.playStartChime();
      this.pushHud(true);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.state.keys.right = true;
    if (e.key === 'Escape' && this.state.screen === 'playroom' && this.state.playroom.miniGame.active) {
      this.exitMiniGame();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.state.keys.right = false;
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onWindowBlur = (): void => {
    this.clearInputs();
    this.audio.stopRecording(this.state, true);
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearInputs();
      this.audio.stopRecording(this.state, true);
      this.audio.setShowerSound(false);
      this.savePersistence();
    } else {
      this.lastTs = performance.now();
      this.syncViewportSize();
      if (this.state.screen === 'bathroom' && this.state.bathroom.showerOn && !this.state.muted) {
        this.audio.setShowerSound(true);
      }
    }
  };

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('resize', this.syncViewportSize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.syncViewportSize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  private unbindEvents(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('resize', this.syncViewportSize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 60 FPS SIMULATION & RENDER LOOP
  // ---------------------------------------------------------------------------
  private loop = (ts: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    const time = ts / 1000;

    this.update(dt);
    this.render(time);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const s = this.state;
    this.audio.sampleAmplitude(s);

    // Room transition wipe
    if (s.transition.phase === 'out') {
      s.transition.alpha = Math.min(1, s.transition.alpha + dt * 6.5);
      if (s.transition.alpha >= 1 && s.transition.target) {
        this.enterScreenImmediate(s.transition.target);
        s.transition.phase = 'in';
        s.transition.target = null;
      }
    } else if (s.transition.phase === 'in') {
      s.transition.alpha = Math.max(0, s.transition.alpha - dt * 6.5);
      if (s.transition.alpha <= 0) {
        s.transition.phase = 'none';
      }
    }

    // Meadow butterflies
    s.butterflies.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 18 || b.x > W - 18) b.vx = -b.vx;
      if (b.y < 24 || b.y > H - 24) b.vy = -b.vy;
    });

    // Gentle stat decay when playing
    if (s.screen !== 'title') {
      this.statDecayAcc += dt;
      if (this.statDecayAcc >= 4.5) {
        this.statDecayAcc = 0;
        s.stats.hunger = Math.max(5, s.stats.hunger - 0.7);
        s.stats.hygiene = Math.max(5, s.stats.hygiene - 0.45);
        s.stats.fun = Math.max(5, s.stats.fun - 0.6);
        if (!(s.screen === 'bedroom' && s.bedroom.sleeping)) {
          s.stats.energy = Math.max(5, s.stats.energy - 0.5);
        }
        this.savePersistence();
        this.pushHud();
      }
    }

    // Smooth squash & stretch damping back to (1, 1)
    s.cat.scaleX += (1 - s.cat.scaleX) * Math.min(1, dt * 12);
    s.cat.scaleY += (1 - s.cat.scaleY) * Math.min(1, dt * 12);

    // Smooth pointer/toy gaze tracking!
    const cat = getCatAnchor(s);
    const gazeTargetX =
      s.screen === 'playroom' && s.playroom.yarn.active
        ? s.playroom.yarn.x
        : s.screen === 'playroom' && s.playroom.mouse.active
          ? s.playroom.mouse.x
          : s.pointerX;
    const gazeTargetY =
      s.screen === 'playroom' && s.playroom.yarn.active
        ? s.playroom.yarn.y
        : s.screen === 'playroom' && s.playroom.mouse.active
          ? s.playroom.mouse.y
          : s.pointerY;
    const desiredGx = clamp((gazeTargetX - cat.x) / 90, -0.5, 0.5);
    const desiredGy = clamp((gazeTargetY - cat.y) / 90, -0.35, 0.35);
    s.cat.gazeX += (desiredGx - s.cat.gazeX) * Math.min(1, dt * 9);
    s.cat.gazeY += (desiredGy - s.cat.gazeY) * Math.min(1, dt * 9);

    // Blinking & ear twitching
    s.cat.blinkTimer -= dt;
    if (s.cat.blinkTimer <= 0) {
      s.cat.isBlinking = !s.cat.isBlinking;
      s.cat.blinkTimer = s.cat.isBlinking ? 0.14 : 2.1 + Math.random() * 2.6;
    }

    s.cat.earTwitchTimer -= dt;
    if (s.cat.earTwitchTimer <= 0) {
      s.cat.earTwitch = s.cat.earTwitch === 0 ? 0.8 : 0;
      s.cat.earTwitchTimer = s.cat.earTwitch !== 0 ? 0.12 : 3.2 + Math.random() * 3.5;
    }

    // Autonomous cute idle hints when Mochi has a need or is super happy!
    if (
      s.screen !== 'hub' &&
      s.cat.speechTimer <= 0 &&
      !(s.screen === 'bedroom' && s.bedroom.sleeping) &&
      !(s.screen === 'playroom' && s.playroom.miniGame.active)
    ) {
      s.cat.idleActionTimer -= dt;
      if (s.cat.idleActionTimer <= 0) {
        s.cat.idleActionTimer = 6.5 + Math.random() * 4.5;
        if (s.stats.hunger < 38) {
          s.cat.speechText = 'FISH PLS~';
          s.cat.speechTimer = 2.0;
        } else if (s.stats.energy < 38) {
          s.cat.speechText = '*YAWN*';
          s.cat.speechTimer = 2.0;
        } else if (s.stats.hygiene < 38) {
          s.cat.speechText = 'BATH TIME?';
          s.cat.speechTimer = 2.0;
        } else if (
          s.stats.hunger > 75 &&
          s.stats.fun > 75 &&
          s.stats.energy > 75 &&
          s.stats.hygiene > 75
        ) {
          s.cat.hopVy = -55;
          this.triggerSquash(0.92, 1.1);
          this.spawnParticles('heart', cat.x, cat.y - 26, 2);
        }
      }
    }

    if (s.cat.exprTimer > 0) {
      s.cat.exprTimer -= dt;
      if (s.cat.exprTimer <= 0 && !s.playroom.mimicking) {
        s.cat.expression = s.screen === 'bedroom' && s.bedroom.sleeping ? 'sleeping' : 'idle';
        s.cat.mouthOpen = 0;
      }
    }
    if (s.cat.speechTimer > 0) s.cat.speechTimer -= dt;
    if (s.cat.purrCooldown > 0) s.cat.purrCooldown -= dt;

    // Hop physics + landing squash!
    if (s.cat.hopY < 0 || s.cat.hopVy !== 0) {
      s.cat.hopY += s.cat.hopVy * dt;
      s.cat.hopVy += 440 * dt;
      if (s.cat.hopY >= 0) {
        s.cat.hopY = 0;
        s.cat.hopVy = 0;
        this.triggerSquash(1.18, 0.84);
      }
    }

    // Bedroom sleeping, bunny plush & music box
    if (s.screen === 'bedroom') {
      if (s.bedroom.shootingStar > 0) {
        s.bedroom.shootingStar = Math.max(0, s.bedroom.shootingStar - dt * 1.1);
      }
      if (s.bedroom.bunnyBounce > 0) {
        s.bedroom.bunnyBounce = Math.max(0, s.bedroom.bunnyBounce - dt * 36);
      }
      if (s.bedroom.sleeping) {
        const prevEnergy = s.stats.energy;
        const rate = s.bedroom.lampOn ? 5.2 : 9.0;
        adjustStat(s, 'energy', dt * rate);
        if (s.stats.energy >= 100 && prevEnergy < 100 && !this.restedToastShown) {
          this.restedToastShown = true;
          s.cat.speechText = 'FULLY RESTED!';
          s.cat.speechTimer = 2.0;
          this.savePersistence();
          this.pushHud(true);
        }
        this.sleepZzzAcc += dt;
        if (this.sleepZzzAcc > 0.95) {
          this.sleepZzzAcc = 0;
          this.spawnParticles('zzz', 258, 150, 1);
          if (!s.bedroom.musicBoxOn) this.audio.playLullabyNote(this.lullabyStep++);
          if (s.stats.energy < 100) this.pushHud();
        }
      }
      if (s.bedroom.musicBoxOn) {
        s.bedroom.musicTimer += dt;
        if (s.bedroom.musicTimer > 0.72) {
          s.bedroom.musicTimer = 0;
          this.audio.playLullabyNote(this.lullabyStep++);
          this.spawnParticles('note', 116, 168, 1);
        }
      }
    }

    // Bathroom simulation
    if (s.screen === 'bathroom') {
      if (s.bathroom.duckHop > 0) {
        s.bathroom.duckHop = Math.max(0, s.bathroom.duckHop - dt * 45);
      }
      if (s.bathroom.boatBob > 0) {
        s.bathroom.boatBob = Math.max(0, s.bathroom.boatBob - dt * 34);
      }
      // Update floating poppable bubbles
      for (let i = s.bathroom.floatingBubbles.length - 1; i >= 0; i--) {
        const b = s.bathroom.floatingBubbles[i];
        b.wobble += dt * 3;
        b.x += (b.vx + Math.sin(b.wobble) * 14) * dt;
        b.y += b.vy * dt;
        if (b.y < 24 || b.x < 28 || b.x > W - 28) {
          s.bathroom.floatingBubbles.splice(i, 1);
        }
      }

      if (s.bathroom.showerOn) {
        s.bathroom.mirrorFog = Math.min(1, s.bathroom.mirrorFog + dt * 0.14);
        s.bathroom.wetLevel = Math.min(1, s.bathroom.wetLevel + dt * 0.28);
        for (let i = 0; i < 3; i++) {
          s.bathroom.waterDrops.push({
            x: 190 + Math.random() * 44,
            y: 84 + Math.random() * 14,
            vy: 165 + Math.random() * 60,
          });
        }
        s.bathroom.waterDrops.forEach((d) => {
          d.y += d.vy * dt;
        });
        s.bathroom.waterDrops = s.bathroom.waterDrops.filter((d) => d.y < 218);

        if (s.bathroom.soapBubbles.length > 0 && Math.random() < dt * 7.5) {
          const popped = s.bathroom.soapBubbles.pop()!;
          this.spawnParticles('sparkle', 212 + popped.rx * 3.2, 184 + popped.ry * 3.2, 2);
          adjustStat(s, 'hygiene', 8);
          this.pushHud();
          if (s.bathroom.soapBubbles.length === 0) {
            s.bathroom.soapLevel = 0;
            s.stats.hygiene = 100;
            this.addCoins(5);
            s.cat.speechText = 'SQUEAKY CLEAN!';
            s.cat.speechTimer = 2.1;
            s.cat.expression = 'happy';
            s.cat.exprTimer = 2.0;
            this.spawnParticles('sparkle', 212, 166, 10);
            this.callbacks.onToast('+5 Coins! Sparkling clean — drag towel to dry!');
            this.trackCare('bath');
          }
        } else {
          adjustStat(s, 'hygiene', dt * 5.5);
          this.pushHud();
        }
      } else {
        s.bathroom.waterDrops = [];
      }
    }

    // Playroom yarn, wind-up mouse, horn & Fish Catch mini-game
    if (s.screen === 'playroom') {
      if (s.playroom.hornBounce > 0) {
        s.playroom.hornBounce = Math.max(0, s.playroom.hornBounce - dt * 36);
      }

      if (!s.playroom.miniGame.active) {
        const yRes = stepYarnPhysics(s, dt);
        if (yRes.bounced) this.audio.playDrop();
        if (yRes.nearCat && s.cat.hopY === 0 && Math.abs(s.playroom.yarn.vx) > 25) {
          s.cat.hopVy = -90;
          this.triggerSquash(0.88, 1.14);
          s.playroom.yarn.vx = clamp(-s.playroom.yarn.vx * 1.05, -260, 260);
          s.playroom.yarn.vy = -120;
          this.audio.playBoop();
          this.spawnParticles('sparkle', s.playroom.yarn.x, s.playroom.yarn.y, 3);
        }

        const mRes = stepToyMouse(s, dt);
        if (mRes.turned) this.audio.playClick();
        if (mRes.nearCat && s.cat.hopY === 0 && s.playroom.mouse.active) {
          s.cat.hopVy = -84;
          this.triggerSquash(0.88, 1.15);
          this.audio.playBoop();
          this.spawnParticles('sparkle', s.playroom.mouse.x, s.playroom.mouse.y - 6, 3);
        }
      } else {
        const ev = stepMiniGame(s, dt);
        ev.caughtGood.forEach((g) => {
          this.audio.playCoin();
          triggerHaptic(g.type === 'star' ? 'boop' : 'tap', s.muted);
          s.cat.expression = 'happy';
          s.cat.exprTimer = 0.45;
          this.triggerSquash(1.14, 0.88);
          this.spawnParticles(g.type === 'heart' ? 'heart' : 'sparkle', g.x, g.y, 4);
        });
        ev.caughtBoot.forEach(() => {
          this.audio.playBoop();
          triggerHaptic('thud', s.muted);
          this.shakeTimer = 0.18;
          this.shakeMag = 3.5;
          s.cat.expression = 'surprised';
          s.cat.exprTimer = 0.55;
          s.cat.hopVy = -80;
        });
        if (ev.finished) {
          this.audio.playStartChime();
          if (s.playroom.miniGame.coinsEarned > 0) {
            s.progress.lifetime.totalCoinsEarned = clamp(
              s.progress.lifetime.totalCoinsEarned + s.playroom.miniGame.coinsEarned,
              0,
              999_999,
            );
          }
          this.trackCare('minigame');
          this.savePersistence();
          this.pushHud(true);
        }
      }
    }

    // Kitchen flying food, bowl munch, kettle steam
    if (s.screen === 'kitchen') {
      if (s.kitchen.kettleSteamTimer > 0) {
        s.kitchen.kettleSteamTimer -= dt;
        if (Math.random() < dt * 9) {
          this.spawnParticles('steam', 240, 134, 1);
        }
      }
      if (s.kitchen.bowlTimer > 0) {
        s.kitchen.bowlTimer -= dt;
        if (s.kitchen.bowlTimer <= 0) s.kitchen.bowlFood = null;
      }
      if (s.kitchen.flyingFood) {
        const ff = s.kitchen.flyingFood;
        ff.t += dt * 2.5;
        const p = Math.min(1, ff.t);
        ff.x = ff.sx + (ff.tx - ff.sx) * p;
        ff.y = ff.sy + (ff.ty - ff.sy) * p - Math.sin(p * Math.PI) * 54;
        if (p >= 1) {
          const settled = resolveFlyingFood(s);
          if (settled) this.applyFoodEatFeedback(settled, false);
        }
      }
    }

    // Closet mirror flash & pose timer
    if (s.screen === 'closet') {
      if (s.closet.mirrorFlash > 0) {
        s.closet.mirrorFlash = Math.max(0, s.closet.mirrorFlash - dt * 2.8);
      }
      if (s.closet.poseTimer > 0) {
        s.closet.poseTimer = Math.max(0, s.closet.poseTimer - dt);
      }
    }

    // Update pooled particles in-place
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    if (this.hudDirty) {
      this.pushHud();
    }
  }

  private render(time: number): void {
    const ctx = this.ctx;
    const s = this.state;
    const vp = this.viewport;

    ctx.clearRect(0, 0, vp.bufW, vp.bufH);
    ctx.imageSmoothingEnabled = false;

    const isMiniGame = s.screen === 'playroom' && s.playroom.miniGame.active;
    if (vp.isPortrait) {
      if (!isMiniGame) {
        drawSeamlessMeadow(ctx, vp.bufW, vp.bufH);
        if (s.screen !== 'title' && s.screen !== 'hub') {
          ctx.fillStyle = 'rgba(8, 22, 16, 0.54)';
          ctx.fillRect(0, 0, vp.bufW, vp.bufH);
        }
      }
      setFullBleedMeadowActive(true);
    } else {
      setFullBleedMeadowActive(false);
    }

    ctx.save();
    const shakeX =
      this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * 2 * this.shakeMag) : 0;
    const shakeY =
      this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * 2 * this.shakeMag) : 0;
    ctx.translate(vp.offsetX + shakeX, vp.offsetY + shakeY);

    if (s.screen === 'title') {
      drawTitleScreen(ctx, s, time);
    } else if (s.screen === 'hub') {
      drawHubScreen(ctx, s, time, vp.isPortrait);
    } else if (s.screen === 'bedroom') {
      drawBedroom(ctx, s, time);
    } else if (s.screen === 'bathroom') {
      drawBathroom(ctx, s, time);
    } else if (s.screen === 'playroom') {
      drawPlayroom(ctx, s, time);
    } else if (s.screen === 'kitchen') {
      drawKitchen(ctx, s, time);
    } else if (s.screen === 'closet') {
      drawCloset(ctx, s, time);
    }

    drawDraggedOverlay(ctx, s, time);
    drawParticles(ctx, this.particles);
    drawSpeechBubble(ctx, s);
    ctx.restore();

    drawTransitionOverlay(ctx, s.transition.alpha, vp.bufW, vp.bufH);
  }
}
