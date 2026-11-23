import { AccessoryId, FoodId, MiniGameItemType } from '../types';

export function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  fill: string | null,
  stroke: string | null = null,
  lineWidth = 1,
): void {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function isoLerp(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
  u: number,
  v: number,
): [number, number] {
  const topX = a[0] + (b[0] - a[0]) * u;
  const topY = a[1] + (b[1] - a[1]) * u;
  const botX = c[0] + (d[0] - c[0]) * u;
  const botY = c[1] + (d[1] - c[1]) * u;
  return [topX + (botX - topX) * v, topY + (botY - topY) * v];
}

export function drawHoverRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  time: number,
  color = '#fff29c',
): void {
  const pulse = Math.sin(time * 7) * 1.5;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), Math.max(8, r + pulse), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawIsoShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 0.22,
): void {
  fillPoly(
    ctx,
    [
      [cx, cy - ry],
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
    ],
    `rgba(12, 10, 20, ${alpha})`,
  );
}

/**
 * Draws a true 3D isometric box/furniture piece from its top diamond corners
 * (back, right, front, left) extruded downwards by `height`.
 */
export function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  topBack: [number, number],
  topRight: [number, number],
  topFront: [number, number],
  topLeft: [number, number],
  height: number,
  colors: {
    top: string;
    left: string;
    right: string;
    outline?: string;
    highlight?: string;
  },
): void {
  const outline = colors.outline ?? '#14101c';
  const botLeft: [number, number] = [topLeft[0], topLeft[1] + height];
  const botFront: [number, number] = [topFront[0], topFront[1] + height];
  const botRight: [number, number] = [topRight[0], topRight[1] + height];

  // Left-front face
  fillPoly(ctx, [topLeft, topFront, botFront, botLeft], colors.left, outline, 1.25);
  // Right-front face
  fillPoly(ctx, [topFront, topRight, botRight, botFront], colors.right, outline, 1.25);
  // Top face
  fillPoly(ctx, [topBack, topRight, topFront, topLeft], colors.top, outline, 1.25);

  if (colors.highlight) {
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topLeft[0] + 1, topLeft[1]);
    ctx.lineTo(topBack[0], topBack[1] + 1);
    ctx.lineTo(topRight[0] - 1, topRight[1]);
    ctx.stroke();
  }
}

export interface IsoRoomShellColors {
  wallLeft: string;
  wallRight: string;
  wallRimTop: string;
  wallRimSide: string;
  floorBase: string;
  slabLeft: string;
  slabRight: string;
  outline: string;
  crown?: string;
}

