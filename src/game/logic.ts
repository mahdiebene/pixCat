import {
  ACCESSORIES,
  AccessoryId,
  CareTaskKey,
  DailyCareChecklist,
  DayLogEntry,
  FOODS,
  FoodDef,
  FoodId,
  FRIDGE_CAPACITY,
  FUR_PALETTES,
  FurId,
  GameState,
  H,
  HUB_CARDS,
  HubCardDef,
  LifetimeCounters,
  PersistedData,
  PORTRAIT_HUB_CARDS,
  ProfileSnapshot,
  ProgressState,
  ROOM_ORDER,
  RoomId,
  ScreenId,
  StageViewport,
  StatKey,
  TABLE_CAPACITY,
  W,
} from './types';

export function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function inRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

export function sanitizePetName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 10)
    .trim();
}

export function getLocalDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function diffDateKeys(fromKey: string, toKey: string): number {
  if (!isValidDateKey(fromKey) || !isValidDateKey(toKey)) return 0;
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  const diff = Math.round((toMs - fromMs) / 86_400_000);
  return diff > 0 ? diff : 0;
}

export function createInitialProgress(todayKey: string = getLocalDateKey()): ProgressState {
  const safeToday = isValidDateKey(todayKey) ? todayKey : getLocalDateKey();
  return {
    startedDate: safeToday,
    lastVisitDate: safeToday,
    currentDay: 1,
    totalDaysVisited: 1,
    streakDays: 1,
    bestStreak: 1,
    perfectDays: 0,
    xp: 0,
    todayXp: 0,
    todayCare: {
      fed: false,
      bathed: false,
      played: false,
      slept: false,
    },
    perfectDayClaimed: false,
    dayHistory: [],
    lifetime: {
      mealsServed: 0,
      bathsGiven: 0,
      petsGiven: 0,
      napsTaken: 0,
      playSessions: 0,
      miniGamesPlayed: 0,
      outfitsStyled: 0,
      totalCoinsEarned: 0,
    },
  };
}

export function createInitialState(todayKey: string = getLocalDateKey()): GameState {
  return {
    screen: 'title',
    petName: 'MOCHI',
    coins: 25,
    muted: false,
    stats: {
      hunger: 82,
      hygiene: 78,
      energy: 85,
      fun: 80,
    },
    fur: 'classic',
    accessory: 'none',
    ownedAccessories: ['none', 'bow'],
    highScore: 0,
    progress: createInitialProgress(todayKey),

    transition: {
      alpha: 0,
      phase: 'none',
      target: null,
    },

    bedroom: {
      lampOn: true,
      curtainsOpen: true,
      sleeping: false,
      blanketPulled: false,
      musicBoxOn: false,
      musicTimer: 0,
      shootingStar: 0,
      bunnyBounce: 0,
      catFloorX: 162,
      catFloorY: 204,
    },

    bathroom: {
      showerOn: false,
      soapLevel: 0,
      wetLevel: 0,
      soapBubbles: [],
      waterDrops: [],
      floatingBubbles: [],
      mirrorFog: 0,
      duckX: 182,
      duckY: 208,
      duckVx: 0,
      duckVy: 0,
      duckHop: 0,
      boatBob: 0,
      spongeX: 142,
      spongeY: 192,
      towelX: 142,
      towelY: 116,
    },

    playroom: {
      recording: false,
      mimicking: false,
      audioAmp: 0,
      micLevel: 0,
      hornBounce: 0,
      yarn: {
        active: false,
        x: 262,
        y: 222,
        vx: 0,
        vy: 0,
        rot: 0,
      },
      mouse: {
        active: false,
        x: 188,
        y: 240,
        vx: 0,
        dir: 1,
        windTimer: 0,
      },
      wand: {
        x: 84,
        y: 214,
        homeX: 84,
        homeY: 214,
      },
      catX: 200,
      catY: 196,
      miniGame: {
        active: false,
        score: 0,
        coinsEarned: 0,
        timeLeft: 30,
        catX: W / 2,
        targetX: W / 2,
        items: [],
        popups: [],
        spawnTimer: 0.4,
        gameOver: false,
      },
    },

    kitchen: {
      fridgeOpen: false,
      fridgeItems: ['fish', 'milk'],
      tableItems: [],
      kettleSteamTimer: 0,
      flyingFood: null,
      bowlFood: null,
      bowlTimer: 0,
    },

    closet: {
      mirrorFlash: 0,
      poseTimer: 0,
    },

    cat: {
      hopY: 0,
      hopVy: 0,
      scaleX: 1,
      scaleY: 1,
      gazeX: 0,
      gazeY: 0,
      expression: 'idle',
      exprTimer: 0,
      blinkTimer: 2.2,
      isBlinking: false,
      earTwitchTimer: 4.0,
      earTwitch: 0,
      mouthOpen: 0,
      speechText: '',
      speechTimer: 0,
      petRubDist: 0,
      purrCooldown: 0,
      idleActionTimer: 5.5,
    },

    butterflies: [
      { x: 76, y: 78, vx: 14, vy: 5, color: '#ffe066', phase: 0.2 },
      { x: 314, y: 126, vx: -12, vy: 7, color: '#ff9ec0', phase: 2.1 },
      { x: 250, y: 230, vx: 10, vy: -6, color: '#9be7ff', phase: 4.0 },
    ],

    drag: null,
    hoveredTarget: null,
    pointerDown: false,
    pointerIsTouch: false,
    pointerX: W / 2,
    pointerY: H / 2,
    lastPointerX: W / 2,
    lastPointerY: H / 2,
    pointerVx: 0,
    pointerVy: 0,
    pointerDownTime: 0,
    pointerMovedDist: 0,
    consumedDown: false,
    keys: { left: false, right: false },
  };
}

