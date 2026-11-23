import { getHubCards } from '../logic';
import { GameState, H, RoomId, W } from '../types';
import { drawPixelCat } from './cat';
import { drawRoundedRect, fillPoly } from './drawUtils';

let meadowCache: HTMLCanvasElement | null = null;
let seamlessCache: { key: string; canvas: HTMLCanvasElement } | null = null;
let fullBleedMeadowActive = false;

export function setFullBleedMeadowActive(active: boolean): void {
  fullBleedMeadowActive = active;
}

export function isFullBleedMeadowActive(): boolean {
  return fullBleedMeadowActive;
}

export function drawSeamlessMeadow(
  ctx: CanvasRenderingContext2D,
  bufW: number,
  bufH: number,
): void {
  const key = `${bufW}x${bufH}`;
  if (!seamlessCache || seamlessCache.key !== key) {
    const c = document.createElement('canvas');
    c.width = bufW;
    c.height = bufH;
    const mctx = c.getContext('2d')!;

    // Deep forest base
    mctx.fillStyle = '#1f4d36';
    mctx.fillRect(0, 0, bufW, bufH);

    // Organic soft grass patches tiled cleanly across portrait height
    mctx.fillStyle = '#23563c';
    for (let py = 28; py < bufH - 40; py += 92) {
      mctx.fillRect(22 + ((py * 17) % 50), py, 86, 48);
      mctx.fillRect(bufW - 126 - ((py * 13) % 36), py + 26, 94, 52);
    }

    // Lush border leaves hugging the actual viewport edges
    const drawLeaf = (x: number, y: number) => {
      mctx.fillStyle = '#143324';
      mctx.fillRect(x, y, 10, 10);
      mctx.fillStyle = '#19402d';
      mctx.fillRect(x + 2, y + 1, 6, 3);
      mctx.fillRect(x + 1, y + 4, 8, 3);
      mctx.fillRect(x + 3, y + 7, 4, 2);
      mctx.fillStyle = '#24573d';
      mctx.fillRect(x + 3, y + 2, 2, 1);
      mctx.fillRect(x + 6, y + 5, 2, 1);
    };

    for (let x = 0; x < bufW; x += 10) {
      drawLeaf(x, 0);
      drawLeaf(x, bufH - 10);
    }
    for (let y = 10; y < bufH - 10; y += 10) {
      drawLeaf(0, y);
      drawLeaf(bufW - 10, y);
    }

    // Crisp grass tufts & wildflowers distributed across the full portrait meadow
    const drawTuft = (x: number, y: number) => {
      mctx.fillStyle = '#133021';
      mctx.fillRect(x, y + 5, 7, 1);
      mctx.fillStyle = '#5fa367';
      mctx.fillRect(x, y + 3, 7, 2);
      mctx.fillRect(x + 1, y + 2, 5, 1);
      mctx.fillStyle = '#89c981';
      mctx.fillRect(x + 2, y + 1, 3, 2);
      mctx.fillRect(x + 3, y, 1, 1);
    };

    const drawDaisy = (x: number, y: number, pink: boolean) => {
      mctx.fillStyle = '#123323';
      mctx.fillRect(x + 2, y + 8, 5, 1);
      mctx.fillStyle = pink ? '#ffd6e6' : '#ffffff';
      mctx.fillRect(x + 2, y, 5, 8);
      mctx.fillRect(x, y + 2, 9, 4);
      mctx.fillStyle = '#f5cf38';
      mctx.fillRect(x + 3, y + 3, 3, 2);
    };

    for (let i = 0; i < 42; i++) {
      const tx = 18 + ((i * 73 + 29) % Math.max(40, bufW - 44));
      const ty = 18 + ((i * 107 + 19) % Math.max(40, bufH - 44));
      drawTuft(tx, ty);
      if (i % 4 === 0) {
        drawDaisy(
          16 + ((i * 97 + 41) % Math.max(40, bufW - 44)),
          18 + ((i * 131 + 37) % Math.max(40, bufH - 44)),
          i % 8 === 0,
        );
      }
    }

    seamlessCache = { key, canvas: c };
  }
  ctx.drawImage(seamlessCache.canvas, 0, 0);
}