export function drawIsoRoomShell(
  ctx: CanvasRenderingContext2D,
  corners: {
    apex: [number, number];
    leftTop: [number, number];
    rightTop: [number, number];
    midCorner: [number, number];
    leftBot: [number, number];
    rightBot: [number, number];
    frontBot: [number, number];
  },
  colors: IsoRoomShellColors,
): void {
  const { apex, leftTop, rightTop, midCorner, leftBot, rightBot, frontBot } = corners;
  const thick = 6;
  const slabH = 11;

  // Drop shadow cast by entire diorama onto meadow
  fillPoly(
    ctx,
    [
      [leftBot[0] - thick, leftBot[1] + slabH + 2],
      [frontBot[0], frontBot[1] + slabH + 6],
      [rightBot[0] + thick, rightBot[1] + slabH + 2],
      [midCorner[0], midCorner[1] + slabH + 14],
    ],
    'rgba(4, 12, 8, 0.42)',
  );

  // Outer wall cutaway thickness (left edge & right edge)
  const apexOuter: [number, number] = [apex[0], apex[1] - thick];
  const leftTopOuter: [number, number] = [leftTop[0] - thick, leftTop[1] - 2];
  const leftBotOuter: [number, number] = [leftBot[0] - thick, leftBot[1] - 2];
  const rightTopOuter: [number, number] = [rightTop[0] + thick, rightTop[1] - 2];
  const rightBotOuter: [number, number] = [rightBot[0] + thick, rightBot[1] - 2];

  // Top cutaway wall rims
  fillPoly(ctx, [apexOuter, leftTopOuter, leftTop, apex], colors.wallRimTop, colors.outline, 1.2);
  fillPoly(ctx, [apexOuter, rightTopOuter, rightTop, apex], colors.wallRimTop, colors.outline, 1.2);
  // Side cutaway vertical rims
  fillPoly(ctx, [leftTopOuter, leftTop, leftBot, leftBotOuter], colors.wallRimSide, colors.outline, 1.2);
  fillPoly(ctx, [rightTop, rightTopOuter, rightBotOuter, rightBot], colors.wallRimSide, colors.outline, 1.2);

  // 3D Floor cutaway slab beneath the floor diamond
  fillPoly(
    ctx,
    [leftBotOuter, leftBot, frontBot, [frontBot[0], frontBot[1] + slabH], [leftBotOuter[0], leftBotOuter[1] + slabH]],
    colors.slabLeft,
    colors.outline,
    1.4,
  );
  fillPoly(
    ctx,
    [frontBot, rightBot, rightBotOuter, [rightBotOuter[0], rightBotOuter[1] + slabH], [frontBot[0], frontBot[1] + slabH]],
    colors.slabRight,
    colors.outline,
    1.4,
  );

  // Main interior walls
  fillPoly(ctx, [apex, leftTop, leftBot, midCorner], colors.wallLeft, colors.outline, 1.5);
  fillPoly(ctx, [apex, rightTop, rightBot, midCorner], colors.wallRight, colors.outline, 1.5);

  // Optional crown molding along top of interior walls
  if (colors.crown) {
    fillPoly(
      ctx,
      [apex, leftTop, [leftTop[0], leftTop[1] + 5], [apex[0], apex[1] + 5]],
      colors.crown,
      'rgba(0,0,0,0.2)',
      0.8,
    );
    fillPoly(
      ctx,
      [apex, rightTop, [rightTop[0], rightTop[1] + 5], [apex[0], apex[1] + 5]],
      colors.crown,
      'rgba(0,0,0,0.2)',
      0.8,
    );
  }

  // Main floor diamond
  fillPoly(ctx, [midCorner, rightBot, frontBot, leftBot], colors.floorBase, colors.outline, 1.5);

  // Subtle ambient occlusion along inner corner seam & wall-floor joint
  ctx.fillStyle = 'rgba(12, 8, 22, 0.14)';
  ctx.fillRect(apex[0] - 2, apex[1] + 2, 4, midCorner[1] - apex[1] - 2);
}

export function drawPottedPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  potColor = '#d4744a',
  leafColor = '#4db362',
  trailing = false,
): void {
  const px = Math.round(x);
  const py = Math.round(y);
  // Pot with rim & outline
  ctx.fillStyle = '#120f17';
  ctx.fillRect(px - 6, py - 2, 12, 10);
  ctx.fillStyle = potColor;
  ctx.fillRect(px - 5, py, 10, 7);
  ctx.fillStyle = '#f0a684';
  ctx.fillRect(px - 5, py - 1, 10, 2);
  // Lush layered foliage
  ctx.fillStyle = '#245e34';
  ctx.fillRect(px - 7, py - 8, 14, 7);
  ctx.fillStyle = leafColor;
  ctx.fillRect(px - 6, py - 9, 12, 6);
  ctx.fillRect(px - 3, py - 12, 6, 4);
  ctx.fillStyle = '#8ee089';
  ctx.fillRect(px - 4, py - 9, 3, 2);
  ctx.fillRect(px + 1, py - 11, 2, 2);
  if (trailing) {
    ctx.fillStyle = leafColor;
    ctx.fillRect(px + 5, py - 3, 3, 5);
    ctx.fillRect(px + 6, py + 2, 3, 5);
    ctx.fillRect(px - 7, py - 2, 3, 4);
  }
}

