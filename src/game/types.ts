export const W = 400;
export const H = 300;
export const STORAGE_KEY = 'mochi_pixel_cat_v2';

export type ScreenId =
  | 'title'
  | 'hub'
  | 'bedroom'
  | 'bathroom'
  | 'playroom'
  | 'kitchen'
  | 'closet';

export type RoomId = Exclude<ScreenId, 'title' | 'hub'>;

export const ROOM_ORDER: readonly RoomId[] = [
  'bedroom',
  'bathroom',
  'playroom',
  'kitchen',
  'closet',
];

export type FurId = 'classic' | 'tabby' | 'tuxedo' | 'cotton';
export type AccessoryId = 'none' | 'bow' | 'shades' | 'daisy' | 'scarf' | 'frog' | 'crown';
export type FoodId = 'fish' | 'milk' | 'boba' | 'sushi' | 'cake';
export type MiniGameItemType = 'fish' | 'star' | 'heart' | 'boot';

export type CatExpression =
  | 'idle'
  | 'happy'
  | 'surprised'
  | 'talking'
  | 'eating'
  | 'sleeping'
  | 'excited'
  | 'carried';

export type StatKey = 'hunger' | 'hygiene' | 'energy' | 'fun';

export interface FurPalette {
  id: FurId;
  name: string;
  swatch: string;
  body: string;
  shade: string;
  patch: string;
  patchDark: string;
  earInner: string;
  blush: string;
  outline: string;
  jarX: number;
  jarY: number;
}

export interface AccessoryDef {
  id: AccessoryId;
  label: string;
  cost: number;
  shelfX: number;
  shelfY: number;
}

export interface FoodDef {
  id: FoodId;
  label: string;
  cost: number;
  hunger: number;
  fun: number;
  energy: number;
  msg: string;
  homeX: number;
  homeY: number;
}

export interface HubCardDef {
  id: RoomId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stat: StatKey | null;
}

export interface SoapBubble {
  rx: number;
  ry: number;
  r: number;
}

export interface WaterDrop {
  x: number;
  y: number;
  vy: number;
}

export interface FloatingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  wobble: number;
}

export interface MiniGameItem {
  type: MiniGameItemType;
  x: number;
  y: number;
  vy: number;
}

export type DragItem =
  | { kind: 'cat'; offsetX: number; offsetY: number }
  | { kind: 'sponge' }
  | { kind: 'towel' }
  | { kind: 'duck'; vx: number; vy: number }
  | { kind: 'blanket'; startY: number }
  | { kind: 'yarn'; vx: number; vy: number }
  | { kind: 'wand' }
  | { kind: 'fridge_food'; fridgeIndex: number; foodId: FoodId }
  | { kind: 'table_food'; tableIndex: number; foodId: FoodId }
  | { kind: 'accessory'; accId: AccessoryId }
  | { kind: 'worn_accessory'; accId: AccessoryId }
  | { kind: 'fur'; furId: FurId };

export interface Particle {
  active: boolean;
  type: 'heart' | 'sparkle' | 'zzz' | 'bubble' | 'crumb' | 'note' | 'steam' | 'splash' | 'dust';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  phase: number;
}

export type CareTaskKey = 'fed' | 'bathed' | 'played' | 'slept';

export interface DailyCareChecklist {
  fed: boolean;
  bathed: boolean;
  played: boolean;
  slept: boolean;
}

export interface DayLogEntry {
  dayNumber: number;
  date: string;
  careCount: number;
  avgWellness: number;
  xpEarned: number;
  perfect: boolean;
}

export interface LifetimeCounters {
  mealsServed: number;
  bathsGiven: number;
  petsGiven: number;
  napsTaken: number;
  playSessions: number;
  miniGamesPlayed: number;
  outfitsStyled: number;
  totalCoinsEarned: number;
}

export interface ProgressState {
  startedDate: string;
  lastVisitDate: string;
  currentDay: number;
  totalDaysVisited: number;
  streakDays: number;
  bestStreak: number;
  perfectDays: number;
  xp: number;
  todayXp: number;
  todayCare: DailyCareChecklist;
  perfectDayClaimed: boolean;
  dayHistory: DayLogEntry[];
  lifetime: LifetimeCounters;
}

export interface ProfileSnapshot {
  fur: FurId;
  accessory: AccessoryId;
  ownedAccessories: AccessoryId[];
  highScore: number;
  progress: ProgressState;
}

export interface HudSnapshot {
  screen: ScreenId;
  miniGameActive: boolean;
  petName: string;
  coins: number;
  muted: boolean;
  stats: Record<StatKey, number>;
  hint: string;
  fridgeCount: number;
  fridgeCapacity: number;
  tableCount: number;
  profile: ProfileSnapshot;
}

export interface PersistedData {
  petName: string;
  coins: number;
  muted: boolean;
  stats: Record<StatKey, number>;
  fur: FurId;
  accessory: AccessoryId;
  ownedAccessories: AccessoryId[];
  highScore: number;
  fridgeItems?: FoodId[];
  tableItems?: FoodId[];
  progress?: Partial<ProgressState>;
}