export function getMeadowBackdrop(): HTMLCanvasElement {
  if (meadowCache) return meadowCache;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const mctx = c.getContext('2d')!;

  // Base deep forest green
  mctx.fillStyle = '#1f4d36';
  mctx.fillRect(0, 0, W, H);

  // Subtle organic meadow color dither patches
  mctx.fillStyle = '#23563c';
  [
    [40, 60, 74, 48],
    [250, 44, 90, 56],
    [130, 118, 140, 80],
    [60, 200, 92, 54],
    [260, 198, 96, 56],
  ].forEach(([x, y, w, h]) => mctx.fillRect(x, y, w, h));

  function drawBorderLeaf(x: number, y: number) {
    mctx.fillStyle = '#143324';
    mctx.fillRect(x, y, 10, 10);
    mctx.fillStyle = '#19402d';
    mctx.fillRect(x + 2, y + 1, 6, 3);
    mctx.fillRect(x + 1, y + 4, 8, 3);
    mctx.fillRect(x + 3, y + 7, 4, 2);
    mctx.fillStyle = '#24573d';
    mctx.fillRect(x + 3, y + 2, 2, 1);
    mctx.fillRect(x + 6, y + 5, 2, 1);
  }

  for (let x = 0; x < W; x += 10) {
    drawBorderLeaf(x, 0);
    drawBorderLeaf(x, H - 10);
  }
  for (let y = 10; y < H - 10; y += 10) {
    drawBorderLeaf(0, y);
    drawBorderLeaf(W - 10, y);
  }

  mctx.fillStyle = '#173b29';
  mctx.fillRect(10, 10, W - 20, 2);
  mctx.fillRect(10, H - 12, W - 20, 2);

  function drawTuft(x: number, y: number) {
    mctx.fillStyle = '#133021';
    mctx.fillRect(x, y + 5, 7, 1);
    mctx.fillStyle = '#5fa367';
    mctx.fillRect(x, y + 3, 7, 2);
    mctx.fillRect(x + 1, y + 2, 5, 1);
    mctx.fillStyle = '#89c981';
    mctx.fillRect(x + 2, y + 1, 3, 2);
    mctx.fillRect(x + 3, y, 1, 1);
    mctx.fillStyle = '#3d7347';
    mctx.fillRect(x + 1, y + 4, 2, 1);
    mctx.fillRect(x + 4, y + 4, 2, 1);
  }

  function drawChevronPair(x: number, y: number) {
    mctx.fillStyle = '#123323';
    mctx.fillRect(x + 2, y, 3, 1);
    mctx.fillRect(x + 1, y + 1, 2, 1);
    mctx.fillRect(x + 4, y + 1, 2, 1);
    mctx.fillRect(x, y + 2, 2, 1);
    mctx.fillRect(x + 5, y + 2, 2, 1);
    mctx.fillRect(x + 2, y + 7, 3, 1);
    mctx.fillRect(x + 1, y + 8, 2, 1);
    mctx.fillRect(x + 4, y + 8, 2, 1);
    mctx.fillRect(x, y + 9, 2, 1);
    mctx.fillRect(x + 5, y + 9, 2, 1);
  }

  function drawDaisy(x: number, y: number, pink = false) {
    mctx.fillStyle = '#123323';
    mctx.fillRect(x + 2, y + 8, 5, 1);
    mctx.fillStyle = pink ? '#ffd6e6' : '#ffffff';
    mctx.fillRect(x + 2, y, 5, 8);
    mctx.fillRect(x, y + 2, 9, 4);
    mctx.fillStyle = pink ? '#f0aac6' : '#dfe6eb';
    mctx.fillRect(x + 1, y + 6, 7, 1);
    mctx.fillStyle = '#f5cf38';
    mctx.fillRect(x + 3, y + 3, 3, 2);
  }

  function drawSteppingStone(x: number, y: number) {
    mctx.fillStyle = '#143324';
    mctx.fillRect(x - 1, y + 1, 10, 6);
    mctx.fillStyle = '#9db0a4';
    mctx.fillRect(x, y, 8, 5);
    mctx.fillStyle = '#c4d4c9';
    mctx.fillRect(x + 1, y + 1, 5, 2);
  }

  const tuftRows = [
    { x: 148, y: 20, count: 8, dx: 10, dy: 0 },
    { x: 40, y: 34, count: 5, dx: 0, dy: 10 },
    { x: 66, y: 34, count: 5, dx: 0, dy: 10 },
    { x: 120, y: 46, count: 3, dx: 9, dy: 0 },
    { x: 82, y: 74, count: 9, dx: 0, dy: 11 },
    { x: 34, y: 148, count: 7, dx: 0, dy: 11 },
    { x: 42, y: 220, count: 4, dx: 10, dy: 0 },
    { x: 152, y: 82, count: 12, dx: 9, dy: 0 },
    { x: 150, y: 92, count: 12, dx: 0, dy: 11 },
    { x: 292, y: 92, count: 8, dx: 9, dy: 0 },
    { x: 292, y: 124, count: 8, dx: 9, dy: 0 },
    { x: 360, y: 54, count: 5, dx: 0, dy: 11 },
    { x: 274, y: 28, count: 5, dx: 0, dy: 10 },
    { x: 300, y: 28, count: 5, dx: 0, dy: 10 },
    { x: 244, y: 194, count: 4, dx: 0, dy: 11 },
    { x: 280, y: 244, count: 7, dx: 10, dy: 0 },
    { x: 356, y: 176, count: 8, dx: 0, dy: 11 },
    { x: 114, y: 234, count: 4, dx: 0, dy: 10 },
    { x: 186, y: 196, count: 7, dx: 0, dy: 11 },
  ];

  tuftRows.forEach((r) => {
    for (let i = 0; i < r.count; i++) {
      drawTuft(r.x + i * r.dx, r.y + i * r.dy);
    }
  });

  [
    [206, 42],
    [244, 58],
    [118, 76],
    [118, 134],
    [268, 152],
    [358, 114],
    [48, 254],
    [234, 270],
    [296, 268],
    [306, 198],
  ].forEach(([x, y]) => drawTuft(x, y));

  [
    [22, 32],
    [22, 92],
    [22, 174],
    [22, 238],
    [54, 92],
    [100, 62],
    [140, 96],
    [182, 54],
    [242, 28],
    [336, 46],
    [336, 148],
    [378, 52],
    [378, 134],
    [378, 224],
    [122, 166],
    [94, 250],
  ].forEach(([x, y]) => drawChevronPair(x, y));

  // Cozy stepping stones linking center to rooms
  [
    [140, 108],
    [152, 118],
    [246, 108],
    [258, 98],
    [140, 182],
    [150, 172],
    [248, 182],
    [258, 192],
  ].forEach(([x, y]) => drawSteppingStone(x, y));

  [
    [70, 56, false],
    [274, 38, false],
    [282, 82, true],
    [360, 126, false],
    [144, 184, true],
    [36, 218, false],
    [264, 246, false],
    [194, 266, true],
  ].forEach(([x, y, pink]) => drawDaisy(x as number, y as number, pink as boolean));

  meadowCache = c;
  return c;
}