export function drawTinyPriceTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  highlight = false,
  kind: 'text' | 'coin' | 'owned' = 'text',
): void {
  ctx.font = '6px "Press Start 2P", monospace';
  const extraIconW = kind === 'coin' ? 8 : 0;
  const label = text;
  const tw = Math.max(22, Math.ceil(ctx.measureText(label).width) + 7 + extraIconW);
  const bx = Math.round(x - tw / 2);
  const by = Math.round(y);

  ctx.fillStyle = '#09090d';
  ctx.fillRect(bx - 1, by - 1, tw + 2, 12);
  ctx.fillStyle = highlight ? '#fff4b8' : '#f4efe6';
  ctx.fillRect(bx, by, tw, 10);

  if (kind === 'coin') {
    // Hand-drawn crisp 5x5 pixel gold coin
    const cx = bx + 4;
    const cy = by + 2;
    ctx.fillStyle = '#09090d';
    ctx.fillRect(cx - 1, cy, 6, 5);
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(cx, cy + 1, 4, 3);
    ctx.fillStyle = '#fff5b8';
    ctx.fillRect(cx, cy + 1, 2, 1);

    ctx.fillStyle = '#7a2b34';
    ctx.textAlign = 'left';
    ctx.fillText(label, bx + 11, by + 8);
  } else {
    ctx.fillStyle = kind === 'owned' ? '#237846' : '#7a2b34';
    ctx.textAlign = 'center';
    ctx.fillText(label, Math.round(x), by + 8);
  }
}

export function drawPixelFoodSprite(
  ctx: CanvasRenderingContext2D,
  id: FoodId | MiniGameItemType,
  x: number,
  y: number,
  scale = 1,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (scale !== 1) ctx.scale(scale, scale);

  if (id === 'fish') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-9, -5, 18, 10);
    ctx.fillStyle = '#6ec8f5';
    ctx.fillRect(-7, -3, 11, 6);
    ctx.fillStyle = '#9be0ff';
    ctx.fillRect(-5, -2, 7, 2);
    ctx.fillStyle = '#48a3d4';
    ctx.fillRect(4, -4, 4, 8);
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-5, -1, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -1, 1, 1);
  } else if (id === 'milk') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-6, -9, 12, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -6, 10, 14);
    ctx.fillStyle = '#75ccf5';
    ctx.fillRect(-5, -8, 10, 3);
    ctx.fillRect(-5, -1, 10, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, 0, 4, 3);
  } else if (id === 'boba') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-7, -8, 14, 17);
    ctx.fillStyle = '#f5e4d0';
    ctx.fillRect(-6, -6, 12, 3);
    ctx.fillStyle = '#e5be91';
    ctx.fillRect(-6, -3, 12, 11);
    ctx.fillStyle = '#261a14';
    ctx.fillRect(-4, 4, 2, 2);
    ctx.fillRect(0, 5, 2, 2);
    ctx.fillRect(3, 4, 2, 2);
    ctx.fillRect(-2, 2, 2, 2);
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-2, -13, 4, 7);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(-1, -12, 2, 7);
  } else if (id === 'sushi') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -1, 14, 6);
    ctx.fillStyle = '#ff7b54';
    ctx.fillRect(-7, -5, 14, 5);
    ctx.fillStyle = '#ffb091';
    ctx.fillRect(-5, -4, 4, 1);
    ctx.fillRect(2, -3, 3, 1);
    ctx.fillStyle = '#1b2620';
    ctx.fillRect(-2, -5, 4, 10);
  } else if (id === 'cake') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-8, -6, 16, 13);
    ctx.fillStyle = '#ffe5b4';
    ctx.fillRect(-7, 0, 14, 6);
    ctx.fillStyle = '#ff85b3';
    ctx.fillRect(-7, -4, 14, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -1, 14, 2);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-2, -8, 5, 5);
    ctx.fillStyle = '#52b878';
    ctx.fillRect(-1, -9, 3, 2);
  } else if (id === 'star') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillRect(-7, -2, 14, 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = '#fff8c9';
    ctx.fillRect(-2, -2, 4, 4);
  } else if (id === 'heart') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = '#ff5e8e';
    ctx.fillRect(-6, -5, 5, 5);
    ctx.fillRect(1, -5, 5, 5);
    ctx.fillRect(-5, 0, 10, 3);
    ctx.fillRect(-3, 3, 6, 2);
    ctx.fillStyle = '#ffc2d6';
    ctx.fillRect(-4, -4, 2, 2);
  } else if (id === 'boot') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-7, -8, 14, 16);
    ctx.fillStyle = '#6b4c3b';
    ctx.fillRect(-5, -7, 6, 11);
    ctx.fillRect(-5, 1, 10, 5);
    ctx.fillStyle = '#4a3327';
    ctx.fillRect(-5, 4, 10, 2);
    ctx.fillStyle = '#8f6954';
    ctx.fillRect(-4, -5, 2, 6);
  }

  ctx.restore();
}

