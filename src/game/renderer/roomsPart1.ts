import { GameState, H, W } from '../types';
import { getCatAnchor } from '../logic';
import { drawPixelCat } from './cat';
import {
  drawHoverRing,
  drawIsoBox,
  drawIsoRoomShell,
  drawIsoShadow,
  drawPixelFoodSprite,
  drawPottedPlant,
  drawRoundedRect,
  fillPoly,
  isoLerp,
} from './drawUtils';
import { getMeadowBackdrop, isFullBleedMeadowActive } from './meadow';

export const ISO_ROOM = {
  cx: 200,
  topY: 16,
  rw: 170,
  rh: 62,
  wallH: 138,
};

export function getIsoCorners() {
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  return {
    apex: [cx, topY] as [number, number],
    leftTop: [cx - rw, topY + rh] as [number, number],
    rightTop: [cx + rw, topY + rh] as [number, number],
    midCorner: [cx, topY + wallH] as [number, number],
    leftBot: [cx - rw, topY + rh + wallH] as [number, number],
    rightBot: [cx + rw, topY + rh + wallH] as [number, number],
    frontBot: [cx, topY + rh * 2 + wallH] as [number, number],
  };
}

export function drawRoomBackdrop(ctx: CanvasRenderingContext2D): void {
  if (isFullBleedMeadowActive()) return;
  ctx.drawImage(getMeadowBackdrop(), 0, 0);
  ctx.fillStyle = 'rgba(8, 22, 16, 0.56)';
  ctx.fillRect(0, 0, W, H);
}