export function extractPersistedData(state: GameState): PersistedData {
  return {
    petName: state.petName,
    coins: Math.max(0, Math.floor(state.coins)),
    muted: Boolean(state.muted),
    stats: {
      hunger: clamp(Math.round(state.stats.hunger), 0, 100),
      hygiene: clamp(Math.round(state.stats.hygiene), 0, 100),
      energy: clamp(Math.round(state.stats.energy), 0, 100),
      fun: clamp(Math.round(state.stats.fun), 0, 100),
    },
    fur: state.fur,
    accessory: state.accessory,
    ownedAccessories: [...state.ownedAccessories],
    highScore: Math.max(0, Math.floor(state.highScore)),
    fridgeItems: [...state.kitchen.fridgeItems].slice(0, FRIDGE_CAPACITY),
    tableItems: [...state.kitchen.tableItems].slice(0, TABLE_CAPACITY),
    progress: {
      ...state.progress,
      todayCare: { ...state.progress.todayCare },
      lifetime: { ...state.progress.lifetime },
      dayHistory: state.progress.dayHistory.slice(-14).map((e) => ({ ...e })),
    },
  };
}

function sanitizeCounter(val: unknown, max = 999_999): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  return clamp(Math.floor(val), 0, max);
}

export function applyPersistedJson(state: GameState, rawJson: string | null): boolean {
  if (!rawJson) return false;
  try {
    const parsed = JSON.parse(rawJson) as Partial<PersistedData>;
    if (!parsed || typeof parsed !== 'object') return false;

    if (typeof parsed.petName === 'string') {
      const cleaned = sanitizePetName(parsed.petName);
      if (cleaned.length > 0) state.petName = cleaned;
    }
    if (typeof parsed.coins === 'number' && Number.isFinite(parsed.coins)) {
      state.coins = clamp(Math.floor(parsed.coins), 0, 999_999);
    }
    if (typeof parsed.muted === 'boolean') {
      state.muted = parsed.muted;
    }
    if (parsed.stats && typeof parsed.stats === 'object') {
      const keys: StatKey[] = ['hunger', 'hygiene', 'energy', 'fun'];
      for (const k of keys) {
        const val = parsed.stats[k];
        if (typeof val === 'number' && Number.isFinite(val)) {
          state.stats[k] = clamp(val, 5, 100);
        }
      }
    }
    if (typeof parsed.fur === 'string' && parsed.fur in FUR_PALETTES) {
      state.fur = parsed.fur as FurId;
    }
    const validAccIds = new Set<AccessoryId>(['none', ...ACCESSORIES.map((a) => a.id)]);
    if (Array.isArray(parsed.ownedAccessories)) {
      const cleanedOwned = parsed.ownedAccessories.filter(
        (id): id is AccessoryId => typeof id === 'string' && validAccIds.has(id as AccessoryId),
      );
      if (!cleanedOwned.includes('none')) cleanedOwned.unshift('none');
      if (!cleanedOwned.includes('bow')) cleanedOwned.push('bow');
      state.ownedAccessories = Array.from(new Set(cleanedOwned));
    }
    if (
      typeof parsed.accessory === 'string' &&
      validAccIds.has(parsed.accessory as AccessoryId) &&
      state.ownedAccessories.includes(parsed.accessory as AccessoryId)
    ) {
      state.accessory = parsed.accessory as AccessoryId;
    }
    if (typeof parsed.highScore === 'number' && Number.isFinite(parsed.highScore)) {
      state.highScore = clamp(Math.floor(parsed.highScore), 0, 999_999);
    }
    const validFoodIds = new Set<FoodId>(FOODS.map((f) => f.id));
    if (Array.isArray(parsed.fridgeItems)) {
      state.kitchen.fridgeItems = parsed.fridgeItems
        .filter((id): id is FoodId => typeof id === 'string' && validFoodIds.has(id as FoodId))
        .slice(0, FRIDGE_CAPACITY);
    }
    if (Array.isArray(parsed.tableItems)) {
      state.kitchen.tableItems = parsed.tableItems
        .filter((id): id is FoodId => typeof id === 'string' && validFoodIds.has(id as FoodId))
        .slice(0, TABLE_CAPACITY);
    }
    if (parsed.progress && typeof parsed.progress === 'object') {
      const p = parsed.progress;
      const target = state.progress;
      if (isValidDateKey(p.startedDate)) target.startedDate = p.startedDate;
      if (isValidDateKey(p.lastVisitDate)) target.lastVisitDate = p.lastVisitDate;
      if (typeof p.currentDay === 'number' && Number.isFinite(p.currentDay)) {
        target.currentDay = clamp(Math.floor(p.currentDay), 1, 99_999);
      }
      if (typeof p.totalDaysVisited === 'number' && Number.isFinite(p.totalDaysVisited)) {
        target.totalDaysVisited = clamp(Math.floor(p.totalDaysVisited), 1, 99_999);
      }
      if (typeof p.streakDays === 'number' && Number.isFinite(p.streakDays)) {
        target.streakDays = clamp(Math.floor(p.streakDays), 1, 99_999);
      }
      if (typeof p.bestStreak === 'number' && Number.isFinite(p.bestStreak)) {
        target.bestStreak = Math.max(target.streakDays, clamp(Math.floor(p.bestStreak), 1, 99_999));
      } else {
        target.bestStreak = Math.max(target.bestStreak, target.streakDays);
      }
      target.perfectDays = sanitizeCounter(p.perfectDays, 99_999);
      target.xp = sanitizeCounter(p.xp, 9_999_999);
      target.todayXp = sanitizeCounter(p.todayXp, 999_999);
      if (typeof p.perfectDayClaimed === 'boolean') {
        target.perfectDayClaimed = p.perfectDayClaimed;
      }
      if (p.todayCare && typeof p.todayCare === 'object') {
        target.todayCare = {
          fed: Boolean(p.todayCare.fed),
          bathed: Boolean(p.todayCare.bathed),
          played: Boolean(p.todayCare.played),
          slept: Boolean(p.todayCare.slept),
        };
      }
      if (Array.isArray(p.dayHistory)) {
        const cleaned: DayLogEntry[] = [];
        for (const entry of p.dayHistory.slice(-14)) {
          if (!entry || typeof entry !== 'object') continue;
          const dayNum = sanitizeCounter(entry.dayNumber, 99_999);
          if (dayNum < 1) continue;
          cleaned.push({
            dayNumber: dayNum,
            date: isValidDateKey(entry.date) ? entry.date : target.startedDate,
            careCount: clamp(sanitizeCounter(entry.careCount, 4), 0, 4),
            avgWellness: clamp(sanitizeCounter(entry.avgWellness, 100), 0, 100),
            xpEarned: sanitizeCounter(entry.xpEarned, 999_999),
            perfect: Boolean(entry.perfect),
          });
        }
        target.dayHistory = cleaned;
      }
      if (p.lifetime && typeof p.lifetime === 'object') {
        const lt = p.lifetime as Partial<LifetimeCounters>;
        target.lifetime = {
          mealsServed: sanitizeCounter(lt.mealsServed),
          bathsGiven: sanitizeCounter(lt.bathsGiven),
          petsGiven: sanitizeCounter(lt.petsGiven),
          napsTaken: sanitizeCounter(lt.napsTaken),
          playSessions: sanitizeCounter(lt.playSessions),
          miniGamesPlayed: sanitizeCounter(lt.miniGamesPlayed),
          outfitsStyled: sanitizeCounter(lt.outfitsStyled),
          totalCoinsEarned: sanitizeCounter(lt.totalCoinsEarned),
        };
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function adjustStat(state: GameState, key: StatKey, delta: number): void {
  if (!Number.isFinite(delta)) return;
  const current = Number.isFinite(state.stats[key]) ? state.stats[key] : 50;
  state.stats[key] = clamp(current + delta, 0, 100);
}

export function getCatAnchor(state: GameState): { x: number; y: number; r: number; scale: number } {
  if (state.drag?.kind === 'cat') {
    return {
      x: clamp(state.pointerX + state.drag.offsetX, 46, W - 46),
      y: clamp(state.pointerY + state.drag.offsetY, 64, H - 36),
      r: 36,
      scale: 3.3,
    };
  }
  switch (state.screen) {
    case 'title':
      return { x: W / 2, y: 140, r: 44, scale: 4.2 };
    case 'bedroom':
      return state.bedroom.sleeping
        ? { x: 250, y: 176, r: 34, scale: 2.9 }
        : { x: state.bedroom.catFloorX, y: state.bedroom.catFloorY, r: 34, scale: 3.3 };
    case 'bathroom':
      return { x: 212, y: 184, r: 35, scale: 3.3 };
    case 'playroom':
      return { x: state.playroom.catX, y: state.playroom.catY, r: 36, scale: 3.4 };
    case 'kitchen':
      return { x: 162, y: 196, r: 36, scale: 3.35 };
    case 'closet':
      return { x: 196, y: 184, r: 38, scale: 3.45 };
    default:
      return { x: W / 2, y: 170, r: 34, scale: 3.3 };
  }
}

export interface PurchaseFeedResult {
  ok: boolean;
  reason?: 'insufficient_coins' | 'unknown_food' | 'fridge_full' | 'table_full' | 'invalid_slot';
  food?: FoodDef;
}

export function tryConsumeFood(state: GameState, foodId: FoodId): PurchaseFeedResult {
  const food = FOODS.find((f) => f.id === foodId);
  if (!food) return { ok: false, reason: 'unknown_food' };
  if (state.coins < food.cost) return { ok: false, reason: 'insufficient_coins', food };

  state.coins -= food.cost;
  adjustStat(state, 'hunger', food.hunger);
  adjustStat(state, 'fun', food.fun);
  adjustStat(state, 'energy', food.energy);
  return { ok: true, food };
}

export function buyFoodToFridge(state: GameState, foodId: FoodId): PurchaseFeedResult {
  const food = FOODS.find((f) => f.id === foodId);
  if (!food) return { ok: false, reason: 'unknown_food' };
  if (state.kitchen.fridgeItems.length >= FRIDGE_CAPACITY) {
    return { ok: false, reason: 'fridge_full', food };
  }
  if (state.coins < food.cost) {
    return { ok: false, reason: 'insufficient_coins', food };
  }
  state.coins -= food.cost;
  state.kitchen.fridgeItems.push(foodId);
  return { ok: true, food };
}

export function moveFridgeItemToTable(state: GameState, fridgeIndex: number): PurchaseFeedResult {
  if (!Number.isInteger(fridgeIndex) || fridgeIndex < 0 || fridgeIndex >= state.kitchen.fridgeItems.length) {
    return { ok: false, reason: 'invalid_slot' };
  }
  if (state.kitchen.tableItems.length >= TABLE_CAPACITY) {
    return { ok: false, reason: 'table_full' };
  }
  const [foodId] = state.kitchen.fridgeItems.splice(fridgeIndex, 1);
  const food = FOODS.find((f) => f.id === foodId);
  if (!food) return { ok: false, reason: 'unknown_food' };
  state.kitchen.tableItems.push(foodId);
  return { ok: true, food };
}

export function moveTableItemToFridge(state: GameState, tableIndex: number): PurchaseFeedResult {
  if (!Number.isInteger(tableIndex) || tableIndex < 0 || tableIndex >= state.kitchen.tableItems.length) {
    return { ok: false, reason: 'invalid_slot' };
  }
  if (state.kitchen.fridgeItems.length >= FRIDGE_CAPACITY) {
    return { ok: false, reason: 'fridge_full' };
  }
  const [foodId] = state.kitchen.tableItems.splice(tableIndex, 1);
  const food = FOODS.find((f) => f.id === foodId);
  if (!food) return { ok: false, reason: 'unknown_food' };
  state.kitchen.fridgeItems.push(foodId);
  return { ok: true, food };
}

export function consumeTableFood(state: GameState, tableIndex: number): PurchaseFeedResult {
  if (!Number.isInteger(tableIndex) || tableIndex < 0 || tableIndex >= state.kitchen.tableItems.length) {
    return { ok: false, reason: 'invalid_slot' };
  }
  const [foodId] = state.kitchen.tableItems.splice(tableIndex, 1);
  const food = FOODS.find((f) => f.id === foodId);
  if (!food) return { ok: false, reason: 'unknown_food' };
  adjustStat(state, 'hunger', food.hunger);
  adjustStat(state, 'fun', food.fun);
  adjustStat(state, 'energy', food.energy);
  return { ok: true, food };
}

/**
 * Safely settles any in-flight tossed food onto Mochi's stats so paid food is never lost
 * on rapid re-toss or premature room exit.
 */
export function resolveFlyingFood(state: GameState): FoodDef | null {
  const ff = state.kitchen.flyingFood;
  if (!ff) return null;
  state.kitchen.flyingFood = null;
  adjustStat(state, 'hunger', ff.food.hunger);
  adjustStat(state, 'fun', ff.food.fun);
  adjustStat(state, 'energy', ff.food.energy);
  return ff.food;
}

export function isPointOnKitchenTable(x: number, y: number): boolean {
  return inRect(x, y, 192, 184, 144, 74);
}

export function clampBathroomDuckPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(Number.isFinite(x) ? x : 182, 146, 276),
    y: clamp(Number.isFinite(y) ? y : 208, 184, 242),
  };
}

export interface EquipAccessoryResult {
  ok: boolean;
  purchased: boolean;
  reason?: 'insufficient_coins' | 'unknown_accessory';
  cost?: number;
  label?: string;
}

export function tryEquipAccessory(state: GameState, accId: AccessoryId): EquipAccessoryResult {
  if (accId === 'none') {
    state.accessory = 'none';
    return { ok: true, purchased: false, label: 'NONE' };
  }
  const acc = ACCESSORIES.find((a) => a.id === accId);
  if (!acc) return { ok: false, purchased: false, reason: 'unknown_accessory' };

  if (state.ownedAccessories.includes(accId)) {
    state.accessory = accId;
    return { ok: true, purchased: false, label: acc.label };
  }

  if (state.coins < acc.cost) {
    return {
      ok: false,
      purchased: false,
      reason: 'insufficient_coins',
      cost: acc.cost,
      label: acc.label,
    };
  }

  state.coins -= acc.cost;
  state.ownedAccessories.push(accId);
  state.accessory = accId;
  return { ok: true, purchased: true, cost: acc.cost, label: acc.label };
}

export function computeStageViewport(cssW: number, cssH: number): StageViewport {
  if (!Number.isFinite(cssW) || !Number.isFinite(cssH) || cssW <= 0 || cssH <= 0) {
    return { bufW: W, bufH: H, offsetX: 0, offsetY: 0, isPortrait: false };
  }
  const aspect = cssW / cssH;
  if (aspect >= 1.12) {
    return { bufW: W, bufH: H, offsetX: 0, offsetY: 0, isPortrait: false };
  }
  const bufW = 368;
  const bufH = clamp(Math.round(bufW / aspect), 380, 860);
  const offsetX = Math.round((bufW - W) / 2);
  const offsetY = Math.round((bufH - H) / 2);
  return { bufW, bufH, offsetX, offsetY, isPortrait: true };
}

export function screenPointToWorld(
  normX: number,
  normY: number,
  vp: StageViewport,
): { x: number; y: number } {
  const safeNormX = Number.isFinite(normX) ? normX : 0.5;
  const safeNormY = Number.isFinite(normY) ? normY : 0.5;
  const minX = -vp.offsetX;
  const maxX = vp.bufW - vp.offsetX;
  const minY = -vp.offsetY;
  const maxY = vp.bufH - vp.offsetY;
  return {
    x: clamp(safeNormX * vp.bufW - vp.offsetX, minX, maxX),
    y: clamp(safeNormY * vp.bufH - vp.offsetY, minY, maxY),
  };
}

export function getHubCards(isPortrait = false): HubCardDef[] {
  return isPortrait ? PORTRAIT_HUB_CARDS : HUB_CARDS;
}

export function hitTestHubCard(x: number, y: number, isPortrait = false): RoomId | null {
  const cards = getHubCards(isPortrait);
  for (const card of cards) {
    if (inRect(x, y, card.x, card.y, card.w, card.h + 18)) {
      return card.id;
    }
  }
  return null;
}

export function isPointInBed(x: number, y: number): boolean {
  return inRect(x, y, 200, 134, 118, 96);
}

export function stepYarnPhysics(state: GameState, dt: number): { bounced: boolean; nearCat: boolean } {
  const y = state.playroom.yarn;
  if (!y.active || !Number.isFinite(dt) || dt <= 0) return { bounced: false, nearCat: false };

  let bounced = false;
  y.vx = clamp(y.vx, -280, 280);
  y.vy = clamp(y.vy, -320, 420);
  y.x += y.vx * dt;
  y.y += y.vy * dt;
  y.vy += 380 * dt;
  y.rot += y.vx * dt * 0.08;

  const floorY = 230;
  if (y.y > floorY) {
    y.y = floorY;
    if (Math.abs(y.vy) > 45) bounced = true;
    y.vy = -y.vy * 0.58;
    y.vx *= 0.84;
    if (Math.abs(y.vy) < 18) {
      y.vy = 0;
      y.vx *= 0.88;
      if (Math.abs(y.vx) < 4) {
        y.vx = 0;
        y.active = false;
      }
    }
  }

  if (y.x < 78) {
    y.x = 78;
    y.vx = Math.abs(y.vx) * 0.72;
    bounced = true;
  } else if (y.x > 318) {
    y.x = 318;
    y.vx = -Math.abs(y.vx) * 0.72;
    bounced = true;
  }
  if (y.y < 60) {
    y.y = 60;
    y.vy = Math.abs(y.vy) * 0.6;
  }

  const nearCat = dist(y.x, y.y, state.playroom.catX, state.playroom.catY) < 42;
  return { bounced, nearCat };
}

export function stepToyMouse(state: GameState, dt: number): { turned: boolean; nearCat: boolean } {
  const m = state.playroom.mouse;
  if (!m.active || m.windTimer <= 0 || !Number.isFinite(dt) || dt <= 0) {
    if (m.windTimer <= 0) {
      m.active = false;
      m.vx = 0;
    }
    return { turned: false, nearCat: false };
  }

  let turned = false;
  m.windTimer = Math.max(0, m.windTimer - dt);
  m.x += m.vx * dt;

  if (m.x < 126) {
    m.x = 126;
    m.dir = 1;
    m.vx = Math.abs(m.vx);
    turned = true;
  } else if (m.x > 272) {
    m.x = 272;
    m.dir = -1;
    m.vx = -Math.abs(m.vx);
    turned = true;
  }

  if (m.windTimer <= 0) {
    m.active = false;
    m.vx = 0;
  }

  const nearCat = dist(m.x, m.y, state.playroom.catX, state.playroom.catY + 18) < 34;
  return { turned, nearCat };
}

export interface MiniGameStepEvents {
  caughtGood: Array<{ x: number; y: number; type: 'fish' | 'star' | 'heart' }>;
  caughtBoot: Array<{ x: number; y: number }>;
  finished: boolean;
}

/**
 * Idempotently concludes an active Fish Catch session, updating high score and awarding earned coins
 * once whether the timer ran out or the player exited early.
 */
export function finishMiniGame(state: GameState, earlyExit = false): { awardedCoins: number; newBest: boolean } {
  const mg = state.playroom.miniGame;
  if (mg.gameOver) {
    if (earlyExit) mg.active = false;
    return { awardedCoins: 0, newBest: false };
  }
  mg.gameOver = true;
  if (earlyExit) {
    mg.active = false;
  } else {
    mg.timeLeft = 0;
  }
  const newBest = mg.score > state.highScore;
  if (newBest) state.highScore = clamp(mg.score, 0, 999_999);
  const awardedCoins = Math.max(0, Math.floor(mg.coinsEarned));
  state.coins = clamp(state.coins + awardedCoins, 0, 999_999);
  if (!earlyExit || mg.score > 0) {
    adjustStat(state, 'fun', earlyExit ? Math.min(18, Math.ceil(mg.score / 10) + 4) : 24);
  }
  return { awardedCoins, newBest };
}

export function stepMiniGame(
  state: GameState,
  dt: number,
  rand: () => number = Math.random,
): MiniGameStepEvents {
  const events: MiniGameStepEvents = { caughtGood: [], caughtBoot: [], finished: false };
  const mg = state.playroom.miniGame;
  if (!mg.active || mg.gameOver || !Number.isFinite(dt) || dt <= 0) return events;

  mg.timeLeft -= dt;
  if (mg.timeLeft <= 0) {
    finishMiniGame(state, false);
    events.finished = true;
    return events;
  }

  // Opposite directional keys cancel cleanly instead of favoring right
  const keySpeed = 240;
  const moveDir = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  if (moveDir !== 0) {
    mg.targetX = mg.catX + moveDir * keySpeed * dt * 1.9;
  }
  mg.targetX = clamp(mg.targetX, 30, W - 30);
  mg.catX += (mg.targetX - mg.catX) * Math.min(1, dt * 15);

  mg.spawnTimer -= dt;
  if (mg.spawnTimer <= 0) {
    mg.spawnTimer = 0.46 + rand() * 0.3;
    const r = rand();
    const type = r < 0.52 ? 'fish' : r < 0.72 ? 'star' : r < 0.86 ? 'heart' : 'boot';
    mg.items.push({
      type,
      x: 30 + rand() * (W - 60),
      y: 34,
      vy: 82 + rand() * 58 + (30 - mg.timeLeft) * 1.6,
    });
  }

  // Update floating score popups
  for (let i = mg.popups.length - 1; i >= 0; i--) {
    mg.popups[i].y -= 26 * dt;
    mg.popups[i].life -= dt;
    if (mg.popups[i].life <= 0) {
      mg.popups.splice(i, 1);
    }
  }

  for (let i = mg.items.length - 1; i >= 0; i--) {
    const it = mg.items[i];
    it.y += it.vy * dt;
    if (dist(it.x, it.y, mg.catX, 234) < 28) {
      if (it.type === 'boot') {
        mg.score = Math.max(0, mg.score - 10);
        mg.popups.push({ x: it.x, y: it.y - 6, text: '-10', color: '#ff6b8b', life: 0.75 });
        events.caughtBoot.push({ x: it.x, y: it.y });
      } else {
        const pts = it.type === 'star' ? 25 : it.type === 'heart' ? 15 : 10;
        const cns = it.type === 'star' ? 3 : 1;
        mg.score += pts;
        mg.coinsEarned += cns;
        mg.popups.push({
          x: it.x,
          y: it.y - 6,
          text: `+${pts}`,
          color: it.type === 'star' ? '#ffe066' : it.type === 'heart' ? '#ff9ec0' : '#9be7ff',
          life: 0.75,
        });
        events.caughtGood.push({ x: it.x, y: it.y, type: it.type });
      }
      mg.items.splice(i, 1);
    } else if (it.y > 266) {
      mg.items.splice(i, 1);
    }
  }

  return events;
}

export function resetMiniGame(state: GameState): void {
  const mg = state.playroom.miniGame;
  mg.active = true;
  mg.score = 0;
  mg.coinsEarned = 0;
  mg.timeLeft = 30;
  mg.catX = W / 2;
  mg.targetX = W / 2;
  mg.items = [];
  mg.popups = [];
  mg.spawnTimer = 0.35;
  mg.gameOver = false;
}

export function getScreenHint(state: GameState): string {
  if (state.screen === 'playroom' && state.playroom.miniGame.active) {
    return 'Slide finger to catch fish & stars · Avoid boots!';
  }
  switch (state.screen) {
    case 'title':
      return 'Pet or boop Mochi, then tap PLAY!';
    case 'hub':
      return `Tap a cozy room to visit ${state.petName}!`;
    case 'bedroom':
      return state.bedroom.sleeping
        ? 'Sleeping (+Energy) · Tap bed to wake · Tap lamp.'
        : 'Drag Mochi to bed · Tap lamp, curtains or music box.';
    case 'bathroom':
      return 'Drag sponge · Tap shower · Drag towel · Pop bubbles.';
    case 'playroom':
      return state.playroom.recording
        ? 'Listening... release mic to hear Mochi mimic!'
        : 'Hold mic · Fling yarn · Wave wand · Tap arcade.';
    case 'kitchen':
      if (state.kitchen.fridgeItems.length === 0 && state.kitchen.tableItems.length === 0) {
        return 'Fridge empty! Tap Cart to shop for treats.';
      }
      if (!state.kitchen.fridgeOpen && state.kitchen.tableItems.length === 0) {
        return 'Tap fridge · Drag food to table · Tap Cart to shop.';
      }
      if (state.kitchen.tableItems.length > 0) {
        return 'Drag or tap plated food to feed Mochi · Tap Cart.';
      }
      return 'Drag food from fridge to table, then feed Mochi!';
    case 'closet':
      return 'Drag hats or paint jars onto Mochi · Tap mirror.';
  }
}

export function isValidRoomScreen(screen: string): screen is ScreenId {
  return ['title', 'hub', 'bedroom', 'bathroom', 'playroom', 'kitchen', 'closet'].includes(screen);
}

// ---------------------------------------------------------------------------
// DAY-BY-DAY PROGRESS & CAT PROFILE HELPERS
// ---------------------------------------------------------------------------

export type CareActivityKind = 'feed' | 'bath' | 'pet' | 'play' | 'nap' | 'minigame' | 'style';

export interface BondLevelInfo {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progressPct: number;
  stageName: string;
}

export interface CatMoodSummary {
  avgWellness: number;
  label: string;
  tone: 'emerald' | 'amber' | 'rose';
}

export interface DailySyncResult {
  advanced: boolean;
  daysElapsed: number;
  bonusCoins: number;
  newStreak: number;
}

export interface AdvanceDayResult {
  ok: boolean;
  reason?: 'no_care_today';
  dayNumber: number;
  bonusCoins: number;
  careCount: number;
}

export interface CareActivityResult {
  leveledUp: boolean;
  newLevel: number;
  taskJustCompleted: CareTaskKey | null;
  perfectDayAchieved: boolean;
  bonusCoins: number;
}

export interface ProfileMilestone {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unlocked: boolean;
}

export function getDailyCareCount(care: DailyCareChecklist): number {
  return (care.fed ? 1 : 0) + (care.bathed ? 1 : 0) + (care.played ? 1 : 0) + (care.slept ? 1 : 0);
}

export function getAverageWellness(stats: Record<StatKey, number>): number {
  const sum =
    clamp(stats.hunger, 0, 100) +
    clamp(stats.hygiene, 0, 100) +
    clamp(stats.energy, 0, 100) +
    clamp(stats.fun, 0, 100);
  return Math.round(sum / 4);
}

export function getGrowthStageName(level: number): string {
  if (level >= 15) return 'Royal Purr-Master';
  if (level >= 10) return 'Cozy Companion';
  if (level >= 6) return 'Meadow Pal';
  if (level >= 3) return 'Curious Kitty';
  return 'Tiny Kitten';
}

export function getBondLevelInfo(rawXp: number): BondLevelInfo {
  const safeXp = clamp(Number.isFinite(rawXp) ? Math.floor(rawXp) : 0, 0, 9_999_999);
  let level = 1;
  let remaining = safeXp;
  let needed = 60;
  while (remaining >= needed && level < 99) {
    remaining -= needed;
    level += 1;
    needed = 60 + (level - 1) * 35;
  }
  const progressPct = level >= 99 ? 100 : Math.min(100, Math.round((remaining / needed) * 100));
  return {
    level,
    xpInLevel: remaining,
    xpForNext: needed,
    progressPct,
    stageName: getGrowthStageName(level),
  };
}

export function getCatMoodSummary(stats: Record<StatKey, number>): CatMoodSummary {
  const avg = getAverageWellness(stats);
  const lowestKey = (['hunger', 'hygiene', 'energy', 'fun'] as StatKey[]).reduce((minK, k) =>
    stats[k] < stats[minK] ? k : minK,
  );
  if (stats[lowestKey] < 35) {
    const needLabel: Record<StatKey, string> = {
      hunger: 'Hungry for a Snack',
      hygiene: 'Ready for a Bath',
      energy: 'Needs a Cozy Nap',
      fun: 'Wants to Play',
    };
    return { avgWellness: avg, label: needLabel[lowestKey], tone: 'rose' };
  }
  if (avg >= 82) return { avgWellness: avg, label: 'Radiant & Purring', tone: 'emerald' };
  if (avg >= 60) return { avgWellness: avg, label: 'Happy & Cozy', tone: 'emerald' };
  return { avgWellness: avg, label: 'Could Use Some Care', tone: 'amber' };
}

function archiveCurrentDay(state: GameState, dateKey: string): DayLogEntry {
  const p = state.progress;
  const careCount = getDailyCareCount(p.todayCare);
  const entry: DayLogEntry = {
    dayNumber: p.currentDay,
    date: isValidDateKey(dateKey) ? dateKey : p.lastVisitDate,
    careCount,
    avgWellness: getAverageWellness(state.stats),
    xpEarned: p.todayXp,
    perfect: careCount === 4,
  };
  p.dayHistory = [...p.dayHistory, entry].slice(-14);
  return entry;
}

export function syncDailyProgress(
  state: GameState,
  todayKey: string = getLocalDateKey(),
): DailySyncResult {
  const p = state.progress;
  if (!isValidDateKey(todayKey)) {
    return { advanced: false, daysElapsed: 0, bonusCoins: 0, newStreak: p.streakDays };
  }
  const daysElapsed = diffDateKeys(p.lastVisitDate, todayKey);
  if (daysElapsed <= 0) {
    return { advanced: false, daysElapsed: 0, bonusCoins: 0, newStreak: p.streakDays };
  }

  archiveCurrentDay(state, p.lastVisitDate);

  p.currentDay = clamp(p.currentDay + daysElapsed, 1, 99_999);
  p.totalDaysVisited = clamp(p.totalDaysVisited + 1, 1, 99_999);
  if (daysElapsed === 1) {
    p.streakDays = clamp(p.streakDays + 1, 1, 99_999);
  } else {
    p.streakDays = 1;
  }
  p.bestStreak = Math.max(p.bestStreak, p.streakDays);
  p.lastVisitDate = todayKey;
  p.todayXp = 0;
  p.perfectDayClaimed = false;
  p.todayCare = { fed: false, bathed: false, played: false, slept: false };

  // Gentle overnight drift so Mochi is ready for morning care without punishing returns
  state.stats.hunger = clamp(state.stats.hunger - Math.min(28, 10 * daysElapsed), 28, 100);
  state.stats.hygiene = clamp(state.stats.hygiene - Math.min(22, 7 * daysElapsed), 30, 100);
  state.stats.fun = clamp(state.stats.fun - Math.min(24, 8 * daysElapsed), 28, 100);
  state.stats.energy = clamp(state.stats.energy + 15, 45, 100);

  const bonusCoins = 10 + Math.min(20, (p.streakDays - 1) * 2);
  state.coins = clamp(state.coins + bonusCoins, 0, 999_999);
  p.lifetime.totalCoinsEarned = clamp(p.lifetime.totalCoinsEarned + bonusCoins, 0, 999_999);

  return {
    advanced: true,
    daysElapsed,
    bonusCoins,
    newStreak: p.streakDays,
  };
}

export function advanceToNextDay(
  state: GameState,
  todayKey: string = getLocalDateKey(),
): AdvanceDayResult {
  const p = state.progress;
  const careCount = getDailyCareCount(p.todayCare);
  if (careCount < 1) {
    return {
      ok: false,
      reason: 'no_care_today',
      dayNumber: p.currentDay,
      bonusCoins: 0,
      careCount: 0,
    };
  }

  const safeDate = isValidDateKey(todayKey) ? todayKey : p.lastVisitDate;
  archiveCurrentDay(state, safeDate);

  p.currentDay = clamp(p.currentDay + 1, 1, 99_999);
  p.totalDaysVisited = clamp(p.totalDaysVisited + 1, 1, 99_999);
  p.streakDays = clamp(p.streakDays + 1, 1, 99_999);
  p.bestStreak = Math.max(p.bestStreak, p.streakDays);
  p.lastVisitDate = safeDate;
  p.todayXp = 0;
  p.perfectDayClaimed = false;
  p.todayCare = { fed: false, bathed: false, played: false, slept: false };

  // Cozy morning refresh: rested energy, slight morning appetite/playfulness
  state.stats.energy = clamp(Math.max(88, state.stats.energy + 22), 0, 100);
  state.stats.hunger = clamp(state.stats.hunger - 16, 40, 100);
  state.stats.hygiene = clamp(state.stats.hygiene - 12, 46, 100);
  state.stats.fun = clamp(state.stats.fun - 14, 44, 100);

  const bonusCoins = careCount >= 2 ? 6 : 0;
  if (bonusCoins > 0) {
    state.coins = clamp(state.coins + bonusCoins, 0, 999_999);
    p.lifetime.totalCoinsEarned = clamp(p.lifetime.totalCoinsEarned + bonusCoins, 0, 999_999);
  }

  return {
    ok: true,
    dayNumber: p.currentDay,
    bonusCoins,
    careCount,
  };
}

export function recordCareActivity(
  state: GameState,
  kind: CareActivityKind,
): CareActivityResult {
  const p = state.progress;
  const prevLevel = getBondLevelInfo(p.xp).level;

  let xpGain = 0;
  let taskKey: CareTaskKey | null = null;

  switch (kind) {
    case 'feed':
      p.lifetime.mealsServed = clamp(p.lifetime.mealsServed + 1, 0, 999_999);
      xpGain = 12;
      taskKey = 'fed';
      break;
    case 'bath':
      p.lifetime.bathsGiven = clamp(p.lifetime.bathsGiven + 1, 0, 999_999);
      xpGain = 15;
      taskKey = 'bathed';
      break;
    case 'pet':
      p.lifetime.petsGiven = clamp(p.lifetime.petsGiven + 1, 0, 999_999);
      xpGain = 3;
      taskKey = 'played';
      break;
    case 'play':
      p.lifetime.playSessions = clamp(p.lifetime.playSessions + 1, 0, 999_999);
      xpGain = 6;
      taskKey = 'played';
      break;
    case 'minigame':
      p.lifetime.miniGamesPlayed = clamp(p.lifetime.miniGamesPlayed + 1, 0, 999_999);
      xpGain = 14;
      taskKey = 'played';
      break;
    case 'nap':
      p.lifetime.napsTaken = clamp(p.lifetime.napsTaken + 1, 0, 999_999);
      xpGain = 12;
      taskKey = 'slept';
      break;
    case 'style':
      p.lifetime.outfitsStyled = clamp(p.lifetime.outfitsStyled + 1, 0, 999_999);
      xpGain = 6;
      taskKey = null;
      break;
  }

  let taskJustCompleted: CareTaskKey | null = null;
  if (taskKey && !p.todayCare[taskKey]) {
    p.todayCare[taskKey] = true;
    taskJustCompleted = taskKey;
    xpGain += 10;
  }

  let perfectDayAchieved = false;
  let bonusCoins = 0;
  if (!p.perfectDayClaimed && getDailyCareCount(p.todayCare) === 4) {
    p.perfectDayClaimed = true;
    p.perfectDays = clamp(p.perfectDays + 1, 0, 99_999);
    perfectDayAchieved = true;
    bonusCoins = 20;
    xpGain += 30;
    state.coins = clamp(state.coins + bonusCoins, 0, 999_999);
    p.lifetime.totalCoinsEarned = clamp(p.lifetime.totalCoinsEarned + bonusCoins, 0, 999_999);
  }

  p.xp = clamp(p.xp + xpGain, 0, 9_999_999);
  p.todayXp = clamp(p.todayXp + xpGain, 0, 999_999);

  const newLevel = getBondLevelInfo(p.xp).level;
  return {
    leveledUp: newLevel > prevLevel,
    newLevel,
    taskJustCompleted,
    perfectDayAchieved,
    bonusCoins,
  };
}

export function getProfileMilestones(profile: ProfileSnapshot): ProfileMilestone[] {
  const { progress, highScore, ownedAccessories } = profile;
  const level = getBondLevelInfo(progress.xp).level;
  const unlockedWardrobe = ownedAccessories.filter((id) => id !== 'none').length;

  const defs: Array<{
    id: string;
    title: string;
    description: string;
    current: number;
    target: number;
  }> = [
    {
      id: 'first_meal',
      title: 'First Feast',
      description: 'Serve Mochi a tasty meal in the Kitchen.',
      current: progress.lifetime.mealsServed,
      target: 1,
    },
    {
      id: 'first_bath',
      title: 'Sparkling Coat',
      description: 'Complete a full bubble bath & rinse.',
      current: progress.lifetime.bathsGiven,
      target: 1,
    },
    {
      id: 'three_days',
      title: '3 Days Together',
      description: 'Reach Day 3 on your meadow calendar.',
      current: progress.currentDay,
      target: 3,
    },
    {
      id: 'bond_lv3',
      title: 'Best Friends',
      description: 'Grow your Bond to Level 3.',
      current: level,
      target: 3,
    },
    {
      id: 'perfect_day',
      title: 'Perfect Care Day',
      description: 'Feed, bathe, play, and rest in a single day.',
      current: progress.perfectDays,
      target: 1,
    },
    {
      id: 'wardrobe_3',
      title: 'Wardrobe Stylist',
      description: 'Collect 3 accessories in the Closet.',
      current: unlockedWardrobe,
      target: 3,
    },
    {
      id: 'angler',
      title: 'Fish Catch Pro',
      description: 'Score 60 or more in Fish Catch.',
      current: highScore,
      target: 60,
    },
    {
      id: 'week_together',
      title: 'Meadow Regular',
      description: 'Spend 7 days caring for your kitty.',
      current: progress.currentDay,
      target: 7,
    },
  ];

  return defs.map((d) => ({
    ...d,
    current: Math.min(d.current, d.target),
    unlocked: d.current >= d.target,
  }));
}

// ---------------------------------------------------------------------------
// MOBILE TOUCH ERGONOMICS HELPERS
// ---------------------------------------------------------------------------

/**
 * Extra hit radius padding (in world pixels) granted to touch pointers so small interactive
 * props feel effortless to grab with a thumb without degrading mouse precision.
 */
export function getTouchHitPadding(isTouch: boolean): number {
  return isTouch ? 7 : 0;
}

/**
 * Returns the visual and drop-target world position of the currently dragged item.
 * On touchscreens, small carried items lift upward by 22 world px so the player's finger
 * never obscures the food, sponge, towel, accessory, or paint jar being placed.
 */
export function getDraggedItemPoint(state: GameState): { x: number; y: number; lifted: boolean } {
  const drag = state.drag;
  const shouldLift =
    Boolean(state.pointerIsTouch && drag) &&
    drag !== null &&
    drag.kind !== 'cat' &&
    drag.kind !== 'blanket' &&
    drag.kind !== 'wand' &&
    drag.kind !== 'yarn';
  return {
    x: state.pointerX,
    y: shouldLift ? clamp(state.pointerY - 22, 18, H - 10) : state.pointerY,
    lifted: shouldLift,
  };
}

/**
 * Detects a deliberate horizontal swipe across open room space to glide between adjacent rooms
 * in ROOM_ORDER (bedroom <-> bathroom <-> playroom <-> kitchen <-> closet).
 * Returns null if the gesture is too short, too vertical, too slow, or not on a room screen.
 */
export function detectRoomSwipe(
  currentScreen: ScreenId,
  dx: number,
  dy: number,
  durationMs: number,
): RoomId | null {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(durationMs)) return null;
  const idx = ROOM_ORDER.indexOf(currentScreen as RoomId);
  if (idx === -1) return null;
  if (durationMs <= 0 || durationMs > 460) return null;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 56 || absX < absY * 1.65) return null;

  // Swiping left (dx < 0) moves to next room on the right; swiping right (dx > 0) moves left
  const step = dx < 0 ? 1 : -1;
  const nextIdx = (idx + step + ROOM_ORDER.length) % ROOM_ORDER.length;
  return ROOM_ORDER[nextIdx];
}