export function drawAccessoryIcon(
  ctx: CanvasRenderingContext2D,
  accId: AccessoryId,
  x: number,
  y: number,
  scale = 1,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (scale !== 1) ctx.scale(scale, scale);

  if (accId === 'bow') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-9, -6, 18, 11);
    ctx.fillStyle = '#ff77a8';
    ctx.fillRect(-8, -5, 6, 9);
    ctx.fillRect(2, -5, 6, 9);
    ctx.fillStyle = '#ffd1e3';
    ctx.fillRect(-2, -3, 4, 5);
  } else if (accId === 'shades') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-10, -4, 20, 8);
    ctx.fillStyle = '#1b2238';
    ctx.fillRect(-9, -3, 7, 6);
    ctx.fillRect(2, -3, 7, 6);
    ctx.fillStyle = '#8be9fd';
    ctx.fillRect(-8, -2, 3, 2);
    ctx.fillRect(3, -2, 3, 2);
  } else if (accId === 'daisy') {
    ctx.fillStyle = '#3b8c4e';
    ctx.fillRect(-9, 1, 18, 3);
    [-6, 0, 6].forEach((dx) => {
      ctx.fillStyle = '#09090d';
      ctx.fillRect(dx - 4, -5, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx - 3, -4, 6, 6);
      ctx.fillStyle = '#f5cf38';
      ctx.fillRect(dx - 1, -2, 2, 2);
    });
  } else if (accId === 'scarf') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-9, -4, 18, 7);
    ctx.fillRect(2, 2, 6, 8);
    ctx.fillStyle = '#e64553';
    ctx.fillRect(-8, -3, 16, 5);
    ctx.fillRect(3, 2, 4, 7);
    ctx.fillStyle = '#ff9aa4';
    ctx.fillRect(-5, -3, 3, 5);
    ctx.fillRect(3, 6, 4, 2);
  } else if (accId === 'frog') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-9, -4, 18, 9);
    ctx.fillRect(-8, -8, 6, 5);
    ctx.fillRect(2, -8, 6, 5);
    ctx.fillStyle = '#5ec269';
    ctx.fillRect(-8, -3, 16, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -7, 4, 4);
    ctx.fillRect(3, -7, 4, 4);
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-6, -6, 2, 2);
    ctx.fillRect(4, -6, 2, 2);
  } else if (accId === 'crown') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(-9, -7, 18, 12);
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(-8, -5, 3, 8);
    ctx.fillRect(-2, -6, 4, 9);
    ctx.fillRect(5, -5, 3, 8);
    ctx.fillRect(-8, 0, 16, 4);
    ctx.fillStyle = '#ff4d6d';
    ctx.fillRect(-1, 0, 2, 2);
  }

  ctx.restore();
}