// =============================================================================
// 1. BEDROOM — Cozy Pastel Sanctuary Diorama
// =============================================================================
export function drawBedroom(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  drawRoomBackdrop(ctx);
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  const corners = getIsoCorners();
  const { midCorner, leftBot, rightBot, frontBot } = corners;

  drawIsoRoomShell(ctx, corners, {
    wallLeft: '#d59ef2',
    wallRight: '#bf82e3',
    wallRimTop: '#f3defc',
    wallRimSide: '#784894',
    floorBase: '#e8a8c9',
    slabLeft: '#9e5d82',
    slabRight: '#784162',
    outline: '#160d1f',
    crown: '#f5e8fc',
  });

  // Soft pastel wallpaper stripes + tiny diamond motifs
  for (let i = 12; i < rw - 4; i += 16) {
    const yOff = Math.round((i / rw) * rh);
    ctx.fillStyle = '#e5befa';
    ctx.fillRect(cx - i, topY + yOff + 6, 5, wallH - 22);
    ctx.fillStyle = '#cf96ed';
    ctx.fillRect(cx + i - 4, topY + yOff + 6, 5, wallH - 22);
    // Tiny wallpaper stars between stripes
    ctx.fillStyle = 'rgba(255, 245, 210, 0.45)';
    ctx.fillRect(cx - i + 8, topY + yOff + 28, 2, 2);
    ctx.fillRect(cx + i + 3, topY + yOff + 42, 2, 2);
  }

  // Paneled cream wainscoting molding with rail highlight
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 18],
      [cx - rw, topY + rh + wallH - 18],
      leftBot,
      midCorner,
    ],
    '#f5e8fc',
    '#8c5ca6',
    1,
  );
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 18],
      [cx + rw, topY + rh + wallH - 18],
      rightBot,
      midCorner,
    ],
    '#e8d3f5',
    '#8c5ca6',
    1,
  );
  // Baseboard shadow strip
  ctx.strokeStyle = 'rgba(42, 18, 56, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftBot[0], leftBot[1]);
  ctx.lineTo(midCorner[0], midCorner[1]);
  ctx.lineTo(rightBot[0], rightBot[1]);
  ctx.stroke();

  // Staggered warm pink hardwood planks on floor
  ctx.strokeStyle = '#cf85ad';
  ctx.lineWidth = 1;
  for (let p = 1; p < 9; p++) {
    const t = p / 9;
    const pStart = isoLerp(midCorner, leftBot, rightBot, frontBot, t, 0);
    const pEnd = isoLerp(midCorner, leftBot, rightBot, frontBot, t, 1);
    ctx.beginPath();
    ctx.moveTo(pStart[0], pStart[1]);
    ctx.lineTo(pEnd[0], pEnd[1]);
    ctx.stroke();

    // Subtle plank end-seams
    const seamU = ((p * 37) % 70 + 15) / 100;
    const sA = isoLerp(midCorner, leftBot, rightBot, frontBot, t, seamU);
    const sB = isoLerp(midCorner, leftBot, rightBot, frontBot, t - 1 / 9, seamU);
    ctx.beginPath();
    ctx.moveTo(sA[0], sA[1]);
    ctx.lineTo(sB[0], sB[1]);
    ctx.stroke();
  }

  // Sunlit (day) or moonlit (night) diagonal window beam on floor!
  if (state.bedroom.curtainsOpen) {
    fillPoly(
      ctx,
      [
        [86, 178],
        [140, 158],
        [182, 188],
        [124, 212],
      ],
      state.bedroom.lampOn ? 'rgba(255, 248, 200, 0.24)' : 'rgba(155, 195, 255, 0.14)',
    );
  }

  // Cozy Layered Braided Rug with woven corner tassels
  drawIsoShadow(ctx, 162, 209, 55, 24, 0.14);
  fillPoly(
    ctx,
    [
      [162, 182],
      [216, 205],
      [162, 230],
      [108, 205],
    ],
    '#f7d6e6',
    '#b56a8e',
    1.5,
  );
  fillPoly(
    ctx,
    [
      [162, 188],
      [204, 205],
      [162, 223],
      [120, 205],
    ],
    '#ffe9b8',
    '#d99c62',
    1,
  );
  fillPoly(
    ctx,
    [
      [162, 195],
      [188, 205],
      [162, 216],
      [136, 205],
    ],
    '#fff5e0',
    '#e3b278',
    1,
  );
  // Little braided fringe nubs along left & right rug edges
  ctx.fillStyle = '#fff5e0';
  for (let f = 0; f < 4; f++) {
    const t = (f + 0.5) / 4;
    ctx.fillRect(Math.round(108 + (162 - 108) * t - 3), Math.round(205 + (230 - 205) * t + 1), 3, 2);
    ctx.fillRect(Math.round(216 - (216 - 162) * t + 1), Math.round(205 + (230 - 205) * t + 1), 3, 2);
  }

  // Draped Fairy Lights with glowing warm halos along upper walls
  ctx.strokeStyle = state.bedroom.lampOn ? '#7a518f' : '#2c1f3b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, topY + 12);
  ctx.quadraticCurveTo(cx - rw * 0.5, topY + rh * 0.5 + 24, cx - rw + 4, topY + rh + 14);
  ctx.moveTo(cx, topY + 12);
  ctx.quadraticCurveTo(cx + rw * 0.5, topY + rh * 0.5 + 24, cx + rw - 4, topY + rh + 14);
  ctx.stroke();

  const fairyColors = ['#fff29c', '#ffb3d9', '#a6f0ff', '#ffe082'];
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const lx = Math.round(cx - rw * t);
    const ly = Math.round(topY + rh * t + 13 + Math.sin(t * Math.PI) * 9);
    const rx = Math.round(cx + rw * t);
    const ry = Math.round(topY + rh * t + 13 + Math.sin(t * Math.PI) * 9);
    const glow = Math.sin(time * 3.5 + i) > -0.25;
    const col = fairyColors[i % fairyColors.length];
    ctx.fillStyle = state.bedroom.lampOn ? '#7a518f' : '#2c1f3b';
    ctx.fillRect(lx, ly - 2, 2, 2);
    ctx.fillRect(rx, ry - 2, 2, 2);
    if (glow) {
      ctx.fillStyle = 'rgba(255, 242, 160, 0.25)';
      ctx.fillRect(lx - 3, ly - 2, 8, 8);
      ctx.fillRect(rx - 3, ry - 2, 8, 8);
    }
    ctx.fillStyle = glow ? col : '#8a7a99';
    ctx.fillRect(lx - 1, ly, 4, 4);
    ctx.fillRect(rx - 1, ry, 4, 4);
  }

  // Clickable Cozy Window on Left Wall with brass rod, sill & tiny potted daisy
  const winPts: Array<[number, number]> = [
    [82, 82],
    [136, 62],
    [136, 120],
    [82, 140],
  ];
  // Outer recessed white window frame
  fillPoly(ctx, [[79, 80], [139, 58], [139, 123], [79, 145]], '#f7effa', '#4a2b5c', 1.5);
  fillPoly(ctx, winPts, state.bedroom.lampOn ? '#9be0ff' : '#181e42', '#3a2247', 1.5);

  if (state.bedroom.curtainsOpen) {
    if (!state.bedroom.lampOn) {
      // Crescent moon & twinkling stars
      ctx.fillStyle = '#fff29c';
      ctx.fillRect(114, 78, 9, 9);
      ctx.fillStyle = '#181e42';
      ctx.fillRect(117, 78, 6, 7);
      if (Math.sin(time * 4) > -0.2) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(94, 96, 2, 2);
      }
      if (Math.cos(time * 3.2) > -0.2) {
        ctx.fillStyle = '#fff29c';
        ctx.fillRect(122, 104, 2, 2);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(102, 114, 2, 2);
      if (state.bedroom.shootingStar > 0) {
        const p = 1 - state.bedroom.shootingStar;
        const sx = Math.round(128 - p * 34);
        const sy = Math.round(80 + p * 24);
        ctx.fillStyle = '#fff9c4';
        ctx.fillRect(sx, sy, 4, 2);
        ctx.fillRect(sx + 4, sy - 2, 4, 1);
      }
    } else {
      // Distant meadow treeline & drifting pixel cloud
      fillPoly(ctx, [[83, 128], [135, 109], [135, 119], [83, 138]], '#5cb870');
      const cOff = Math.round(Math.sin(time * 0.7) * 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(96 + cOff, 92, 18, 6);
      ctx.fillRect(100 + cOff, 87, 10, 5);
      ctx.fillStyle = '#fff49c';
      ctx.fillRect(120, 74, 8, 8);
    }
  } else {
    // Closed pleated curtains
    fillPoly(ctx, winPts, '#f5a8cb', '#6e3257', 1.5);
    ctx.fillStyle = '#e089b1';
    for (let x = 90; x < 132; x += 9) {
      ctx.fillRect(x, 76, 3, 52);
    }
  }

  // Window mullions
  ctx.strokeStyle = '#6c3e80';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(109, 72);
  ctx.lineTo(109, 130);
  ctx.moveTo(82, 111);
  ctx.lineTo(136, 91);
  ctx.stroke();

  // Brass curtain rod with finial balls
  ctx.strokeStyle = '#d4a24c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(75, 79);
  ctx.lineTo(143, 54);
  ctx.stroke();
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(73, 77, 4, 4);
  ctx.fillRect(142, 52, 4, 4);

  if (state.bedroom.curtainsOpen) {
    const sway = Math.sin(time * 2.2) * 1.1;
    fillPoly(
      ctx,
      [
        [79, 79],
        [93 + sway, 74],
        [88, 139],
        [79, 143],
      ],
      '#f5a8cb',
      '#6e3257',
      1,
    );
    fillPoly(
      ctx,
      [
        [125 - sway, 62],
        [139, 57],
        [139, 122],
        [130, 125],
      ],
      '#f5a8cb',
      '#6e3257',
      1,
    );
    // Gold tie-back ribbons
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(80, 116, 10, 3);
    ctx.fillRect(130, 99, 9, 3);
  }

  // Window sill ledge + miniature potted flower
  fillPoly(ctx, [[76, 142], [142, 118], [146, 122], [80, 147]], '#fff4fc', '#6b4580', 1);
  ctx.fillStyle = '#d4744a';
  ctx.fillRect(102, 124, 7, 6);
  ctx.fillStyle = '#52b878';
  ctx.fillRect(101, 120, 9, 4);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(104, 118, 3, 3);

  // Ticking Pendulum Wall Clock (left-back wall)
  const clkX = 168,
    clkY = 76;
  // Swinging brass pendulum below clock
  const pend = Math.round(Math.sin(time * 3.5) * 4);
  ctx.strokeStyle = '#d4a24c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(clkX, clkY + 9);
  ctx.lineTo(clkX + pend, clkY + 21);
  ctx.stroke();
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(clkX + pend - 2, clkY + 19, 5, 5);
  // Clock housing
  ctx.fillStyle = '#4a284f';
  ctx.fillRect(clkX - 10, clkY - 10, 20, 20);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(clkX - 9, clkY - 9, 18, 18);
  ctx.fillStyle = '#fffaf2';
  ctx.fillRect(clkX - 7, clkY - 7, 14, 14);
  ctx.fillStyle = '#4a284f';
  ctx.fillRect(clkX - 1, clkY - 5, 2, 6);
  const handX = Math.round(Math.cos(time * 0.8) * 4);
  const handY = Math.round(Math.sin(time * 0.8) * 4);
  ctx.fillRect(clkX + Math.min(0, handX), clkY + Math.min(0, handY), Math.max(2, Math.abs(handX)), 2);

  // Ornate Framed Cat Portrait on Right Wall
  fillPoly(ctx, [[220, 65], [256, 78], [256, 110], [220, 97]], '#d9a441', '#4d2b3f', 1.5);
  fillPoly(ctx, [[224, 69], [252, 79], [252, 105], [224, 95]], '#fff5e0', '#8f6030', 1);
  // Mini cat bust inside painting
  ctx.fillStyle = '#ffb3c6';
  ctx.fillRect(231, 80, 14, 13);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(233, 83, 10, 7);
  ctx.fillRect(233, 80, 3, 3);
  ctx.fillRect(240, 80, 3, 3);
  ctx.fillStyle = '#09090d';
  ctx.fillRect(235, 86, 2, 2);
  ctx.fillRect(239, 86, 2, 2);
  ctx.fillStyle = '#ff77a8';
  ctx.fillRect(234, 88, 2, 1);
  ctx.fillRect(240, 88, 2, 1);

  // Floating Book, Glowing Star Jar & Trailing Ivy Shelf on Right Wall
  fillPoly(ctx, [[270, 86], [332, 109], [332, 116], [270, 93]], '#8c4f6b', '#160d1f', 1.2);
  fillPoly(ctx, [[270, 83], [332, 106], [336, 104], [274, 81]], '#b36b8d', '#160d1f', 1);
  // Trailing succulent plant
  drawPottedPlant(ctx, 282, 83, '#d97852', '#5ec269', true);
  // Pastel leaning books
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(295, 79, 25, 19);
  ctx.fillStyle = '#75b8f0';
  ctx.fillRect(296, 80, 6, 15);
  ctx.fillStyle = '#fff5d6';
  ctx.fillRect(297, 83, 4, 2);
  ctx.fillStyle = '#ff85a2';
  ctx.fillRect(303, 83, 6, 14);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(310, 85, 6, 13);
  // Tiny glowing firefly star jar at end of shelf
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(321, 92, 9, 11);
  ctx.fillStyle = '#d4f3ff';
  ctx.fillRect(322, 94, 7, 8);
  ctx.fillStyle = '#b57b4a';
  ctx.fillRect(323, 92, 5, 2);
  ctx.fillStyle = Math.sin(time * 5) > 0 ? '#fff29c' : '#ffd43b';
  ctx.fillRect(324, 97, 3, 3);

  // True 3D Isometric Nightstand + Pleated Lamp + Wind-Up Music Box + Warm Milk Mug (Left)
  const lampX = 104,
    lampY = 184;
  drawIsoShadow(ctx, lampX, lampY + 26, 26, 12, 0.25);
  drawIsoBox(
    ctx,
    [lampX, lampY - 11],
    [lampX + 24, lampY - 1],
    [lampX, lampY + 10],
    [lampX - 24, lampY - 1],
    24,
    {
      top: '#a35d88',
      left: '#7d3e66',
      right: '#632e50',
      outline: '#160d1f',
      highlight: '#c783ad',
    },
  );
  // Recessed drawer faces + brass knobs on right-front face
  fillPoly(
    ctx,
    [
      [lampX + 3, lampY + 11],
      [lampX + 21, lampY + 3],
      [lampX + 21, lampY + 11],
      [lampX + 3, lampY + 19],
    ],
    '#753960',
    '#4a1f3b',
    1,
  );
  fillPoly(
    ctx,
    [
      [lampX + 3, lampY + 21],
      [lampX + 21, lampY + 13],
      [lampX + 21, lampY + 20],
      [lampX + 3, lampY + 28],
    ],
    '#753960',
    '#4a1f3b',
    1,
  );
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(lampX + 11, lampY + 10, 3, 3);
  ctx.fillRect(lampX + 11, lampY + 20, 3, 3);
  // Cream lace doily on nightstand top
  fillPoly(
    ctx,
    [
      [lampX, lampY - 8],
      [lampX + 14, lampY - 2],
      [lampX, lampY + 5],
      [lampX - 14, lampY - 2],
    ],
    '#fff5fc',
  );

  // Brass Bedside Lamp with pleated cream/gold shade & tassel pull-chain
  ctx.fillStyle = '#b88635';
  ctx.fillRect(lampX - 11, lampY - 4, 10, 4);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(lampX - 8, lampY - 22, 4, 19);
  fillPoly(
    ctx,
    [
      [lampX - 18, lampY - 19],
      [lampX - 13, lampY - 36],
      [lampX + 1, lampY - 36],
      [lampX + 6, lampY - 19],
    ],
    state.bedroom.lampOn ? '#fff2a6' : '#574e6b',
    '#160d1f',
    1.5,
  );
  // Pleat ribs on lampshade
  ctx.fillStyle = state.bedroom.lampOn ? '#f0d36e' : '#413952';
  ctx.fillRect(lampX - 10, lampY - 34, 1, 14);
  ctx.fillRect(lampX - 6, lampY - 35, 1, 15);
  ctx.fillRect(lampX - 2, lampY - 34, 1, 14);
  // Gold finial & pull-chain tassel
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(lampX - 7, lampY - 39, 3, 3);
  ctx.fillRect(lampX + 2, lampY - 19, 1, 7);
  ctx.fillRect(lampX + 1, lampY - 12, 3, 3);

  // Wind-up Music Box on nightstand (right corner)
  const mbX = lampX + 12,
    mbY = lampY - 6;
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(mbX - 7, mbY - 5, 14, 11);
  ctx.fillStyle = state.bedroom.musicBoxOn ? '#ff9ec0' : '#d98fb0';
  ctx.fillRect(mbX - 6, mbY - 4, 12, 9);
  ctx.fillStyle = '#ffd1e3';
  ctx.fillRect(mbX - 5, mbY - 3, 10, 2);
  // Tiny lid ornament & spinning brass key
  ctx.fillStyle = '#fff29c';
  ctx.fillRect(mbX - 2, mbY - 7, 4, 3);
  ctx.fillStyle = '#ffd43b';
  const keySpin = state.bedroom.musicBoxOn ? Math.round(Math.sin(time * 9) * 2) : 0;
  ctx.fillRect(mbX + 6, mbY - 2 + keySpin, 3, 4);

  // Cozy Floor Toy Basket & Stacked Bedtime Books (Front-Left)
  const bskX = 114,
    bskY = 236;
  drawIsoShadow(ctx, bskX, bskY + 6, 16, 7, 0.22);
  // Woven wicker basket
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(bskX - 12, bskY - 7, 24, 15);
  ctx.fillStyle = '#cf945b';
  ctx.fillRect(bskX - 11, bskY - 6, 22, 13);
  ctx.fillStyle = '#a8703e';
  ctx.fillRect(bskX - 11, bskY - 2, 22, 2);
  ctx.fillRect(bskX - 11, bskY + 2, 22, 2);
  // Plush mini fish & yarn peeking out of basket
  ctx.fillStyle = '#75ccf5';
  ctx.fillRect(bskX - 8, bskY - 10, 8, 5);
  ctx.fillStyle = '#ff77a8';
  ctx.fillRect(bskX + 1, bskY - 11, 7, 6);
  // Stacked bedtime books beside basket
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(bskX + 15, bskY - 1, 14, 9);
  ctx.fillStyle = '#75b8f0';
  ctx.fillRect(bskX + 16, bskY + 3, 12, 4);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(bskX + 17, bskY, 10, 3);

  // Cozy Plush Purple Bed with carved finial headboard, quilt seams & dual pillows!
  drawIsoShadow(ctx, 238, 214, 72, 28, 0.24);

  // Carved Wooden Headboard + rounded finial posts + star inlay
  fillPoly(ctx, [[236, 118], [308, 146], [308, 178], [236, 150]], '#5c2d45', '#160d1f', 1.5);
  // Finial posts on headboard corners
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(233, 110, 8, 14);
  ctx.fillRect(304, 138, 8, 14);
  ctx.fillStyle = '#7d3e5e';
  ctx.fillRect(234, 111, 6, 12);
  ctx.fillRect(305, 139, 6, 12);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(235, 112, 4, 3);
  ctx.fillRect(306, 140, 4, 3);
  // Carved panel inlays + little golden star emblem
  ctx.fillStyle = '#7d3e5e';
  ctx.fillRect(246, 130, 12, 12);
  ctx.fillRect(267, 138, 12, 12);
  ctx.fillRect(288, 146, 12, 12);
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(272, 142, 3, 3);

  // Mattress & Wooden Bed Frame
  fillPoly(ctx, [[236, 150], [308, 178], [242, 214], [170, 186]], '#f7ecfc', '#160d1f', 1.5);
  fillPoly(ctx, [[170, 186], [242, 214], [242, 234], [170, 206]], '#78348c', '#160d1f', 1.5);
  fillPoly(ctx, [[242, 214], [308, 178], [308, 198], [242, 234]], '#5e2470', '#160d1f', 1.5);
  // Wooden footboard legs
  ctx.fillStyle = '#471b54';
  ctx.fillRect(170, 204, 5, 6);
  ctx.fillRect(239, 231, 6, 7);
  ctx.fillRect(303, 196, 5, 6);

  // Two Layered Fluffy Pillows
  fillPoly(ctx, [[238, 150], [284, 168], [264, 180], [218, 162]], '#ffffff', '#472854', 1.5);
  fillPoly(ctx, [[242, 155], [276, 168], [262, 176], [228, 163]], '#f2e0fa');

  // Clickable Mini Plush Bunny nestled on the fluffy pillow (hops when clicked!)
  const bunY = Math.round(state.bedroom.bunnyBounce);
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(270, 154 - bunY, 12, 13);
  ctx.fillRect(271, 147 - bunY, 4, 8);
  ctx.fillRect(277, 147 - bunY, 4, 8);
  ctx.fillStyle = '#ffd1e3';
  ctx.fillRect(271, 155 - bunY, 10, 11);
  ctx.fillRect(272, 148 - bunY, 2, 7);
  ctx.fillRect(278, 148 - bunY, 2, 7);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(273, 150 - bunY, 1, 4);
  ctx.fillRect(279, 150 - bunY, 1, 4);
  ctx.fillStyle = '#160d1f';
  ctx.fillRect(273, 158 - bunY, 2, 2);
  ctx.fillRect(277, 158 - bunY, 2, 2);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(275, 160 - bunY, 2, 1);

  // Fluffy Kitty Slippers with tiny ears beside bed!
  const drawSlipper = (sx: number, sy: number) => {
    ctx.fillStyle = '#160d1f';
    ctx.fillRect(sx - 1, sy - 1, 12, 8);
    ctx.fillStyle = '#ff85b3';
    ctx.fillRect(sx, sy, 10, 6);
    ctx.fillStyle = '#ffd1e3';
    ctx.fillRect(sx + 1, sy - 2, 3, 2);
    ctx.fillRect(sx + 6, sy - 2, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 2, sy + 2, 5, 2);
  };
  drawSlipper(196, 224);
  drawSlipper(211, 229);

  // Draw Mochi (either tucked in bed OR standing/carried)
  const catAnchor = getCatAnchor(state);
  const isCarried = state.drag?.kind === 'cat';

  if (state.bedroom.sleeping && !isCarried) {
    drawPixelCat(ctx, 250, 176, 2.9, time, {
      fur: state.fur,
      accessory: state.accessory,
      expression: 'sleeping',
      blink: false,
      mouthOpen: 0,
      inBed: true,
    });
    // Pulled-up Patchwork Quilted Blanket over sleeping kitty!
    fillPoly(ctx, [[216, 166], [284, 192], [242, 214], [174, 188]], '#9a43b5', '#160d1f', 1.5);
    fillPoly(ctx, [[216, 166], [284, 192], [274, 197], [206, 171]], '#e8b5fa', '#160d1f', 1.2);
    // Quilt diamond stitching
    ctx.strokeStyle = 'rgba(255, 228, 255, 0.36)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 178);
    ctx.lineTo(256, 200);
    ctx.moveTo(222, 180);
    ctx.lineTo(202, 198);
    ctx.moveTo(246, 188);
    ctx.lineTo(224, 206);
    ctx.stroke();
  } else {
    // Folded quilted blanket at foot of bed
    fillPoly(ctx, [[204, 172], [272, 198], [242, 214], [174, 188]], '#9a43b5', '#160d1f', 1.5);
    fillPoly(ctx, [[204, 172], [272, 198], [264, 202], [196, 176]], '#e2a6f5', '#160d1f', 1);
    ctx.strokeStyle = 'rgba(255, 228, 255, 0.34)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(192, 184);
    ctx.lineTo(254, 207);
    ctx.stroke();

    drawPixelCat(ctx, catAnchor.x, catAnchor.y, catAnchor.scale, time, {
      fur: state.fur,
      accessory: state.accessory,
      expression: state.cat.expression,
      blink: state.cat.isBlinking,
      mouthOpen: state.cat.mouthOpen,
      hopY: isCarried ? 0 : state.cat.hopY,
      scaleX: state.cat.scaleX,
      scaleY: state.cat.scaleY,
      gazeX: state.cat.gazeX,
      gazeY: state.cat.gazeY,
      earTwitch: state.cat.earTwitch,
      carried: isCarried,
    });
  }

  if (isCarried) {
    drawHoverRing(ctx, 250, 182, 34, time, '#ffe066');
  }

  // Hover indicators
  if (state.hoveredTarget === 'bedroom:lamp') drawHoverRing(ctx, lampX - 6, lampY - 26, 18, time);
  if (state.hoveredTarget === 'bedroom:musicbox') drawHoverRing(ctx, mbX, mbY, 13, time, '#ff9ec0');
  if (state.hoveredTarget === 'bedroom:window') drawHoverRing(ctx, 109, 100, 26, time, '#9be0ff');
  if (state.hoveredTarget === 'bedroom:bunny') drawHoverRing(ctx, 278, 152, 13, time, '#ffd1e3');
  if (state.hoveredTarget === 'bedroom:bed') drawHoverRing(ctx, 246, 184, 30, time, '#e5befa');

  // Night-mode ambient overlay + warm lamp & star-jar glow
  if (!state.bedroom.lampOn) {
    ctx.fillStyle = 'rgba(14, 10, 42, 0.52)';
    ctx.fillRect(-160, -340, W + 320, H + 680);
    const grad = ctx.createRadialGradient(lampX - 6, lampY - 24, 5, lampX - 6, lampY - 24, 58);
    grad.addColorStop(0, 'rgba(255, 224, 130, 0.34)');
    grad.addColorStop(1, 'rgba(255, 224, 130, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(lampX - 64, lampY - 82, 120, 120);
    // Warm tiny star-jar glow on right wall
    ctx.fillStyle = 'rgba(255, 242, 156, 0.25)';
    ctx.fillRect(318, 90, 15, 15);
  }
}

// =============================================================================
// 2. BATHROOM — Spa Tile & Bubble Paradise Diorama
// =============================================================================
export function drawBathroom(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  drawRoomBackdrop(ctx);
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  const corners = getIsoCorners();
  const { midCorner, leftBot, rightBot, frontBot } = corners;

  drawIsoRoomShell(ctx, corners, {
    wallLeft: '#98ced9',
    wallRight: '#b0dfe8',
    wallRimTop: '#dff6fa',
    wallRimSide: '#4a7a85',
    floorBase: '#eef7f8',
    slabLeft: '#6a9aa6',
    slabRight: '#4f7a85',
    outline: '#121a21',
    crown: '#e1f4f7',
  });

  // Glossy ceramic tiled wainscot + teal mosaic accent border strip
  fillPoly(ctx, [[cx, topY + 62], [cx - rw, topY + rh + 62], leftBot, midCorner], '#dcecf0', '#587580', 1);
  fillPoly(ctx, [[cx, topY + 62], [cx + rw, topY + rh + 62], rightBot, midCorner], '#eaf4f7', '#587580', 1);
  // Teal mosaic trim strip
  fillPoly(
    ctx,
    [
      [cx, topY + 60],
      [cx - rw, topY + rh + 60],
      [cx - rw, topY + rh + 66],
      [cx, topY + 66],
    ],
    '#52a8b8',
    '#2f6c78',
    0.8,
  );
  fillPoly(
    ctx,
    [
      [cx, topY + 60],
      [cx + rw, topY + rh + 60],
      [cx + rw, topY + rh + 66],
      [cx, topY + 66],
    ],
    '#67bfd0',
    '#2f6c78',
    0.8,
  );

  // Subtle tile grout lines + specular highlights
  ctx.strokeStyle = 'rgba(85, 118, 130, 0.28)';
  ctx.lineWidth = 1;
  for (let i = 16; i < rw; i += 16) {
    const yOff = Math.round((i / rw) * rh);
    ctx.beginPath();
    ctx.moveTo(cx - i, topY + yOff + 66);
    ctx.lineTo(cx - i, topY + yOff + wallH);
    ctx.moveTo(cx + i, topY + yOff + 66);
    ctx.lineTo(cx + i, topY + yOff + wallH);
    ctx.stroke();
  }
  for (let row = 1; row <= 3; row++) {
    const dy = 66 + row * 18;
    ctx.beginPath();
    ctx.moveTo(cx - rw, topY + rh + dy);
    ctx.lineTo(cx, topY + dy);
    ctx.lineTo(cx + rw, topY + rh + dy);
    ctx.stroke();
  }

  // Checkered Mint & Cream Ceramic Floor Tiles
  const cells = 7;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r + c) % 2 === 0) {
        const p0 = isoLerp(midCorner, leftBot, rightBot, frontBot, r / cells, c / cells);
        const p1 = isoLerp(midCorner, leftBot, rightBot, frontBot, (r + 1) / cells, c / cells);
        const p2 = isoLerp(midCorner, leftBot, rightBot, frontBot, (r + 1) / cells, (c + 1) / cells);
        const p3 = isoLerp(midCorner, leftBot, rightBot, frontBot, r / cells, (c + 1) / cells);
        fillPoly(ctx, [p0, p1, p2, p3], '#d4ecf0');
      }
    }
  }

  // Round Brass Vanity Mirror on Left Wall + Warm Vanity Light Sconce
  const mirX = 86,
    mirY = 112;
  // Warm brass sconce light above mirror
  ctx.fillStyle = '#c4903d';
  ctx.fillRect(mirX - 5, mirY - 28, 10, 3);
  ctx.fillStyle = '#fff5b8';
  ctx.fillRect(mirX - 4, mirY - 25, 8, 5);
  ctx.fillStyle = 'rgba(255, 245, 184, 0.25)';
  ctx.fillRect(mirX - 8, mirY - 27, 16, 10);

  ctx.fillStyle = '#121a21';
  ctx.beginPath();
  ctx.arc(mirX, mirY, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4a24c';
  ctx.beginPath();
  ctx.arc(mirX, mirY, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c2f0ff';
  ctx.beginPath();
  ctx.arc(mirX, mirY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mirX - 7, mirY - 8, 4, 10);
  ctx.fillRect(mirX - 2, mirY - 4, 2, 6);
  if (state.bathroom.mirrorFog > 0.05) {
    ctx.fillStyle = `rgba(240, 248, 255, ${Math.min(0.84, state.bathroom.mirrorFog * 0.86)})`;
    ctx.beginPath();
    ctx.arc(mirX, mirY, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Porcelain Mini Vanity Sink tucked flush below Mirror + Toothbrush Cup
  drawIsoShadow(ctx, 86, 194, 16, 6, 0.22);
  // Pedestal base
  ctx.fillStyle = '#121a21';
  ctx.fillRect(78, 166, 16, 28);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(79, 167, 14, 26);
  ctx.fillStyle = '#d4e4eb';
  ctx.fillRect(87, 167, 6, 26);
  // Sink basin
  fillPoly(ctx, [[86, 150], [105, 158], [86, 168], [67, 158]], '#ffffff', '#121a21', 1.5);
  fillPoly(ctx, [[86, 154], [99, 159], [86, 164], [73, 159]], '#b8e8f5', '#7eaab8', 1);
  // Chrome faucet + toothbrush cup
  ctx.fillStyle = '#798b96';
  ctx.fillRect(84, 147, 4, 7);
  ctx.fillStyle = '#ff85b3';
  ctx.fillRect(71, 150, 6, 7);
  ctx.fillStyle = '#52d681';
  ctx.fillRect(73, 146, 2, 5);

  // Brass Towel Rail & Embroidered Waffle Pink Towel (Draggable!)
  ctx.fillStyle = '#121a21';
  ctx.fillRect(127, 99, 30, 5);
  ctx.fillStyle = '#d4a24c';
  ctx.fillRect(128, 100, 28, 3);
  if (state.drag?.kind !== 'towel') {
    const tx = state.bathroom.towelX;
    const ty = state.bathroom.towelY;
    ctx.fillStyle = '#121a21';
    ctx.fillRect(tx - 11, ty - 14, 22, 29);
    ctx.fillStyle = '#ff9ec0';
    ctx.fillRect(tx - 10, ty - 13, 20, 27);
    ctx.fillStyle = '#ffd1e3';
    ctx.fillRect(tx - 10, ty + 6, 20, 4);
    // Waffle texture & fringe
    ctx.fillStyle = '#e0729b';
    ctx.fillRect(tx - 6, ty - 10, 2, 14);
    ctx.fillRect(tx, ty - 10, 2, 14);
    ctx.fillRect(tx + 5, ty - 10, 2, 14);
    ctx.fillStyle = '#fff0f6';
    for (let fx = -9; fx <= 8; fx += 4) ctx.fillRect(tx + fx, ty + 14, 2, 2);
  }

  // Wall-mounted Wooden Corner Shampoo Ledge (Back-Left Wall above tub rim)
  fillPoly(ctx, [[144, 158], [182, 144], [182, 150], [144, 164]], '#b86f35', '#121a21', 1.2);
  fillPoly(ctx, [[144, 158], [182, 144], [187, 147], [149, 161]], '#d68f51', '#121a21', 1);

  // Clickable Pump Shampoo & Bubble Wash Bottles seated cleanly on the wooden ledge!
  ctx.fillStyle = '#121a21';
  ctx.fillRect(149, 139, 12, 19);
  ctx.fillRect(163, 133, 12, 22);
  // Pink shampoo bottle + pump nozzle
  ctx.fillStyle = '#ff5e7e';
  ctx.fillRect(150, 144, 10, 13);
  ctx.fillStyle = '#ffd1e3';
  ctx.fillRect(152, 148, 6, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(153, 140, 4, 4);
  ctx.fillRect(154, 137, 6, 2);
  // Yellow bubble bath bottle
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(164, 139, 10, 15);
  ctx.fillStyle = '#fff5c2';
  ctx.fillRect(166, 143, 6, 4);
  ctx.fillStyle = '#52b878';
  ctx.fillRect(167, 134, 4, 5);
  // Ambient mini rising bubble above bottles
  const sbY = 128 - Math.round((time * 10) % 12);
  ctx.fillStyle = '#c2f0ff';
  ctx.fillRect(159, sbY, 3, 3);

  // Right Wall Wooden Spa Shelf with Trailing Fern, Folded Towels & Bath Bomb Jar
  fillPoly(ctx, [[292, 95], [348, 117], [348, 124], [292, 102]], '#b86f35', '#121a21', 1.2);
  fillPoly(ctx, [[292, 92], [348, 114], [352, 112], [296, 90]], '#d68f51', '#121a21', 1);
  drawPottedPlant(ctx, 304, 92, '#ffffff', '#47a85d', true);
  // Folded blue & cream spa towels
  ctx.fillStyle = '#121a21';
  ctx.fillRect(316, 95, 19, 14);
  ctx.fillStyle = '#4f91d6';
  ctx.fillRect(317, 102, 17, 6);
  ctx.fillStyle = '#75b8f0';
  ctx.fillRect(317, 98, 17, 4);
  ctx.fillStyle = '#fff5e6';
  ctx.fillRect(317, 96, 17, 2);
  // Pastel bath-bomb jar
  ctx.fillStyle = '#121a21';
  ctx.fillRect(337, 103, 9, 10);
  ctx.fillStyle = '#d9f6ff';
  ctx.fillRect(338, 104, 7, 8);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(339, 108, 3, 3);
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(342, 106, 2, 3);

  // Translucent Glass Shower Splash Screen framing back-right edge of the spa basin
  fillPoly(
    ctx,
    [
      [212, 98],
      [294, 130],
      [294, 192],
      [212, 160],
    ],
    'rgba(180, 238, 250, 0.25)',
    '#7fb8c7',
    1.2,
  );
  // Glass specular stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fillRect(230, 116, 4, 34);
  ctx.fillRect(238, 122, 2, 28);

  // Chrome Rain Showerhead, Curved Riser Pipe & Cross-Handle Valves (Centered directly over Mochi!)
  ctx.fillStyle = '#121a21';
  ctx.fillRect(274, 68, 7, 100);
  ctx.fillRect(216, 68, 65, 7);
  ctx.fillStyle = '#92a6b3';
  ctx.fillRect(275, 69, 5, 98);
  ctx.fillRect(217, 69, 63, 5);
  ctx.fillStyle = '#d4e2eb';
  ctx.fillRect(276, 70, 2, 96);
  ctx.fillRect(218, 70, 60, 2);
  // Wide overhead rain showerhead centered directly above Mochi (x = 212)
  ctx.fillStyle = '#121a21';
  ctx.fillRect(210, 74, 4, 6);
  fillPoly(ctx, [[198, 82], [212, 76], [226, 82], [212, 87]], '#d4e4ed', '#121a21', 1.5);
  fillPoly(ctx, [[201, 83], [212, 87], [223, 83], [212, 85]], '#8aa4b3');
  // Valve plate + hot/cold handles on right wall
  ctx.fillStyle = '#cfdbe3';
  ctx.fillRect(266, 136, 24, 18);
  ctx.strokeStyle = '#121a21';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(266, 136, 24, 18);
  ctx.fillStyle = state.bathroom.showerOn ? '#ff4d6d' : '#b8374e';
  ctx.fillRect(269, 142, 7, 7);
  ctx.fillStyle = state.bathroom.showerOn ? '#45b6fe' : '#3278a8';
  ctx.fillRect(280, 142, 7, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(271, 144, 2, 2);
  ctx.fillRect(282, 144, 2, 2);

  // Raised Porcelain Walk-In Spa Tub / Shower Basin (Center-Right, Clean Gap from Sink)
  drawIsoShadow(ctx, 212, 200, 86, 36, 0.16);
  fillPoly(ctx, [[212, 160], [296, 194], [212, 232], [128, 194]], '#ffffff', '#22313a', 1.5);
  fillPoly(ctx, [[128, 194], [212, 232], [212, 239], [128, 201]], '#ccdce3', '#22313a', 1.2);
  fillPoly(ctx, [[212, 232], [296, 194], [296, 201], [212, 239]], '#b2c8d1', '#22313a', 1.2);
  // Inner recessed tub floor (brighter aqua sheen when water is running!)
  fillPoly(
    ctx,
    [[212, 167], [282, 194], [212, 224], [142, 194]],
    state.bathroom.showerOn ? '#cdeefa' : '#e3f2f6',
    '#8eaab5',
    1,
  );
  // Chrome drain + water puddle ripples when shower runs
  ctx.fillStyle = '#6c7c85';
  ctx.fillRect(208, 204, 8, 4);
  if (state.bathroom.showerOn) {
    const rip = 12 + ((time * 24) % 18);
    ctx.strokeStyle = 'rgba(85, 190, 235, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(212, 206, rip, rip * 0.44, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Adorable Detailed Frog Bath Mat (Lower-Left Step-Out Floor Zone, Clear of Tub & Sink)
  drawIsoShadow(ctx, 136, 238, 34, 14, 0.16);
  fillPoly(ctx, [[126, 218], [172, 236], [148, 254], [102, 236]], '#6fc244', '#1d3b15', 1.5);
  fillPoly(ctx, [[128, 223], [163, 236], [147, 249], [112, 236]], '#95de68');
  ctx.fillStyle = '#1d3b15';
  ctx.fillRect(123, 214, 9, 8);
  ctx.fillRect(139, 219, 9, 8);
  ctx.fillStyle = '#6fc244';
  ctx.fillRect(124, 215, 7, 6);
  ctx.fillRect(140, 220, 7, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(125, 216, 5, 4);
  ctx.fillRect(141, 221, 5, 4);
  ctx.fillStyle = '#09090d';
  ctx.fillRect(127, 217, 2, 2);
  ctx.fillRect(143, 222, 2, 2);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(120, 226, 4, 2);
  ctx.fillRect(147, 233, 4, 2);
  // Tiny happy frog smile
  ctx.fillStyle = '#1d3b15';
  ctx.fillRect(133, 230, 6, 2);

  // Cozy Bamboo Spa Stool & Rolled Mint Towel (Front-Right Floor Accent)
  drawIsoShadow(ctx, 294, 232, 16, 7, 0.18);
  // Wooden stool legs
  ctx.fillStyle = '#85532c';
  ctx.fillRect(283, 220, 3, 11);
  ctx.fillRect(302, 220, 3, 11);
  ctx.fillRect(292, 224, 3, 10);
  // Stool top
  fillPoly(ctx, [[294, 212], [309, 218], [294, 225], [279, 218]], '#d6975c', '#121a21', 1.2);
  // Rolled mint spa towel + pink bath pouf on stool
  ctx.fillStyle = '#121a21';
  ctx.fillRect(285, 208, 15, 8);
  ctx.fillStyle = '#8be0c5';
  ctx.fillRect(286, 209, 13, 6);
  ctx.fillStyle = '#c4f5e5';
  ctx.fillRect(296, 210, 3, 4);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(297, 206, 6, 5);
  ctx.fillStyle = '#ffd1e3';
  ctx.fillRect(298, 207, 3, 2);

  // Pink Ceramic Soap Dish resting cleanly on Front-Left Rim Corner of the Tub + Yellow Sponge
  fillPoly(ctx, [[142, 189], [159, 196], [142, 204], [125, 196]], '#ffb3cc', '#7a354d', 1.2);
  if (state.drag?.kind !== 'sponge') {
    drawSpongeSprite(ctx, state.bathroom.spongeX, state.bathroom.spongeY);
  }

  // Draw Mochi centered cleanly inside the spa shower basin right under the showerhead!
  const catAnchor = getCatAnchor(state);
  drawPixelCat(ctx, catAnchor.x, catAnchor.y, catAnchor.scale, time, {
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
    soapBubbles: state.bathroom.soapBubbles,
    wetLevel: state.bathroom.wetLevel,
  });

  // Draggable & Squeakable Yellow Rubber Ducky splashing inside front-left tub corner!
  if (state.drag?.kind !== 'duck') {
    if (state.bathroom.showerOn || state.bathroom.duckHop > 0.5) {
      ctx.strokeStyle = 'rgba(105, 205, 245, 0.72)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(state.bathroom.duckX, state.bathroom.duckY + 6, 12, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawIsoShadow(ctx, state.bathroom.duckX, state.bathroom.duckY + 6, 9, 4, 0.22);
    drawDuckSprite(ctx, state.bathroom.duckX, state.bathroom.duckY - state.bathroom.duckHop);
  }

  // Cute Clickable Toy Sailboat floating inside front-right corner of the spa basin!
  const boatX = 252;
  const boatY = 196 - Math.round(state.bathroom.boatBob);
  if (state.bathroom.showerOn || state.bathroom.boatBob > 0.5) {
    ctx.strokeStyle = 'rgba(105, 205, 245, 0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(boatX, 202, 14, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawIsoShadow(ctx, boatX, 202, 12, 4.5, 0.2);
  ctx.fillStyle = '#121a21';
  ctx.fillRect(boatX - 11, boatY - 2, 22, 9);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(boatX - 10, boatY - 1, 20, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(boatX - 8, boatY + 2, 16, 2);
  // Mast & fluttering pastel sail
  ctx.fillStyle = '#7d4b2d';
  ctx.fillRect(boatX - 1, boatY - 14, 2, 13);
  fillPoly(
    ctx,
    [
      [boatX + 1, boatY - 14],
      [boatX + 10, boatY - 5],
      [boatX + 1, boatY - 4],
    ],
    '#fff5cc',
    '#121a21',
    1,
  );

  // Animated Pixel Shower Water Streams falling straight onto Mochi!
  if (state.bathroom.showerOn) {
    ctx.fillStyle = 'rgba(130, 224, 255, 0.82)';
    state.bathroom.waterDrops.forEach((d) => {
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 8);
    });
  }

  // Clickable Poppable Iridescent Floating Bubbles
  state.bathroom.floatingBubbles.forEach((b) => {
    const bx = Math.round(b.x);
    const by = Math.round(b.y);
    const r = Math.round(b.r);
    ctx.strokeStyle = '#a8ecff';
    ctx.fillStyle = 'rgba(210, 246, 255, 0.36)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - Math.floor(r * 0.45), by - Math.floor(r * 0.45), 2, 2);
  });

  // Hover highlights
  if (state.hoveredTarget === 'bathroom:sponge') drawHoverRing(ctx, state.bathroom.spongeX, state.bathroom.spongeY, 15, time);
  if (state.hoveredTarget === 'bathroom:towel') drawHoverRing(ctx, state.bathroom.towelX, state.bathroom.towelY, 18, time, '#ff9ec0');
  if (state.hoveredTarget === 'bathroom:shower') drawHoverRing(ctx, 212, 84, 22, time, '#7be0ff');
  if (state.hoveredTarget === 'bathroom:duck') drawHoverRing(ctx, state.bathroom.duckX, state.bathroom.duckY, 14, time);
  if (state.hoveredTarget === 'bathroom:boat') drawHoverRing(ctx, boatX, boatY - 4, 15, time, '#ff9ec0');
  if (state.hoveredTarget === 'bathroom:shampoo') drawHoverRing(ctx, 162, 146, 16, time, '#ff9ec0');
  if (state.hoveredTarget === 'bathroom:mirror') drawHoverRing(ctx, mirX, mirY, 21, time, '#ffffff');
}

export function drawSpongeSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const sx = Math.round(x - 11);
  const sy = Math.round(y - 7);
  ctx.fillStyle = '#09090d';
  ctx.fillRect(sx - 1, sy - 1, 24, 16);
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(sx, sy, 22, 14);
  ctx.fillStyle = '#5ec269';
  ctx.fillRect(sx, sy + 11, 22, 3);
  ctx.fillStyle = '#f0b429';
  ctx.fillRect(sx + 3, sy + 3, 3, 2);
  ctx.fillRect(sx + 13, sy + 2, 3, 3);
  ctx.fillRect(sx + 7, sy + 7, 4, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx + 17, sy - 3, 5, 5);
  ctx.fillRect(sx + 14, sy - 4, 3, 3);
}

export function drawDuckSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const dx = Math.round(x - 8);
  const dy = Math.round(y - 6);
  ctx.fillStyle = '#121821';
  ctx.fillRect(dx - 1, dy + 1, 17, 11);
  ctx.fillRect(dx + 6, dy - 5, 10, 8);
  ctx.fillStyle = '#ffe033';
  ctx.fillRect(dx, dy + 2, 15, 9);
  ctx.fillRect(dx + 7, dy - 4, 8, 7);
  // Little wing highlight
  ctx.fillStyle = '#f0b429';
  ctx.fillRect(dx + 3, dy + 5, 7, 3);
  ctx.fillStyle = '#f07422';
  ctx.fillRect(dx + 15, dy - 1, 4, 3);
  ctx.fillStyle = '#121821';
  ctx.fillRect(dx + 12, dy - 2, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(dx + 12, dy - 2, 1, 1);
}

// =============================================================================
// 3. PLAYROOM — Lively Retro Toy Haven Diorama
// =============================================================================
export function drawPlayroom(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  if (state.playroom.miniGame.active) {
    drawFishCatchMiniGame(ctx, state, time);
    return;
  }

  drawRoomBackdrop(ctx);
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  const corners = getIsoCorners();
  const { midCorner, leftBot, rightBot, frontBot } = corners;

  drawIsoRoomShell(ctx, corners, {
    wallLeft: '#f5e5bd',
    wallRight: '#e8d29f',
    wallRimTop: '#fff7e0',
    wallRimSide: '#9c7849',
    floorBase: '#cf9359',
    slabLeft: '#946134',
    slabRight: '#704723',
    outline: '#17110d',
    crown: '#fff4d6',
  });

  // Warm wood wainscot along bottom of playroom walls
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 22],
      [cx - rw, topY + rh + wallH - 22],
      leftBot,
      midCorner,
    ],
    '#e3b778',
    '#8f5f32',
    1,
  );
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 22],
      [cx + rw, topY + rh + wallH - 22],
      rightBot,
      midCorner,
    ],
    '#d4a464',
    '#8f5f32',
    1,
  );

  // Staggered warm hardwood floor planks
  ctx.strokeStyle = '#b57b45';
  ctx.lineWidth = 1;
  for (let p = 1; p < 9; p++) {
    const t = p / 9;
    const pStart = isoLerp(midCorner, leftBot, rightBot, frontBot, t, 0);
    const pEnd = isoLerp(midCorner, leftBot, rightBot, frontBot, t, 1);
    ctx.beginPath();
    ctx.moveTo(pStart[0], pStart[1]);
    ctx.lineTo(pEnd[0], pEnd[1]);
    ctx.stroke();
  }

  // Festive Pastel Bunting Flags strung on a cord across upper walls
  ctx.strokeStyle = '#6e4e3d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, topY + 12);
  ctx.quadraticCurveTo(cx - rw * 0.5, topY + rh * 0.5 + 18, cx - rw + 4, topY + rh + 12);
  ctx.moveTo(cx, topY + 12);
  ctx.quadraticCurveTo(cx + rw * 0.5, topY + rh * 0.5 + 18, cx + rw - 4, topY + rh + 12);
  ctx.stroke();

  const flagCols = ['#ff77a8', '#ffd166', '#75d6b8', '#87d8f7', '#d49af0'];
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.7) / 6.8;
    const sag = Math.sin(t * Math.PI) * 5;
    const lx = Math.round(cx - rw * t);
    const ly = Math.round(topY + rh * t + 12 + sag);
    const rx = Math.round(cx + rw * t);
    const ry = Math.round(topY + rh * t + 12 + sag);
    fillPoly(
      ctx,
      [
        [lx - 5, ly],
        [lx + 5, ly - 3],
        [lx, ly + 9],
      ],
      flagCols[i % flagCols.length],
      '#3a2a24',
    );
    fillPoly(
      ctx,
      [
        [rx - 5, ry - 3],
        [rx + 5, ry],
        [rx, ry + 9],
      ],
      flagCols[(i + 2) % flagCols.length],
      '#3a2a24',
    );
  }

  // Framed Fish Art Poster + Paw-Print Mini Frame (Left Wall)
  fillPoly(ctx, [[76, 94], [122, 76], [122, 122], [76, 140]], '#ffffff', '#2e221b', 2);
  fillPoly(ctx, [[80, 98], [118, 83], [118, 116], [80, 131]], '#87d8f7');
  drawPixelFoodSprite(ctx, 'fish', 99, 107, 0.92);

  // Multi-Tier Plush Cat Condo & Scratching Tree (Back-Left Corner!)
  drawIsoShadow(ctx, 166, 164, 24, 11, 0.22);
  // Lower plush cubby box (3D iso!)
  drawIsoBox(
    ctx,
    [166, 134],
    [188, 143],
    [166, 152],
    [144, 143],
    20,
    {
      top: '#f7c6d6',
      left: '#de9ab1',
      right: '#c27b94',
      outline: '#17110d',
    },
  );
  // Cozy dark cubby entrance hole on right face
  fillPoly(ctx, [[170, 154], [182, 149], [182, 162], [170, 167]], '#3a1e2e', '#17110d', 1);
  // Sisal-wrapped scratching post rising to top perch
  ctx.fillStyle = '#17110d';
  ctx.fillRect(160, 102, 11, 38);
  ctx.fillStyle = '#e0be8d';
  ctx.fillRect(161, 103, 9, 36);
  ctx.fillStyle = '#bf9660';
  for (let sy = 107; sy < 138; sy += 4) ctx.fillRect(161, sy, 9, 1);
  // Top plush viewing perch + dangling pom-pom toy
  fillPoly(ctx, [[165, 93], [185, 101], [165, 109], [145, 101]], '#ff9ec0', '#17110d', 1.4);
  fillPoly(ctx, [[165, 96], [179, 101], [165, 106], [151, 101]], '#ffd6e6');
  const pomSwing = Math.round(Math.sin(time * 3.2) * 3);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 104);
  ctx.lineTo(180 + pomSwing, 118);
  ctx.stroke();
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(178 + pomSwing, 117, 5, 5);

  // Detailed Toy Bookshelf with Books, Alphabet Blocks & Stuffed Bear (Back-Right)
  drawIsoShadow(ctx, 245, 148, 28, 12, 0.22);
  fillPoly(ctx, [[220, 78], [272, 98], [272, 150], [220, 130]], '#945834', '#17110d', 1.5);
  fillPoly(ctx, [[220, 78], [272, 98], [278, 95], [226, 75]], '#b57348', '#17110d', 1.2);
  // Recessed dark shelf alcoves
  fillPoly(ctx, [[224, 86], [268, 103], [268, 119], [224, 102]], '#5e351e');
  fillPoly(ctx, [[224, 108], [268, 125], [268, 142], [224, 125]], '#5e351e');
  // Row 1: colorful books + mini potted plant
  ctx.fillStyle = '#e86f8c';
  ctx.fillRect(228, 89, 6, 13);
  ctx.fillStyle = '#5ec269';
  ctx.fillRect(235, 92, 6, 13);
  ctx.fillStyle = '#5eb6e6';
  ctx.fillRect(242, 95, 6, 13);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(249, 98, 6, 12);
  // Row 2: Wooden A/B toy blocks + tiny teddy bear
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(229, 116, 10, 10);
  ctx.fillStyle = '#a85a2a';
  ctx.fillRect(233, 119, 2, 4);
  ctx.fillStyle = '#ff77a8';
  ctx.fillRect(241, 121, 10, 10);
  // Mini plush bear
  ctx.fillStyle = '#c48652';
  ctx.fillRect(256, 123, 8, 10);
  ctx.fillRect(255, 121, 3, 3);
  ctx.fillRect(262, 121, 3, 3);
  ctx.fillStyle = '#f2cfa4';
  ctx.fillRect(258, 127, 4, 3);

  // Layered Starburst Pastel Play Rug with tassels
  drawIsoShadow(ctx, 200, 210, 88, 37, 0.14);
  fillPoly(ctx, [[200, 170], [288, 208], [200, 246], [112, 208]], '#e86f8c', '#7a253d', 1.5);
  fillPoly(ctx, [[200, 178], [268, 208], [200, 238], [132, 208]], '#ffd166', '#b88328', 1);
  fillPoly(ctx, [[200, 187], [246, 208], [200, 229], [154, 208]], '#fff3d6');
  // Rug center paw motif
  ctx.fillStyle = '#f5c2a6';
  ctx.fillRect(197, 206, 6, 5);
  ctx.fillRect(195, 203, 2, 2);
  ctx.fillRect(199, 202, 2, 2);
  ctx.fillRect(203, 203, 2, 2);

  // Upgraded 3D Isometric "FISH CATCH" Arcade Cabinet (Right side!)
  const arcX = 288,
    arcY = 122;
  drawIsoShadow(ctx, arcX + 26, arcY + 86, 30, 12, 0.28);
  // 3D Isometric Side Panel (right side of cabinet)
  fillPoly(
    ctx,
    [
      [arcX + 46, arcY],
      [arcX + 58, arcY - 6],
      [arcX + 58, arcY + 76],
      [arcX + 46, arcY + 84],
    ],
    '#273059',
    '#09090d',
    1.5,
  );
  // Side cabinet racing stripe decal
  fillPoly(
    ctx,
    [
      [arcX + 48, arcY + 24],
      [arcX + 56, arcY + 20],
      [arcX + 56, arcY + 34],
      [arcX + 48, arcY + 38],
    ],
    '#ff77a8',
  );
  // Top cap
  fillPoly(
    ctx,
    [
      [arcX, arcY],
      [arcX + 12, arcY - 6],
      [arcX + 58, arcY - 6],
      [arcX + 46, arcY],
    ],
    '#4f5fa3',
    '#09090d',
    1.5,
  );
  // Main front body
  ctx.fillStyle = '#09090d';
  ctx.fillRect(arcX - 2, arcY - 2, 50, 88);
  ctx.fillStyle = '#384478';
  ctx.fillRect(arcX, arcY, 46, 84);
  // Glowing marquee with chase LEDs
  ctx.fillStyle = '#586bb5';
  ctx.fillRect(arcX + 2, arcY + 2, 42, 14);
  for (let led = 0; led < 5; led++) {
    const lit = Math.floor(time * 6 + led) % 2 === 0;
    ctx.fillStyle = lit ? '#fff29c' : '#ff77a8';
    ctx.fillRect(arcX + 4 + led * 9, arcY + 3, 2, 2);
  }
  ctx.fillStyle = '#ffe066';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FISH!', arcX + 23, arcY + 13);
  // Curved CRT bezel + animated ocean wave & jumping fish
  ctx.fillStyle = '#13243b';
  ctx.fillRect(arcX + 5, arcY + 18, 36, 26);
  ctx.fillStyle = '#5ebfe0';
  ctx.fillRect(arcX + 7, arcY + 20, 32, 22);
  ctx.fillStyle = '#388db8';
  ctx.fillRect(arcX + 7, arcY + 34, 32, 8);
  const miniFishY = arcY + 28 + Math.round(Math.sin(time * 5) * 3);
  drawPixelFoodSprite(ctx, 'fish', arcX + 23, miniFishY, 0.65);
  // Angled Control Deck + Red Ball-Top Joystick + Buttons
  ctx.fillStyle = '#252d52';
  ctx.fillRect(arcX + 2, arcY + 46, 42, 13);
  ctx.fillStyle = '#d4dde6';
  ctx.fillRect(arcX + 11, arcY + 48, 2, 6);
  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(arcX + 9, arcY + 44, 6, 5);
  ctx.fillStyle = '#52d681';
  ctx.fillRect(arcX + 27, arcY + 50, 5, 4);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(arcX + 34, arcY + 50, 5, 4);
  // Coin door with glowing insert-coin slot
  ctx.fillStyle = '#1b2240';
  ctx.fillRect(arcX + 13, arcY + 63, 20, 15);
  ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ff6b6b' : '#b83232';
  ctx.fillRect(arcX + 17, arcY + 67, 5, 6);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(arcX + 25, arcY + 69, 4, 3);

  // Mini Pastel Amp Speaker connected to Vintage Studio Mic!
  const mx = 114,
    my = 192;
  const ampPulse = state.playroom.recording || state.playroom.mimicking ? Math.round(Math.sin(time * 28)) : 0;
  // Amp box behind mic base
  ctx.fillStyle = '#17110d';
  ctx.fillRect(mx - 26, my - 10, 18, 22);
  ctx.fillStyle = '#75d6b8';
  ctx.fillRect(mx - 25, my - 9, 16, 20);
  ctx.fillStyle = '#2b3242';
  ctx.fillRect(mx - 23, my - 5, 12, 12);
  ctx.fillStyle = '#4c576e';
  ctx.fillRect(mx - 20 - ampPulse * 0.5, my - 2 - ampPulse * 0.5, 6 + ampPulse, 6 + ampPulse);
  // Coiled mic cable
  ctx.strokeStyle = '#1f2433';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - 8, my + 8);
  ctx.quadraticCurveTo(mx - 14, my + 16, mx - 18, my + 11);
  ctx.stroke();

  // Vintage Studio Microphone Stand
  drawIsoShadow(ctx, mx, my + 11, 14, 5, 0.24);
  ctx.fillStyle = '#1f2433';
  ctx.fillRect(mx - 12, my + 8, 24, 5);
  ctx.fillRect(mx - 2, my - 34, 4, 44);
  const micGlow = state.playroom.recording
    ? '#ff5468'
    : state.playroom.mimicking
      ? '#52e0c4'
      : '#cfd8e3';
  ctx.fillStyle = '#111521';
  ctx.fillRect(mx - 8, my - 48, 16, 17);
  ctx.fillStyle = micGlow;
  ctx.fillRect(mx - 6, my - 46, 12, 13);
  ctx.fillStyle = '#4c576e';
  ctx.fillRect(mx - 6, my - 42, 12, 2);
  ctx.fillRect(mx - 6, my - 37, 12, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx - 5, my - 45, 2, 3);

  // Live Pixel Volume EQ next to Mic
  if (state.playroom.recording || state.playroom.mimicking) {
    const lvl = state.playroom.recording ? state.playroom.micLevel : state.playroom.audioAmp;
    for (let i = 0; i < 6; i++) {
      const active = lvl > (i / 6) * 0.8;
      ctx.fillStyle = active
        ? state.playroom.recording
          ? '#ff5468'
          : '#52e0c4'
        : 'rgba(20,25,40,0.5)';
      ctx.fillRect(mx - 23, my - 18 - i * 6, 9, 4);
    }
  }

  // Clickable Cat Toy Bell with subtle floating musical note
  const hx = 142,
    hy = 216 - Math.round(state.playroom.hornBounce);
  drawIsoShadow(ctx, hx, 222, 10, 4, 0.22);
  ctx.fillStyle = '#09090d';
  ctx.fillRect(hx - 9, hy - 5, 18, 11);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(hx - 8, hy - 4, 16, 9);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(hx - 3, hy - 8, 6, 4);
  ctx.fillStyle = '#fff5cc';
  ctx.fillRect(hx - 6, hy - 2, 5, 3);
  const noteBob = Math.round(Math.sin(time * 4) * 2);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(hx + 7, hy - 14 + noteBob, 2, 5);
  ctx.fillRect(hx + 5, hy - 10 + noteBob, 3, 2);
  ctx.fillRect(hx + 7, hy - 14 + noteBob, 4, 2);

  // Striped Ceramic Toy Crock holding Feather Wand (Left)
  const wHomeX = state.playroom.wand.homeX;
  const wHomeY = state.playroom.wand.homeY;
  drawIsoShadow(ctx, wHomeX - 6, wHomeY + 14, 11, 5, 0.22);
  ctx.fillStyle = '#17110d';
  ctx.fillRect(wHomeX - 15, wHomeY + 2, 16, 15);
  ctx.fillStyle = '#fff5e0';
  ctx.fillRect(wHomeX - 14, wHomeY + 3, 14, 13);
  ctx.fillStyle = '#75b8f0';
  ctx.fillRect(wHomeX - 14, wHomeY + 6, 14, 3);
  ctx.fillRect(wHomeX - 14, wHomeY + 12, 14, 2);
  if (state.drag?.kind !== 'wand') {
    drawFeatherWand(ctx, wHomeX, wHomeY, time);
  }

  // Draw Mochi on playroom rug
  const catAnchor = getCatAnchor(state);
  const isCarried = state.drag?.kind === 'cat';
  drawPixelCat(ctx, catAnchor.x, catAnchor.y, catAnchor.scale, time, {
    fur: state.fur,
    accessory: state.accessory,
    expression: state.cat.expression,
    blink: state.cat.isBlinking,
    mouthOpen: state.cat.mouthOpen,
    hopY: isCarried ? 0 : state.cat.hopY,
    scaleX: state.cat.scaleX,
    scaleY: state.cat.scaleY,
    gazeX: state.cat.gazeX,
    gazeY: state.cat.gazeY,
    earTwitch: state.cat.earTwitch,
    carried: isCarried,
  });

  // New Interactive Wind-Up Clockwork Toy Mouse on floor!
  drawToyMouse(
    ctx,
    state.playroom.mouse.x,
    state.playroom.mouse.y,
    state.playroom.mouse.dir,
    state.playroom.mouse.active,
    time,
  );

  // Bouncy Flingable Multi-Strand Pink Yarn Ball
  if (state.drag?.kind !== 'yarn') {
    drawIsoShadow(ctx, state.playroom.yarn.x, Math.min(238, state.playroom.yarn.y + 8), 10, 4, 0.22);
    drawYarnBall(ctx, state.playroom.yarn.x, state.playroom.yarn.y, state.playroom.yarn.rot);
  }

  // Hover indicators
  if (state.hoveredTarget === 'playroom:mic') drawHoverRing(ctx, mx, my - 38, 17, time, '#ff6b8b');
  if (state.hoveredTarget === 'playroom:horn') drawHoverRing(ctx, hx, hy, 13, time, '#ffd166');
  if (state.hoveredTarget === 'playroom:mouse') drawHoverRing(ctx, state.playroom.mouse.x, state.playroom.mouse.y, 14, time, '#ffd43b');
  if (state.hoveredTarget === 'playroom:yarn') drawHoverRing(ctx, state.playroom.yarn.x, state.playroom.yarn.y, 14, time, '#ff85b3');
  if (state.hoveredTarget === 'playroom:wand') drawHoverRing(ctx, wHomeX, wHomeY - 10, 15, time, '#7be0ff');
  if (state.hoveredTarget === 'playroom:arcade') drawHoverRing(ctx, arcX + 23, arcY + 34, 28, time, '#75f0a8');
}