export interface GameState {
  screen: ScreenId;
  petName: string;
  coins: number;
  muted: boolean;
  stats: Record<StatKey, number>;
  fur: FurId;
  accessory: AccessoryId;
  ownedAccessories: AccessoryId[];
  highScore: number;
  progress: ProgressState;

  // Transition fade/wipe
  transition: {
    alpha: number;
    phase: 'none' | 'out' | 'in';
    target: ScreenId | null;
  };

  bedroom: {
    lampOn: boolean;
    curtainsOpen: boolean;
    sleeping: boolean;
    blanketPulled: boolean;
    musicBoxOn: boolean;
    musicTimer: number;
    shootingStar: number;
    bunnyBounce: number;
    catFloorX: number;
    catFloorY: number;
  };

  bathroom: {
    showerOn: boolean;
    soapLevel: number;
    wetLevel: number;
    soapBubbles: SoapBubble[];
    waterDrops: WaterDrop[];
    floatingBubbles: FloatingBubble[];
    mirrorFog: number; // 0..1
    duckX: number;
    duckY: number;
    duckVx: number;
    duckVy: number;
    duckHop: number;
    boatBob: number;
    spongeX: number;
    spongeY: number;
    towelX: number;
    towelY: number;
  };

  playroom: {
    recording: boolean;
    mimicking: boolean;
    audioAmp: number;
    micLevel: number;
    hornBounce: number;
    yarn: {
      active: boolean;
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
    };
    mouse: {
      active: boolean;
      x: number;
      y: number;
      vx: number;
      dir: 1 | -1;
      windTimer: number;
    };
    wand: {
      x: number;
      y: number;
      homeX: number;
      homeY: number;
    };
    catX: number;
    catY: number;
    miniGame: {
      active: boolean;
      score: number;
      coinsEarned: number;
      timeLeft: number;
      catX: number;
      targetX: number;
      items: MiniGameItem[];
      popups: Array<{ x: number; y: number; text: string; color: string; life: number }>;
      spawnTimer: number;
      gameOver: boolean;
    };
  };

  kitchen: {
    fridgeOpen: boolean;
    fridgeItems: FoodId[];
    tableItems: FoodId[];
    kettleSteamTimer: number;
    flyingFood: {
      id: FoodId;
      sx: number;
      sy: number;
      tx: number;
      ty: number;
      x: number;
      y: number;
      t: number;
      food: FoodDef;
    } | null;
    bowlFood: FoodId | null;
    bowlTimer: number;
  };

  closet: {
    mirrorFlash: number;
    poseTimer: number;
  };

  cat: {
    hopY: number;
    hopVy: number;
    scaleX: number;
    scaleY: number;
    gazeX: number;
    gazeY: number;
    expression: CatExpression;
    exprTimer: number;
    blinkTimer: number;
    isBlinking: boolean;
    earTwitchTimer: number;
    earTwitch: number;
    mouthOpen: number;
    speechText: string;
    speechTimer: number;
    petRubDist: number;
    purrCooldown: number;
    idleActionTimer: number;
  };

  butterflies: Butterfly[];
  drag: DragItem | null;
  hoveredTarget: string | null;
  pointerDown: boolean;
  pointerIsTouch: boolean;
  pointerX: number;
  pointerY: number;
  lastPointerX: number;
  lastPointerY: number;
  pointerVx: number;
  pointerVy: number;
  pointerDownTime: number;
  pointerMovedDist: number;
  consumedDown: boolean;
  keys: { left: boolean; right: boolean };
}

export const FUR_PALETTES: Record<FurId, FurPalette> = {
  classic: {
    id: 'classic',
    name: 'CLASSIC',
    swatch: '#b59282',
    body: '#ffffff',
    shade: '#ded9d5',
    patch: '#b59282',
    patchDark: '#8c6d5f',
    earInner: '#f2a499',
    blush: '#f59aa3',
    outline: '#09090d',
    jarX: 81,
    jarY: 206,
  },
  tabby: {
    id: 'tabby',
    name: 'TABBY',
    swatch: '#e88b43',
    body: '#ffe0b5',
    shade: '#f0c48d',
    patch: '#e88b43',
    patchDark: '#bd6526',
    earInner: '#f7a6a1',
    blush: '#f28b94',
    outline: '#09090d',
    jarX: 103,
    jarY: 215,
  },
  tuxedo: {
    id: 'tuxedo',
    name: 'TUXEDO',
    swatch: '#3a4154',
    body: '#3a4154',
    shade: '#272c3b',
    patch: '#ffffff',
    patchDark: '#d9dde8',
    earInner: '#e899a4',
    blush: '#f28d9d',
    outline: '#09090d',
    jarX: 125,
    jarY: 224,
  },
  cotton: {
    id: 'cotton',
    name: 'COTTON',
    swatch: '#f2a2d4',
    body: '#fff5fb',
    shade: '#ebd8e6',
    patch: '#f2a2d4',
    patchDark: '#c978ad',
    earInner: '#ffd1dc',
    blush: '#ff8fb8',
    outline: '#09090d',
    jarX: 147,
    jarY: 232,
  },
};

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'bow', label: 'PINK BOW', cost: 0, shelfX: 248, shelfY: 109 },
  { id: 'shades', label: 'SHADES', cost: 10, shelfX: 287, shelfY: 124 },
  { id: 'daisy', label: 'DAISY', cost: 12, shelfX: 326, shelfY: 139 },
  { id: 'scarf', label: 'SCARF', cost: 15, shelfX: 248, shelfY: 151 },
  { id: 'frog', label: 'FROG HAT', cost: 20, shelfX: 287, shelfY: 166 },
  { id: 'crown', label: 'CROWN', cost: 30, shelfX: 326, shelfY: 181 },
];