export function drawMeadowWildlife(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  // Drifting golden pollen motes
  ctx.fillStyle = 'rgba(255, 246, 184, 0.55)';
  for (let i = 0; i < 8; i++) {
    const px = ((i * 53 + time * (6 + (i % 3) * 2)) % (W - 30)) + 15;
    const py = ((i * 39 + Math.sin(time * 1.4 + i) * 14) % (H - 36)) + 18;
    ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
  }

  // Fluttering pixel butterflies
  state.butterflies.forEach((b) => {
    const flap = Math.sin(time * 14 + b.phase) > 0;
    const bx = Math.round(b.x);
    const by = Math.round(b.y + Math.sin(time * 4 + b.phase) * 3);
    ctx.fillStyle = '#09090d';
    ctx.fillRect(bx, by, 1, 3);
    ctx.fillStyle = b.color;
    if (flap) {
      ctx.fillRect(bx - 3, by - 2, 3, 3);
      ctx.fillRect(bx + 1, by - 2, 3, 3);
    } else {
      ctx.fillRect(bx - 2, by, 2, 2);
      ctx.fillRect(bx + 1, by, 2, 2);
    }
  });
}

export function drawTitleScreen(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  if (!fullBleedMeadowActive) {
    ctx.drawImage(getMeadowBackdrop(), 0, 0);
  }

  // Soft sunlit clearing patch & cozy red-capped meadow mushrooms around Mochi
  ctx.fillStyle = 'rgba(148, 224, 146, 0.16)';
  ctx.beginPath();
  ctx.ellipse(W / 2, 162, 74, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 248, 196, 0.14)';
  ctx.beginPath();
  ctx.ellipse(W / 2, 162, 52, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute tiny red-spotted meadow mushrooms flanking clearing
  const drawMushroom = (mx: number, my: number) => {
    ctx.fillStyle = '#0e2418';
    ctx.fillRect(mx - 4, my - 4, 9, 9);
    ctx.fillStyle = '#f5ecd7';
    ctx.fillRect(mx - 2, my, 5, 4);
    ctx.fillStyle = '#e85d75';
    ctx.fillRect(mx - 3, my - 3, 7, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 2, my - 2, 1, 1);
    ctx.fillRect(mx + 1, my - 1, 1, 1);
  };
  drawMushroom(114, 178);
  drawMushroom(284, 174);
  drawMushroom(294, 182);

  drawMeadowWildlife(ctx, state, time);

  // Crisp pixel emblem banner plaque above Mochi
  const titleText = `~ ${state.petName} ~`;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0c2116';
  ctx.fillText(titleText, W / 2 + 2, 46 + 2);
  ctx.fillStyle = '#e7faec';
  ctx.fillText(titleText, W / 2, 46);

  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = '#0c2116';
  ctx.fillText('PIXEL TALKING CAT', W / 2 + 1, 63 + 1);
  ctx.fillStyle = '#a8e8b6';
  ctx.fillText('PIXEL TALKING CAT', W / 2, 63);

  // Centerpiece Mochi with gentle idle & gaze tracking
  drawPixelCat(ctx, W / 2, 140, 4.2, time, {
    fur: state.fur,
    accessory: state.accessory,
    expression: state.cat.expression,
    blink: state.cat.isBlinking,
    mouthOpen: state.cat.mouthOpen,
    hopY: state.cat.hopY,
    scaleX: state.cat.scaleX,
    scaleY: state.cat.scaleY,
    gazeX: state.cat.gazeX,
    gazeY: state.cat.gazeY,
    earTwitch: state.cat.earTwitch,
  });
}

function drawMiniIsoRoom(
  ctx: CanvasRenderingContext2D,
  id: RoomId,
  cx: number,
  cy: number,
  time: number,
  state: GameState,
): void {
  const rw = 24;
  const rh = 12;
  const wallH = 23;
  const topY = cy - 18;

  const apex: [number, number] = [cx, topY];
  const leftTop: [number, number] = [cx - rw, topY + rh];
  const rightTop: [number, number] = [cx + rw, topY + rh];
  const midCorner: [number, number] = [cx, topY + wallH];
  const leftBot: [number, number] = [cx - rw, topY + rh + wallH];
  const rightBot: [number, number] = [cx + rw, topY + rh + wallH];
  const frontBot: [number, number] = [cx, topY + rh * 2 + wallH];

  if (id === 'bedroom') {
    fillPoly(ctx, [apex, leftTop, leftBot, midCorner], '#d49af0', '#110d17');
    fillPoly(ctx, [apex, rightTop, rightBot, midCorner], '#c07fe3', '#110d17');
    ctx.fillStyle = '#e5befa';
    for (let i = 4; i < rw; i += 5) {
      ctx.fillRect(cx - i, topY + Math.round(i * 0.5) + 1, 1, wallH - 2);
      ctx.fillRect(cx + i, topY + Math.round(i * 0.5) + 1, 1, wallH - 2);
    }
    fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], '#e8a7cb', '#110d17');
    // Bed
    fillPoly(
      ctx,
      [
        [cx + 2, topY + 23],
        [cx + 16, topY + 30],
        [cx + 6, topY + 36],
        [cx - 8, topY + 29],
      ],
      '#87369e',
      '#110d17',
    );
    fillPoly(
      ctx,
      [
        [cx + 2, topY + 23],
        [cx + 9, topY + 26],
        [cx + 6, topY + 29],
        [cx - 1, topY + 26],
      ],
      '#f2d4ff',
      '#110d17',
    );
    // Glowing mini lamp
    ctx.fillStyle = state.bedroom.lampOn && Math.sin(time * 3) > -0.7 ? '#fff199' : '#6f6582';
    ctx.fillRect(cx - 14, topY + 21, 5, 5);
  } else if (id === 'bathroom') {
    fillPoly(ctx, [apex, leftTop, leftBot, midCorner], '#9fd4de', '#110d17');
    fillPoly(ctx, [apex, rightTop, rightBot, midCorner], '#b8e4eb', '#110d17');
    fillPoly(ctx, [[cx, topY + 12], [cx - rw, topY + rh + 12], leftBot, midCorner], '#dce8eb', '#5f7682');
    fillPoly(ctx, [[cx, topY + 12], [cx + rw, topY + rh + 12], rightBot, midCorner], '#eaf2f5', '#5f7682');
    fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], '#eef6f7', '#110d17');
    ctx.fillStyle = '#c47b3b';
    ctx.fillRect(cx - 20, topY + 14, 10, 3);
    ctx.fillStyle = '#3c78b8';
    ctx.fillRect(cx - 19, topY + 10, 8, 4);
    ctx.fillStyle = '#7c8d99';
    ctx.fillRect(cx + 8, topY + 8, 6, 2);
    ctx.fillRect(cx + 13, topY + 10, 2, 11);
    fillPoly(
      ctx,
      [
        [cx + 3, topY + 24],
        [cx + 16, topY + 30],
        [cx + 7, topY + 35],
        [cx - 6, topY + 29],
      ],
      '#ffffff',
      '#2e3a42',
    );
    // Tiny animated floating bubble
    const by = topY + 18 - Math.round((time * 8) % 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 2, by, 3, 3);
    // Duck
    ctx.fillStyle = '#ffe033';
    ctx.fillRect(cx - 3, topY + 36, 5, 3);
    ctx.fillStyle = '#f07422';
    ctx.fillRect(cx + 2, topY + 37, 2, 1);
  } else if (id === 'playroom') {
    fillPoly(ctx, [apex, leftTop, leftBot, midCorner], '#f0dfb4', '#110d17');
    fillPoly(ctx, [apex, rightTop, rightBot, midCorner], '#e3ce9d', '#110d17');
    fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], '#c98e59', '#110d17');
    fillPoly(
      ctx,
      [
        [cx, topY + 26],
        [cx + 13, topY + 32],
        [cx, topY + 39],
        [cx - 13, topY + 32],
      ],
      '#e86f8c',
      '#822c44',
    );
    fillPoly(
      ctx,
      [
        [cx, topY + 28],
        [cx + 8, topY + 32],
        [cx, topY + 36],
        [cx - 8, topY + 32],
      ],
      '#ffd166',
    );
    // Mic
    ctx.fillStyle = '#2b3242';
    ctx.fillRect(cx - 7, topY + 18, 2, 13);
    ctx.fillStyle = '#cfd8e3';
    ctx.fillRect(cx - 8, topY + 15, 4, 4);
    // Mini arcade screen glow
    ctx.fillStyle = '#36416e';
    ctx.fillRect(cx + 8, topY + 15, 9, 14);
    ctx.fillStyle = Math.sin(time * 5) > 0 ? '#7be0ff' : '#ffd43b';
    ctx.fillRect(cx + 10, topY + 18, 5, 5);
    // Yarn ball
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(cx + 2, topY + 32, 5, 5);
  } else if (id === 'kitchen') {
    fillPoly(ctx, [apex, leftTop, leftBot, midCorner], '#f7e49e', '#110d17');
    fillPoly(ctx, [apex, rightTop, rightBot, midCorner], '#ebd383', '#110d17');
    fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], '#f5ead6', '#110d17');
    ctx.fillStyle = '#d97b66';
    ctx.fillRect(cx - 9, topY + 30, 4, 3);
    ctx.fillRect(cx, topY + 30, 4, 3);
    ctx.fillRect(cx - 4, topY + 34, 4, 3);
    ctx.fillRect(cx + 4, topY + 34, 4, 3);
    // Mint fridge
    ctx.fillStyle = '#75d6b8';
    ctx.fillRect(cx - 16, topY + 11, 10, 17);
    ctx.strokeStyle = '#110d17';
    ctx.strokeRect(cx - 16, topY + 11, 10, 17);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 8, topY + 14, 1, 5);
    // Counter + steaming kettle
    fillPoly(
      ctx,
      [
        [cx + 2, topY + 24],
        [cx + 15, topY + 30],
        [cx + 7, topY + 35],
        [cx - 6, topY + 29],
      ],
      '#a8693b',
      '#110d17',
    );
    ctx.fillStyle = '#ff7b54';
    ctx.fillRect(cx + 4, topY + 24, 5, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 6, topY + 20 - Math.round((time * 6) % 5), 2, 2);
  } else if (id === 'closet') {
    fillPoly(ctx, [apex, leftTop, leftBot, midCorner], '#e6b8cf', '#110d17');
    fillPoly(ctx, [apex, rightTop, rightBot, midCorner], '#d49eb9', '#110d17');
    fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], '#b87f5a', '#110d17');
    // Gold mirror with shimmer
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(cx - 14, topY + 10, 10, 16);
    ctx.fillStyle = '#b5f0ff';
    ctx.fillRect(cx - 13, topY + 11, 8, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 12, topY + 13 + Math.round(Math.sin(time * 4)), 2, 5);
    // Shelves + crown + bow
    ctx.fillStyle = '#7d4b2d';
    ctx.fillRect(cx + 4, topY + 16, 13, 2);
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(cx + 6, topY + 12, 5, 4);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(cx + 12, topY + 13, 4, 3);
  }
}