export function drawToyMouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1,
  active: boolean,
  time: number,
): void {
  const mx = Math.round(x);
  const my = Math.round(y);
  drawIsoShadow(ctx, mx, my + 5, 11, 4, 0.22);
  ctx.save();
  ctx.translate(mx, my);
  ctx.scale(dir, 1);

  // Pink wagging tail
  const tailWig = active ? Math.round(Math.sin(time * 22) * 2) : 0;
  ctx.strokeStyle = '#ff85b3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 1);
  ctx.quadraticCurveTo(-13, -2 + tailWig, -16, 2);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#17110d';
  ctx.fillRect(-9, -4, 18, 10);
  ctx.fillStyle = '#aeb6c4';
  ctx.fillRect(-8, -3, 16, 8);
  ctx.fillStyle = '#d3dbe8';
  ctx.fillRect(-5, -2, 9, 3);
  // Cute round ear & pink nose
  ctx.fillStyle = '#17110d';
  ctx.fillRect(1, -7, 5, 4);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(2, -6, 3, 2);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(8, 0, 2, 2);
  ctx.fillStyle = '#17110d';
  ctx.fillRect(4, -1, 2, 2);

  // Spinning brass clockwork key on top!
  const keyW = active ? Math.max(2, Math.round(Math.abs(Math.sin(time * 16)) * 6)) : 5;
  ctx.fillStyle = '#d4a24c';
  ctx.fillRect(-3, -7, 2, 4);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(-2 - Math.floor(keyW / 2), -10, keyW, 3);

  ctx.restore();
}