export const FOODS: FoodDef[] = [
  {
    id: 'fish',
    label: 'FISH',
    cost: 0,
    hunger: 20,
    fun: 4,
    energy: 2,
    msg: 'YUMMY FISH!',
    homeX: 266,
    homeY: 164,
  },
  {
    id: 'milk',
    label: 'MILK',
    cost: 0,
    hunger: 16,
    fun: 4,
    energy: 6,
    msg: 'SLURP SLURP~',
    homeX: 306,
    homeY: 180,
  },
  {
    id: 'boba',
    label: 'BOBA',
    cost: 5,
    hunger: 22,
    fun: 16,
    energy: 8,
    msg: 'SWEET BOBA!',
    homeX: 252,
    homeY: 207,
  },
  {
    id: 'sushi',
    label: 'SUSHI',
    cost: 8,
    hunger: 36,
    fun: 10,
    energy: 5,
    msg: 'FANCY SUSHI!',
    homeX: 288,
    homeY: 219,
  },
  {
    id: 'cake',
    label: 'CAKE',
    cost: 10,
    hunger: 30,
    fun: 26,
    energy: 6,
    msg: 'BEST CAKE <3',
    homeX: 228,
    homeY: 229,
  },
];

export interface StageViewport {
  bufW: number;
  bufH: number;
  offsetX: number;
  offsetY: number;
  isPortrait: boolean;
}

export const HUB_CARDS: HubCardDef[] = [
  { id: 'bedroom', label: 'BEDROOM', x: 56, y: 46, w: 76, h: 58, stat: 'energy' },
  { id: 'bathroom', label: 'BATHROOM', x: 268, y: 46, w: 76, h: 58, stat: 'hygiene' },
  { id: 'playroom', label: 'PLAYROOM', x: 162, y: 112, w: 76, h: 58, stat: 'fun' },
  { id: 'kitchen', label: 'KITCHEN', x: 56, y: 178, w: 76, h: 58, stat: 'hunger' },
  { id: 'closet', label: 'CLOSET', x: 268, y: 178, w: 76, h: 58, stat: null },
];

export const PORTRAIT_HUB_CARDS: HubCardDef[] = [
  { id: 'bedroom', label: 'BEDROOM', x: 52, y: -14, w: 112, h: 78, stat: 'energy' },
  { id: 'bathroom', label: 'BATHROOM', x: 236, y: -14, w: 112, h: 78, stat: 'hygiene' },
  { id: 'playroom', label: 'PLAYROOM', x: 144, y: 104, w: 112, h: 78, stat: 'fun' },
  { id: 'kitchen', label: 'KITCHEN', x: 52, y: 222, w: 112, h: 78, stat: 'hunger' },
  { id: 'closet', label: 'CLOSET', x: 236, y: 222, w: 112, h: 78, stat: null },
];

export const FRIDGE_CAPACITY = 6;
export const TABLE_CAPACITY = 3;

export const FRIDGE_SLOTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 74, y: 115 },
  { x: 98, y: 115 },
  { x: 74, y: 145 },
  { x: 98, y: 145 },
  { x: 74, y: 175 },
  { x: 98, y: 175 },
];

export const TABLE_SLOTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 258, y: 205 },
  { x: 236, y: 224 },
  { x: 286, y: 224 },
];

export const ROOM_HINTS: Record<ScreenId, string> = {
  title: 'Pet or boop Mochi, then tap PLAY!',
  hub: 'Tap any cozy room card to visit your kitty.',
  bedroom: 'Drag Mochi to bed · Tap lamp, curtains or music box.',
  bathroom: 'Drag sponge · Tap shower · Drag towel · Pop bubbles.',
  playroom: 'Hold mic · Fling yarn · Wave wand · Tap arcade.',
  kitchen: 'Tap fridge · Drag food to table · Tap Cart to shop.',
  closet: 'Drag hats or paint jars onto Mochi · Tap mirror.',
};

export const MINIGAME_HINT = 'Slide finger to catch fish & stars · Avoid boots!';