export function drawHubScreen(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  isPortrait = false,
): void {
  if (!fullBleedMeadowActive) {
    ctx.drawImage(getMeadowBackdrop(), 0, 0);
  }

  const cards = getHubCards(isPortrait);

  // Cozy dotted garden paths connecting central Playroom to the 4 outer rooms
  const playCard = cards.find((c) => c.id === 'playroom') ?? cards[2];
  const centerX = playCard.x + playCard.w / 2;
  const centerY = playCard.y + playCard.h / 2;
  cards.forEach((card) => {
    if (card.id === 'playroom') return;
    const tx = card.x + card.w / 2;
    const ty = card.y + card.h / 2;
    for (let s = 1; s <= 4; s++) {
      const t = s / 5;
      const sx = Math.round(centerX + (tx - centerX) * t);
      const sy = Math.round(centerY + (ty - centerY) * t);
      ctx.fillStyle = '#143324';
      ctx.fillRect(sx - 5, sy - 2, 10, 6);
      ctx.fillStyle = '#a8baa8';
      ctx.fillRect(sx - 4, sy - 3, 8, 5);
      ctx.fillStyle = '#d3e0d3';
      ctx.fillRect(sx - 3, sy - 2, 5, 2);
    }
  });

  drawMeadowWildlife(ctx, state, time);

  cards.forEach((card) => {
    const isHover = state.hoveredTarget === `hub:${card.id}`;
    const bounce = isHover ? Math.sin(time * 10) * 1.5 - 2.5 : 0;
    const cx = card.x;
    const cy = card.y + bounce;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    drawRoundedRect(ctx, cx + 2, card.y + 4, card.w, card.h, 10);
    ctx.fill();

    // Navy card with crisp top bevel
    ctx.fillStyle = isHover ? '#3a487d' : '#2a3356';
    drawRoundedRect(ctx, cx, cy, card.w, card.h, 10);
    ctx.fill();

    ctx.strokeStyle = isHover ? '#fff29c' : '#4a5a8c';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cx + 1.5, cy + 1.5, card.w - 3, card.h - 3, 8);
    ctx.stroke();

    ctx.strokeStyle = isHover ? '#fff29c' : '#12172b';
    ctx.lineWidth = isHover ? 2 : 1.5;
    drawRoundedRect(ctx, cx, cy, card.w, card.h, 10);
    ctx.stroke();

    if (isPortrait) {
      ctx.save();
      const midX = cx + card.w / 2;
      const midY = cy + card.h / 2 + 1;
      ctx.translate(midX, midY);
      ctx.scale(1.32, 1.32);
      drawMiniIsoRoom(ctx, card.id, 0, 0, time, state);
      ctx.restore();
    } else {
      drawMiniIsoRoom(ctx, card.id, cx + card.w / 2, cy + card.h / 2 + 1, time, state);
    }

    // Cream label tab underneath
    const pw = isPortrait ? 84 : 66;
    const ph = isPortrait ? 17 : 14;
    const px = cx + (card.w - pw) / 2;
    const py = cy + card.h - 2;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    drawRoundedRect(ctx, px, py + 2, pw, ph, 4);
    ctx.fill();

    ctx.fillStyle = isHover ? '#ffffff' : '#f4efe6';
    drawRoundedRect(ctx, px, py, pw, ph, 4);
    ctx.fill();

    ctx.fillStyle = '#9c3838';
    ctx.font = isPortrait ? '7px "Press Start 2P", monospace' : '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(card.label, cx + card.w / 2, py + (isPortrait ? 11.5 : 10));

    // Low-need exclamation alert badge
    if (card.stat && state.stats[card.stat] < 38) {
      const pulse = Math.sin(time * 8) > 0;
      ctx.fillStyle = '#09090d';
      ctx.fillRect(cx + card.w - 13, cy + 3, 10, 10);
      ctx.fillStyle = pulse ? '#ff4d6d' : '#ff99ac';
      ctx.fillRect(cx + card.w - 12, cy + 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + card.w - 9, cy + 5, 2, 4);
      ctx.fillRect(cx + card.w - 9, cy + 10, 2, 1);
    }
  });
}