export function drawYarnBall(ctx: CanvasRenderingContext2D, x: number, y: number, rot = 0): void {
  const yx = Math.round(x),
    yy = Math.round(y);
  ctx.strokeStyle = '#ff6b9d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(yx, yy + 6);
  ctx.quadraticCurveTo(yx + 15, yy + 14 + Math.sin(rot) * 3, yx + 24, yy + 8);
  ctx.stroke();

  ctx.fillStyle = '#09090d';
  ctx.fillRect(yx - 9, yy - 9, 18, 18);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(yx - 7, yy - 7, 14, 14);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(yx - 5 + Math.round(Math.sin(rot) * 1.5), yy - 5, 7, 3);
  ctx.fillRect(yx - 6, yy - 1, 5, 2);
  ctx.fillStyle = '#c43b6b';
  ctx.fillRect(yx - 5, yy + 2, 9, 2);
  ctx.fillRect(yx + 2, yy - 4, 2, 7);
}

export function drawFeatherWand(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const wx = Math.round(x),
    wy = Math.round(y);
  const flutter = Math.round(Math.sin(time * 10) * 2);
  ctx.strokeStyle = '#7d4b2d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx - 8, wy + 8);
  ctx.lineTo(wx + 3, wy - 16);
  ctx.stroke();
  // String & dangling colorful feathers
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wx + 3, wy - 16);
  ctx.lineTo(wx + 7 + flutter, wy - 3);
  ctx.stroke();
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(wx + 4 + flutter, wy - 5, 7, 4);
  ctx.fillStyle = '#7be0ff';
  ctx.fillRect(wx + 6 + flutter, wy - 1, 6, 4);
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(wx + 3 + flutter, wy - 3, 3, 3);
}

// =============================================================================
// 4. FISH CATCH MINI-GAME
// =============================================================================
export const MG_PLAY_AGAIN_RECT = { x: 88, y: 178, w: 112, h: 26 };
export const MG_EXIT_RECT = { x: 212, y: 178, w: 100, h: 26 };
export const MG_TOP_EXIT_RECT = { x: 344, y: 12, w: 44, h: 20 };

export function drawFishCatchMiniGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
): void {
  const mg = state.playroom.miniGame;

  // Bright layered meadow sky (seamlessly extends on portrait screens)
  ctx.fillStyle = '#7bc8e8';
  ctx.fillRect(-160, -340, W + 320, H + 360);
  ctx.fillStyle = '#a3dcf2';
  ctx.fillRect(-160, 146, W + 320, 100);

  // Rolling distant meadow hills
  ctx.fillStyle = '#4f9966';
  for (let x = 0; x < W; x += 4) {
    const hillH = Math.round(28 + Math.sin(x * 0.022) * 12 + Math.cos(x * 0.011) * 7);
    ctx.fillRect(x, 240 - hillH, 4, hillH);
  }
  ctx.fillStyle = '#3a7d52';
  for (let x = 0; x < W; x += 4) {
    const hillH = Math.round(16 + Math.cos(x * 0.03 + 1.2) * 7);
    ctx.fillRect(x, 240 - hillH, 4, hillH);
  }

  // Tiny pixel pine trees on horizon
  [38, 96, 152, 260, 314, 362].forEach((tx) => {
    ctx.fillStyle = '#25573a';
    ctx.fillRect(tx - 6, 212, 12, 8);
    ctx.fillRect(tx - 4, 206, 8, 7);
    ctx.fillRect(tx - 2, 202, 4, 5);
    ctx.fillStyle = '#5c3b24';
    ctx.fillRect(tx - 1, 220, 3, 5);
  });

  // Cozy Wooden Meadow Fence behind Mochi
  ctx.fillStyle = '#a67449';
  ctx.fillRect(0, 232, W, 3);
  ctx.fillRect(0, 237, W, 2);
  for (let fx = 10; fx < W; fx += 24) {
    ctx.fillStyle = '#855834';
    ctx.fillRect(fx, 226, 4, 16);
    ctx.fillStyle = '#c48f5e';
    ctx.fillRect(fx + 1, 226, 2, 14);
  }

  // Drifting pixel clouds
  ctx.fillStyle = '#ffffff';
  const c1 = ((time * 14) % (W + 70)) - 44;
  ctx.fillRect(Math.round(c1), 46, 40, 11);
  ctx.fillRect(Math.round(c1) + 9, 37, 22, 9);
  const c2 = ((time * 9 + 200) % (W + 70)) - 44;
  ctx.fillRect(Math.round(c2), 76, 48, 11);
  ctx.fillRect(Math.round(c2) + 12, 67, 24, 9);

  // Forest-green meadow foreground & colorful wildflowers (seamlessly fills below in portrait)
  ctx.fillStyle = '#2f6e4e';
  ctx.fillRect(-160, 240, W + 320, 14);
  ctx.fillStyle = '#1f4d36';
  ctx.fillRect(-160, 252, W + 320, 460);
  for (let gx = 12; gx < W; gx += 32) {
    ctx.fillStyle = '#73bd77';
    ctx.fillRect(gx, 246, 7, 3);
    ctx.fillRect(gx + 2, 244, 3, 2);
    if (gx % 64 === 12) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx + 16, 260, 5, 5);
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(gx + 18, 262, 1, 1);
    } else {
      ctx.fillStyle = '#ffd1e3';
      ctx.fillRect(gx + 18, 268, 4, 4);
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(gx + 19, 269, 2, 2);
    }
  }

  // Falling treats & boots
  mg.items.forEach((it) => {
    drawPixelFoodSprite(ctx, it.type, Math.round(it.x), Math.round(it.y), 1.05);
  });

  // Player's customized Mochi catching snacks
  drawPixelCat(ctx, mg.catX, 238, 2.7, time, {
    fur: state.fur,
    accessory: state.accessory,
    expression: state.cat.expression,
    blink: state.cat.isBlinking,
    mouthOpen: state.cat.mouthOpen,
    hopY: state.cat.hopY,
    scaleX: state.cat.scaleX,
    scaleY: state.cat.scaleY,
  });

  // Floating +10 / +25 / -10 score popups!
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  mg.popups.forEach((pop) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life / 0.4));
    ctx.fillStyle = '#09090d';
    ctx.fillText(pop.text, Math.round(pop.x) + 1, Math.round(pop.y) + 1);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
    ctx.globalAlpha = 1;
  });

  // Top arcade bar
  ctx.fillStyle = 'rgba(18, 24, 46, 0.9)';
  ctx.fillRect(10, 10, W - 20, 24);
  ctx.strokeStyle = '#090c17';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, W - 20, 24);

  ctx.font = '7.5px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE:${mg.score}`, 18, 26);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd43b';
  ctx.fillText(`TIME:${Math.ceil(mg.timeLeft)}s`, 188, 26);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillText(`BEST:${state.highScore}`, 290, 26);

  // In-canvas EXIT button
  ctx.fillStyle = state.hoveredTarget === 'mg:topexit' ? '#ff6b8b' : '#cf4c68';
  ctx.fillRect(MG_TOP_EXIT_RECT.x, MG_TOP_EXIT_RECT.y, MG_TOP_EXIT_RECT.w, MG_TOP_EXIT_RECT.h);
  ctx.strokeStyle = '#090c17';
  ctx.strokeRect(MG_TOP_EXIT_RECT.x, MG_TOP_EXIT_RECT.y, MG_TOP_EXIT_RECT.w, MG_TOP_EXIT_RECT.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = '6.5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', MG_TOP_EXIT_RECT.x + MG_TOP_EXIT_RECT.w / 2, MG_TOP_EXIT_RECT.y + 13);

  // Game Over Overlay
  if (mg.gameOver) {
    ctx.fillStyle = 'rgba(15, 22, 42, 0.94)';
    drawRoundedRect(ctx, 64, 72, 272, 152, 10);
    ctx.fill();
    ctx.strokeStyle = '#fff29c';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 64, 72, 272, 152, 10);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd43b';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('TIME UP!', W / 2, 106);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8.5px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${mg.score}   BEST: ${state.highScore}`, W / 2, 134);
    ctx.fillStyle = '#75f0a8';
    ctx.fillText(`+${mg.coinsEarned} COINS EARNED!`, W / 2, 158);

    ctx.fillStyle = state.hoveredTarget === 'mg:again' ? '#52cc7a' : '#38945b';
    drawRoundedRect(ctx, MG_PLAY_AGAIN_RECT.x, MG_PLAY_AGAIN_RECT.y, MG_PLAY_AGAIN_RECT.w, MG_PLAY_AGAIN_RECT.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#090c14';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('PLAY AGAIN', MG_PLAY_AGAIN_RECT.x + MG_PLAY_AGAIN_RECT.w / 2, MG_PLAY_AGAIN_RECT.y + 16);

    ctx.fillStyle = state.hoveredTarget === 'mg:exit' ? '#e87fa5' : '#cf5d88';
    drawRoundedRect(ctx, MG_EXIT_RECT.x, MG_EXIT_RECT.y, MG_EXIT_RECT.w, MG_EXIT_RECT.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#090c14';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PLAYROOM', MG_EXIT_RECT.x + MG_EXIT_RECT.w / 2, MG_EXIT_RECT.y + 16);
  }
}
