import {
  ACCESSORIES,
  FRIDGE_CAPACITY,
  FRIDGE_SLOTS,
  FUR_PALETTES,
  GameState,
  H,
  Particle,
  TABLE_SLOTS,
  W,
} from '../types';
import { getCatAnchor, getDraggedItemPoint } from '../logic';
import { drawPixelCat } from './cat';
import {
  drawAccessoryIcon,
  drawHoverRing,
  drawIsoBox,
  drawIsoRoomShell,
  drawIsoShadow,
  drawPixelFoodSprite,
  drawPottedPlant,
  drawRoundedRect,
  drawTinyPriceTag,
  fillPoly,
  isoLerp,
} from './drawUtils';
import {
  drawDuckSprite,
  drawFeatherWand,
  drawRoomBackdrop,
  drawSpongeSprite,
  drawYarnBall,
  getIsoCorners,
  ISO_ROOM,
} from './roomsPart1';

// =============================================================================
// 5. KITCHEN — Sunlit Café & Bakery Nook Diorama
// =============================================================================
export function drawKitchen(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  drawRoomBackdrop(ctx);
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  const corners = getIsoCorners();
  const { midCorner, leftBot, rightBot, frontBot } = corners;

  drawIsoRoomShell(ctx, corners, {
    wallLeft: '#f7e5a1',
    wallRight: '#ebd281',
    wallRimTop: '#fff7d6',
    wallRimSide: '#a37c40',
    floorBase: '#f7eedc',
    slabLeft: '#bd7c5b',
    slabRight: '#945b3e',
    outline: '#1a130d',
    crown: '#fff7dc',
  });

  // Sunny butter-yellow stripes on upper walls
  for (let i = 14; i < rw - 4; i += 18) {
    const yOff = Math.round((i / rw) * rh);
    ctx.fillStyle = '#fcf0be';
    ctx.fillRect(cx - i, topY + yOff + 6, 6, wallH - 12);
    ctx.fillStyle = '#f2dc96';
    ctx.fillRect(cx + i - 5, topY + yOff + 6, 6, wallH - 12);
  }

  // White Ceramic Subway Tile Backsplash along lower right wall (behind counter)
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 54],
      [cx + rw, topY + rh + wallH - 54],
      rightBot,
      midCorner,
    ],
    '#f7f9fa',
    '#b5a898',
    1,
  );
  ctx.strokeStyle = 'rgba(145, 132, 118, 0.28)';
  ctx.lineWidth = 1;
  for (let i = 16; i < rw; i += 16) {
    const yOff = Math.round((i / rw) * rh);
    ctx.beginPath();
    ctx.moveTo(cx + i, topY + yOff + wallH - 54);
    ctx.lineTo(cx + i, topY + yOff + wallH);
    ctx.stroke();
  }

  // Checkered Terracotta & Cream Isometric Floor
  const cells = 6;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r + c) % 2 === 0) {
        const p0 = isoLerp(midCorner, leftBot, rightBot, frontBot, r / cells, c / cells);
        const p1 = isoLerp(midCorner, leftBot, rightBot, frontBot, (r + 1) / cells, c / cells);
        const p2 = isoLerp(midCorner, leftBot, rightBot, frontBot, (r + 1) / cells, (c + 1) / cells);
        const p3 = isoLerp(midCorner, leftBot, rightBot, frontBot, r / cells, (c + 1) / cells);
        fillPoly(ctx, [p0, p1, p2, p3], '#e3947d');
      }
    }
  }

  // Warm Golden Sunbeam cast from right meadow window onto kitchen floor
  fillPoly(
    ctx,
    [
      [234, 156],
      [288, 178],
      [236, 212],
      [176, 188],
    ],
    'rgba(255, 246, 190, 0.22)',
  );

  // Hanging Copper Utensil Rack, Cutting Board & Spice Ledge (Left-Center Wall)
  ctx.fillStyle = '#1a130d';
  ctx.fillRect(138, 79, 52, 6);
  ctx.fillStyle = '#7a4528';
  ctx.fillRect(139, 80, 50, 4);
  // Copper skillet
  ctx.fillStyle = '#d47442';
  ctx.fillRect(145, 84, 3, 11);
  ctx.fillRect(141, 95, 11, 10);
  ctx.fillStyle = '#f5b082';
  ctx.fillRect(143, 97, 5, 4);
  // Metal ladle
  ctx.fillStyle = '#b4c2cc';
  ctx.fillRect(160, 84, 3, 15);
  ctx.fillRect(158, 99, 7, 5);
  // Hanging wooden cutting board
  ctx.fillStyle = '#1a130d';
  ctx.fillRect(172, 85, 12, 18);
  ctx.fillStyle = '#cf945b';
  ctx.fillRect(173, 86, 10, 16);
  ctx.fillStyle = '#a36e3b';
  ctx.fillRect(177, 87, 2, 2);

  // Sunny Meadow Window (Right Wall) with café valance, fluttering butterfly & herb pots
  fillPoly(ctx, [[232, 64], [302, 90], [302, 138], [232, 112]], '#fff7e8', '#5e3c23', 1.5);
  fillPoly(ctx, [[236, 68], [298, 91], [298, 133], [236, 110]], '#9be0ff', '#5e3c23', 1.5);
  fillPoly(ctx, [[237, 102], [297, 124], [297, 132], [237, 110]], '#4ea360');
  // Drifting mini cloud + animated butterfly outside window
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(248, 80, 14, 5);
  const bfx = 266 + Math.round(Math.sin(time * 2.4) * 13);
  const bfy = 97 + Math.round(Math.cos(time * 4) * 5);
  ctx.fillStyle = '#ffe066';
  ctx.fillRect(bfx - 2, bfy, 5, 3);
  // Window mullions + gingham top valance
  ctx.strokeStyle = '#734a2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(267, 80);
  ctx.lineTo(267, 122);
  ctx.stroke();
  fillPoly(ctx, [[235, 68], [299, 91], [299, 99], [235, 76]], '#ff8a8a', '#8c3535', 1);
  // Sill + potted kitchen herbs
  fillPoly(ctx, [[230, 111], [304, 138], [300, 142], [226, 115]], '#fff5e0', '#5e3c23', 1);
  drawPottedPlant(ctx, 278, 122, '#c96b45', '#52b878', false);

  // Clickable 3D Isometric Mint Retro Fridge (Left Wall — holds up to 6 bought treats!)
  const fx = 58,
    fy = 96;
  const fridgeFull = state.kitchen.fridgeItems.length >= FRIDGE_CAPACITY;
  drawIsoShadow(ctx, fx + 30, fy + 104, 34, 12, 0.25);
  // 3D isometric right-side bevel & top lid
  fillPoly(
    ctx,
    [
      [fx + 58, fy],
      [fx + 70, fy - 6],
      [fx + 70, fy + 94],
      [fx + 58, fy + 100],
    ],
    '#57ba98',
    '#12141a',
    1.5,
  );
  fillPoly(
    ctx,
    [
      [fx, fy],
      [fx + 12, fy - 6],
      [fx + 70, fy - 6],
      [fx + 58, fy],
    ],
    '#9ef0d3',
    '#12141a',
    1.5,
  );
  // Cute Ceramic Cat Cookie Jar perched on top of Fridge
  ctx.fillStyle = '#12141a';
  ctx.fillRect(fx + 14, fy - 17, 14, 14);
  ctx.fillStyle = '#fff5e0';
  ctx.fillRect(fx + 15, fy - 16, 12, 12);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(fx + 17, fy - 19, 3, 3);
  ctx.fillRect(fx + 22, fy - 19, 3, 3);
  ctx.fillStyle = '#12141a';
  ctx.fillRect(fx + 18, fy - 12, 2, 2);
  ctx.fillRect(fx + 22, fy - 12, 2, 2);
  // Mini pastel toaster on top of Fridge
  ctx.fillStyle = '#12141a';
  ctx.fillRect(fx + 37, fy - 14, 16, 11);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(fx + 38, fy - 13, 14, 9);
  ctx.fillStyle = '#d98c4a';
  ctx.fillRect(fx + 41, fy - 16, 8, 3);

  // Fridge front chassis (58x100)
  ctx.fillStyle = '#12141a';
  ctx.fillRect(fx - 2, fy - 2, 62, 104);
  ctx.fillStyle = '#78dbb9';
  ctx.fillRect(fx, fy, 58, 100);
  // Gloss edge highlight
  ctx.fillStyle = '#a8f2d8';
  ctx.fillRect(fx + 2, fy + 2, 3, 96);

  if (state.kitchen.fridgeOpen) {
    // Open chilly illuminated interior with 3 sturdy shelves (6 item slots!)
    ctx.fillStyle = '#e0faff';
    ctx.fillRect(fx + 3, fy + 4, 52, 92);
    ctx.fillStyle = '#c4f0fa';
    ctx.fillRect(fx + 3, fy + 4, 52, 8);
    // 3 frosted glass shelves
    ctx.fillStyle = '#7cbcd4';
    ctx.fillRect(fx + 5, fy + 30, 48, 3);
    ctx.fillRect(fx + 5, fy + 60, 48, 3);
    ctx.fillRect(fx + 5, fy + 90, 48, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx + 6, fy + 30, 46, 1);
    ctx.fillRect(fx + 6, fy + 60, 46, 1);
    ctx.fillRect(fx + 6, fy + 90, 46, 1);

    // Subtle empty slot dots + real stocked fridge items!
    FRIDGE_SLOTS.forEach((slot, idx) => {
      const foodId = state.kitchen.fridgeItems[idx];
      const isDragged =
        state.drag?.kind === 'fridge_food' && state.drag.fridgeIndex === idx;
      const isHover = state.hoveredTarget === `kitchen:fridge_item:${idx}`;

      if (!foodId) {
        ctx.fillStyle = 'rgba(124, 188, 212, 0.35)';
        ctx.fillRect(slot.x - 5, slot.y + 8, 10, 2);
      } else if (!isDragged) {
        const bob = isHover ? -2 : 0;
        drawPixelFoodSprite(ctx, foodId, slot.x, slot.y + bob, isHover ? 0.92 : 0.8);
      }
    });

    // Swung-open mint fridge door on left (click door to close!)
    ctx.fillStyle = '#12141a';
    ctx.fillRect(fx - 17, fy + 1, 16, 98);
    ctx.fillStyle = '#5bc2a0';
    ctx.fillRect(fx - 16, fy + 2, 14, 96);
    ctx.fillStyle = '#78dbb9';
    ctx.fillRect(fx - 14, fy + 4, 4, 92);
    // Door handle
    ctx.fillStyle = '#f2f7fa';
    ctx.fillRect(fx - 14, fy + 36, 3, 18);
  } else {
    // Closed fridge split seam + chrome handles + magnets
    ctx.fillStyle = '#5bc2a0';
    ctx.fillRect(fx, fy + 38, 58, 3);
    ctx.fillStyle = '#12141a';
    ctx.fillRect(fx + 46, fy + 13, 6, 18);
    ctx.fillRect(fx + 46, fy + 49, 6, 24);
    ctx.fillStyle = '#f2f7fa';
    ctx.fillRect(fx + 47, fy + 14, 4, 16);
    ctx.fillRect(fx + 47, fy + 50, 4, 22);
    // Kitty polaroid pinned by pink heart magnet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx + 10, fy + 12, 13, 15);
    ctx.fillStyle = '#9be0ff';
    ctx.fillRect(fx + 12, fy + 14, 9, 8);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(fx + 14, fy + 10, 5, 4);
    // Yellow grocery sticky note
    ctx.fillStyle = '#fff29c';
    ctx.fillRect(fx + 18, fy + 54, 15, 14);
    ctx.fillStyle = '#7a5c44';
    ctx.fillRect(fx + 20, fy + 58, 11, 1);
    ctx.fillRect(fx + 20, fy + 61, 8, 1);
    ctx.fillRect(fx + 20, fy + 64, 6, 1);
  }

  // Crisp Fridge Capacity Pill Tag above/below fridge door (shows X/6 or FULL!)
  const fridgeTag = fridgeFull
    ? 'FULL'
    : `${state.kitchen.fridgeItems.length}/${FRIDGE_CAPACITY}`;
  drawTinyPriceTag(
    ctx,
    fx + 29,
    fy + 98,
    fridgeTag,
    fridgeFull || state.hoveredTarget === 'kitchen:fridge',
    fridgeFull ? 'text' : 'owned',
  );

  // Back Wooden Butcher-Block Counter + Recessed Cabinet Doors (Kettle + Honey & Sugar Jars)
  drawIsoShadow(ctx, 260, 196, 66, 25, 0.22);
  drawIsoBox(
    ctx,
    [220, 124],
    [346, 173],
    [306, 194],
    [180, 145],
    30,
    {
      top: '#d6975e',
      left: '#a36535',
      right: '#7d4a25',
      outline: '#1a130d',
      highlight: '#f0bc89',
    },
  );
  // Paneled cabinet doors + brass knobs
  for (let d = 0; d < 3; d++) {
    const t0 = 0.08 + d * 0.3;
    const t1 = t0 + 0.24;
    const x0 = 180 + (306 - 180) * t0;
    const y0 = 145 + (194 - 145) * t0;
    const x1 = 180 + (306 - 180) * t1;
    const y1 = 145 + (194 - 145) * t1;
    fillPoly(
      ctx,
      [
        [x0, y0 + 5],
        [x1, y1 + 5],
        [x1, y1 + 24],
        [x0, y0 + 24],
      ],
      '#8f5429',
      '#593115',
      1,
    );
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2 + 11), 3, 3);
  }

  // Stovetop Burner Ring under Kettle (glows warm orange when whistling!)
  fillPoly(ctx, [[232, 141], [244, 146], [232, 151], [220, 146]], '#2e2927', '#1a130d', 1);
  if (state.kitchen.kettleSteamTimer > 0) {
    fillPoly(ctx, [[232, 143], [240, 146], [232, 149], [224, 146]], '#ff7b3b');
  }

  // Clickable Coral Steaming Kettle on back counter
  const kx = 232,
    ky = 142;
  ctx.fillStyle = '#12141a';
  ctx.fillRect(kx - 9, ky - 7, 18, 15);
  ctx.fillStyle = '#ff7b54';
  ctx.fillRect(kx - 8, ky - 6, 16, 13);
  ctx.fillStyle = '#ffb091';
  ctx.fillRect(kx - 5, ky - 4, 6, 4);
  ctx.fillStyle = '#12141a';
  ctx.fillRect(kx - 5, ky - 11, 10, 4);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(kx - 2, ky - 10, 4, 2);
  ctx.fillStyle = '#12141a';
  ctx.fillRect(kx + 8, ky - 5, 5, 3);

  // Decorative Sugar Canister & Honey Pot on right side of back counter
  ctx.fillStyle = '#12141a';
  ctx.fillRect(272, 149, 12, 13);
  ctx.fillStyle = '#fff5e6';
  ctx.fillRect(273, 150, 10, 11);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(274, 147, 8, 3);
  ctx.fillStyle = '#12141a';
  ctx.fillRect(292, 158, 11, 12);
  ctx.fillStyle = '#f5b841';
  ctx.fillRect(293, 159, 9, 10);
  ctx.fillStyle = '#c47b3b';
  ctx.fillRect(294, 156, 7, 3);

  // Cozy Round Braided Dining Cushion Mat under Mochi (seated properly beside the dining table!)
  drawIsoShadow(ctx, 162, 216, 30, 12, 0.16);
  ctx.fillStyle = '#e890a6';
  ctx.beginPath();
  ctx.ellipse(162, 214, 28, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9e475e';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#fff0d6';
  ctx.beginPath();
  ctx.ellipse(162, 214, 19, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Woven Pet Dining Mat + Water Bowl + Pink Food Bowl neatly in front-left of Mochi
  fillPoly(ctx, [[138, 222], [178, 238], [150, 254], [110, 238]], '#f0cfa0', '#a67a46', 1.2);
  // Blue ceramic water bowl
  fillPoly(ctx, [[126, 229], [144, 236], [130, 244], [112, 237]], '#6ec8f5', '#1a130d', 1.2);
  fillPoly(ctx, [[126, 232], [138, 237], [130, 241], [118, 236]], '#b5ecff');
  if (Math.sin(time * 4) > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(125, 235, 4, 1);
  }
  // Pink ceramic food bowl
  fillPoly(ctx, [[152, 230], [174, 239], [154, 249], [132, 240]], '#ff77a8', '#1a130d', 1.5);
  fillPoly(ctx, [[152, 233], [167, 239], [154, 245], [139, 239]], '#fff3d6');
  if (state.kitchen.bowlFood) {
    drawPixelFoodSprite(ctx, state.kitchen.bowlFood, 152, 238, 0.78);
  }

  // Draw Mochi seated cleanly on the kitchen dining mat right beside the serving table!
  const isDraggingTableFood = state.drag?.kind === 'table_food';
  const isDraggingFridgeFood = state.drag?.kind === 'fridge_food';
  const expr = isDraggingTableFood
    ? 'excited'
    : isDraggingFridgeFood
      ? 'happy'
      : state.cat.expression;
  const catAnchor = getCatAnchor(state);
  drawPixelCat(ctx, catAnchor.x, catAnchor.y, catAnchor.scale, time, {
    fur: state.fur,
    accessory: state.accessory,
    expression: expr,
    blink: state.cat.isBlinking,
    mouthOpen: isDraggingTableFood ? 0.58 : state.cat.mouthOpen,
    hopY: state.cat.hopY,
    scaleX: state.cat.scaleX,
    scaleY: state.cat.scaleY,
    gazeX: state.cat.gazeX,
    gazeY: state.cat.gazeY,
    earTwitch: state.cat.earTwitch,
  });

  // Cozy Foreground Wooden Serving Table (Lower-Right — holds 3 clean plates served from the fridge!)
  drawIsoShadow(ctx, 263, 237, 58, 22, 0.22);
  // Sturdy oak table legs tucked cleanly inside isometric floor diamond
  ctx.fillStyle = '#633818';
  ctx.fillRect(202, 228, 5, 12);
  ctx.fillRect(265, 251, 6, 11);
  ctx.fillRect(318, 226, 5, 11);
  // Table apron + beveled oak top
  drawIsoBox(
    ctx,
    [258, 192],
    [328, 220],
    [268, 250],
    [198, 222],
    9,
    {
      top: '#dda066',
      left: '#a66b3a',
      right: '#804e26',
      outline: '#1a130d',
      highlight: '#f5c798',
    },
  );
  // Red-and-cream Gingham Table Runner draped across center of table
  fillPoly(ctx, [[232, 204], [298, 230], [284, 238], [218, 212]], '#fff5e6', '#c45454', 1);
  fillPoly(ctx, [[244, 209], [286, 226], [278, 230], [236, 213]], 'rgba(232, 92, 92, 0.45)');

  // 3 Clean Porcelain Serving Plates (empty when waiting for food, plated when served from fridge!)
  TABLE_SLOTS.forEach((slot, idx) => {
    const foodId = state.kitchen.tableItems[idx];
    const isBeingDragged =
      state.drag?.kind === 'table_food' && state.drag.tableIndex === idx;
    const isHover = state.hoveredTarget === `kitchen:table_item:${idx}`;

    // Ceramic plate with inner rim
    fillPoly(
      ctx,
      [
        [slot.x, slot.y - 2],
        [slot.x + 16, slot.y + 4],
        [slot.x, slot.y + 10],
        [slot.x - 16, slot.y + 4],
      ],
      '#ffffff',
      isDraggingFridgeFood && !foodId ? '#e8a82e' : '#788694',
      isDraggingFridgeFood && !foodId ? 1.6 : 1.2,
    );
    fillPoly(
      ctx,
      [
        [slot.x, slot.y],
        [slot.x + 11, slot.y + 4],
        [slot.x, slot.y + 8],
        [slot.x - 11, slot.y + 4],
      ],
      '#f0f4f7',
    );

    if (foodId && !isBeingDragged) {
      const bob = isHover ? -3 : 0;
      drawPixelFoodSprite(ctx, foodId, slot.x, slot.y - 2 + bob, isHover ? 1.14 : 1.02);
    }
  });

  // Flying tossed food arc
  if (state.kitchen.flyingFood) {
    drawPixelFoodSprite(
      ctx,
      state.kitchen.flyingFood.id,
      state.kitchen.flyingFood.x,
      state.kitchen.flyingFood.y,
      1.05,
    );
  }

  // Clear diegetic drop-target cues!
  if (isDraggingFridgeFood) {
    drawHoverRing(ctx, 262, 218, 38, time, '#ffe066');
  } else if (isDraggingTableFood) {
    drawHoverRing(ctx, catAnchor.x, catAnchor.y - 4, 30, time, '#75f0a8');
    drawHoverRing(ctx, 152, 238, 16, time, '#ffe066');
    if (state.kitchen.fridgeOpen && !fridgeFull) {
      drawHoverRing(ctx, fx + 29, fy + 48, 28, time, '#9be0ff');
    }
  }

  if (state.hoveredTarget === 'kitchen:fridge' || state.hoveredTarget === 'kitchen:fridge_door') {
    drawHoverRing(ctx, fx + 29, fy + 48, 30, time, '#75f0a8');
  }
  if (state.hoveredTarget === 'kitchen:kettle') drawHoverRing(ctx, kx, ky, 15, time, '#ffb091');
}

// =============================================================================
// 6. CLOSET — Parisian Pixel Boutique Diorama
// =============================================================================
export function drawCloset(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  drawRoomBackdrop(ctx);
  const { cx, topY, rw, rh, wallH } = ISO_ROOM;
  const corners = getIsoCorners();
  const { midCorner, leftBot, rightBot, frontBot } = corners;

  drawIsoRoomShell(ctx, corners, {
    wallLeft: '#f0c6db',
    wallRight: '#dea8c4',
    wallRimTop: '#fce8f3',
    wallRimSide: '#8c4c6c',
    floorBase: '#be875f',
    slabLeft: '#875738',
    slabRight: '#663f26',
    outline: '#1a0e18',
    crown: '#fcebf5',
  });

  // Subtle boutique vertical stripes + tiny sparkle diamonds on wallpaper
  for (let i = 14; i < rw - 8; i += 18) {
    const yOff = Math.round((i / rw) * rh);
    ctx.fillStyle = 'rgba(255, 240, 248, 0.35)';
    ctx.fillRect(cx - i - 4, topY + yOff + 8, 6, wallH - 26);
    ctx.fillStyle = 'rgba(255, 232, 244, 0.25)';
    ctx.fillRect(cx + i - 2, topY + yOff + 8, 6, wallH - 26);
    for (let dy = 22; dy < wallH - 22; dy += 26) {
      ctx.fillStyle = '#fff0f8';
      ctx.fillRect(cx - i - 2, topY + yOff + dy, 2, 2);
      ctx.fillStyle = '#f2cce0';
      ctx.fillRect(cx + i, topY + yOff + dy, 2, 2);
    }
  }

  // Cream Parisian wainscoting with gold chair-rail trim along lower walls
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 20],
      [cx - rw, topY + rh + wallH - 20],
      leftBot,
      midCorner,
    ],
    '#f9eaf2',
    '#9c6582',
    1,
  );
  fillPoly(
    ctx,
    [
      [cx, topY + wallH - 20],
      [cx + rw, topY + rh + wallH - 20],
      rightBot,
      midCorner,
    ],
    '#edd8e4',
    '#9c6582',
    1,
  );
  // Thin gold chair-rail bead along top of wainscoting
  ctx.strokeStyle = '#e0b04b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - rw, topY + rh + wallH - 20);
  ctx.lineTo(cx, topY + wallH - 20);
  ctx.lineTo(cx + rw, topY + rh + wallH - 20);
  ctx.stroke();

  // Twinkling Boutique Fairy-Light Garland draped gracefully across both upper walls!
  ctx.strokeStyle = '#9c5a78';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 128, topY + 56);
  ctx.quadraticCurveTo(cx - 64, topY + 42, cx, topY + 14);
  ctx.quadraticCurveTo(cx + 64, topY + 42, cx + 128, topY + 56);
  ctx.stroke();
  const garlandPts: Array<[number, number]> = [
    [cx - 110, topY + 51],
    [cx - 82, topY + 43],
    [cx - 52, topY + 34],
    [cx - 24, topY + 23],
    [cx, topY + 15],
    [cx + 24, topY + 23],
    [cx + 52, topY + 34],
    [cx + 82, topY + 43],
    [cx + 110, topY + 51],
  ];
  garlandPts.forEach(([gx, gy], idx) => {
    const twinkle = Math.sin(time * 3.4 + idx * 1.1) > -0.2;
    ctx.fillStyle = twinkle ? 'rgba(255, 244, 168, 0.34)' : 'rgba(255, 224, 130, 0.16)';
    ctx.fillRect(gx - 3, gy - 2, 6, 6);
    ctx.fillStyle = twinkle ? '#fff7bd' : '#ffd466';
    ctx.fillRect(gx - 1, gy, 3, 3);
  });

  // Warm Polished Walnut Wood Floor Planks
  ctx.strokeStyle = '#9e6a46';
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

  // Framed Fashion Bow Sketch + Mini Perfume Shelf on Left Wall beside Mirror
  fillPoly(ctx, [[144, 68], [182, 54], [182, 88], [144, 102]], '#e0b04b', '#5c2d45', 1.4);
  fillPoly(ctx, [[148, 71], [178, 60], [178, 85], [148, 96]], '#fff9f0');
  drawAccessoryIcon(ctx, 'bow', 163, 79, 0.72);
  // Tiny floating gold wall shelf with crystal perfume flacon & powder compact
  fillPoly(ctx, [[146, 114], [184, 100], [184, 105], [146, 119]], '#b8763e', '#1a0e18', 1);
  // Pink crystal perfume bottle + atomizer bulb
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(152, 102, 9, 11);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(153, 104, 7, 8);
  ctx.fillStyle = '#fff5f8';
  ctx.fillRect(154, 105, 2, 5);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(155, 100, 3, 3);
  ctx.fillStyle = '#ff6b9d';
  ctx.fillRect(159, 99, 3, 3);
  // Lavender ribboned trinket box
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(167, 98, 11, 9);
  ctx.fillStyle = '#c8a6ff';
  ctx.fillRect(168, 99, 9, 7);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(171, 99, 3, 7);

  // Lush Corner Potted Pink Rose Plant tucked cleanly at Back Corner (198, 152)
  drawIsoShadow(ctx, 198, 155, 12, 5, 0.18);
  // Cream & gold striped ceramic planter
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(191, 141, 14, 14);
  ctx.fillStyle = '#fff6eb';
  ctx.fillRect(192, 142, 12, 12);
  ctx.fillStyle = '#f0a6c2';
  ctx.fillRect(192, 146, 12, 3);
  ctx.fillStyle = '#e0b04b';
  ctx.fillRect(191, 141, 14, 2);
  // Leafy stems & tiny pink roses
  ctx.fillStyle = '#3b8c52';
  ctx.fillRect(193, 130, 10, 11);
  ctx.fillRect(189, 133, 18, 6);
  ctx.fillStyle = '#5bb872';
  ctx.fillRect(195, 128, 6, 8);
  ctx.fillStyle = '#ff77a8';
  ctx.fillRect(192, 131, 4, 4);
  ctx.fillRect(200, 132, 4, 4);
  ctx.fillRect(196, 126, 4, 4);
  ctx.fillStyle = '#ffd1e3';
  ctx.fillRect(193, 132, 2, 2);
  ctx.fillRect(197, 127, 2, 2);

  // Soft Golden Overhead Boutique Spotlight Cone onto Mochi's Runway!
  const spotGrad = ctx.createRadialGradient(196, 198, 8, 196, 198, 64);
  spotGrad.addColorStop(0, 'rgba(255, 248, 214, 0.34)');
  spotGrad.addColorStop(1, 'rgba(255, 248, 214, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(196, 200, 64, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elevated Plush Velvet Boutique Modeling Rug / Runway Stage with Scalloped Gold Rim
  drawIsoShadow(ctx, 196, 204, 68, 29, 0.18);
  fillPoly(ctx, [[196, 168], [262, 198], [196, 230], [130, 198]], '#e87fa8', '#7a2e4d', 1.5);
  fillPoly(ctx, [[196, 173], [251, 198], [196, 224], [141, 198]], '#ffbfd8', '#ffd466', 1.2);
  fillPoly(ctx, [[196, 181], [234, 198], [196, 216], [158, 198]], '#fff0f6');
  // Four gilded corner tassels
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(194, 166, 4, 4);
  ctx.fillRect(194, 228, 4, 4);
  ctx.fillRect(128, 196, 4, 4);
  ctx.fillRect(260, 196, 4, 4);

  // Ornate Baroque Gilded Standing Cheval Mirror with Grounded Easel Feet & LIVE Mochi Reflection!
  const mx = 79,
    my = 84,
    mw = 50,
    mh = 96;
  // Grounded oval floor shadow & brass cheval legs following the isometric floor angle
  drawIsoShadow(ctx, mx + mw / 2, my + mh + 7, 27, 8, 0.24);
  // Left & right brass easel feet grounded cleanly on walnut planks
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(mx + 4, my + mh - 2, 7, 11);
  ctx.fillRect(mx + mw - 11, my + mh - 6, 7, 10);
  ctx.fillStyle = '#d49d2a';
  ctx.fillRect(mx + 5, my + mh - 1, 5, 9);
  ctx.fillRect(mx + mw - 10, my + mh - 5, 5, 8);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(mx + 3, my + mh + 6, 9, 3);
  ctx.fillRect(mx + mw - 12, my + mh + 1, 9, 3);
  // Gilded scalloped baroque crown crest + pink ribbon accent on top
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(mx + 12, my - 9, 26, 9);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(mx + 13, my - 8, 24, 8);
  ctx.fillStyle = '#fff5b8';
  ctx.fillRect(mx + 21, my - 6, 8, 4);
  ctx.fillStyle = '#ff77a8';
  ctx.fillRect(mx + 23, my - 5, 4, 2);
  // Main gilded mirror frame
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(mx, my, mw, mh);
  ctx.fillStyle = '#d49d2a';
  ctx.fillRect(mx + 4, my + 4, mw - 8, mh - 8);
  ctx.fillStyle = '#c8f3ff';
  ctx.fillRect(mx + 6, my + 6, mw - 12, mh - 12);

  // Live miniature reflection of Mochi inside mirror!
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx + 6, my + 6, mw - 12, mh - 12);
  ctx.clip();
  // Soft pastel boutique reflection background
  ctx.fillStyle = '#e0f7ff';
  ctx.fillRect(mx + 6, my + 6, mw - 12, mh - 12);
  ctx.fillStyle = '#f7d8e8';
  ctx.fillRect(mx + 6, my + mh - 28, mw - 12, 22);
  drawPixelCat(ctx, mx + mw / 2, my + mh - 28, 1.85, time, {
    fur: state.fur,
    accessory: state.accessory,
    expression: state.closet.poseTimer > 0 ? 'happy' : state.cat.expression,
    blink: state.cat.isBlinking,
    mouthOpen: state.cat.mouthOpen,
    hopY: state.cat.hopY * 0.5,
    flipX: true,
    alpha: 0.82,
  });
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(mx + 9, my + 11, 5, 22);
  ctx.fillRect(mx + 16, my + 36, 3, 15);
  ctx.restore();

  // Warm Glowing Vanity Bulbs around mirror frame
  for (let i = 0; i < 5; i++) {
    const by = my + 9 + i * 19;
    const bulb = Math.sin(time * 4 + i) > -0.3 ? '#fff7b2' : '#ffe066';
    ctx.fillStyle = bulb;
    ctx.fillRect(mx + 1, by, 4, 4);
    ctx.fillRect(mx + mw - 5, by, 4, 4);
  }

  // Carved Parisian Fur-Palette Vanity Bench (Lower-Left, 100% Inside Floor with Clean Spacing!)
  drawIsoShadow(ctx, 114, 232, 56, 20, 0.22);
  drawIsoBox(
    ctx,
    [74, 198],
    [170, 236],
    [154, 248],
    [58, 210],
    9,
    {
      top: '#b37144',
      left: '#854d2b',
      right: '#63371c',
      outline: '#1a0e18',
      highlight: '#d9986a',
    },
  );
  // Cream & berry-trimmed velvet runner cloth across bench top
  fillPoly(ctx, [[75, 202], [163, 237], [153, 244], [65, 209]], '#f7b2cf', '#c96f96', 0.9);
  Object.values(FUR_PALETTES).forEach((pal) => {
    const isDragged = state.drag?.kind === 'fur' && state.drag.furId === pal.id;
    const isEquipped = state.fur === pal.id;
    const isHover = state.hoveredTarget === `closet:fur:${pal.id}`;
    if (!isDragged) {
      drawFurJar(ctx, pal.jarX, pal.jarY - (isHover ? 3 : 0), pal.swatch, isEquipped);
    }
  });

  // Recessed Parisian Boutique Display Cabinet / Armoire (Right Wall — Clean Shelving, Zero Tag Clipping!)
  // Sculpted walnut outer frame + decorative top crown molding
  fillPoly(ctx, [[222, 68], [352, 118], [352, 124], [222, 74]], '#a3653b', '#1a0e18', 1.3);
  fillPoly(ctx, [[224, 72], [350, 120], [350, 208], [224, 160]], '#7d4b2d', '#1a0e18', 1.5);
  // Cream-blush backlit velvet display interior
  fillPoly(ctx, [[228, 78], [346, 123], [346, 202], [228, 157]], '#faebf3', '#5c334a', 1);
  // Subtle warm top cove light glow inside cabinet
  fillPoly(ctx, [[228, 78], [346, 123], [346, 134], [228, 89]], 'rgba(255, 242, 194, 0.45)');

  // Two Sturdy Beveled Walnut Display Shelves (front edge tall enough to host clean price badges!)
  fillPoly(ctx, [[228, 114], [346, 159], [346, 166], [228, 121]], '#945935', '#1a0e18', 1.2);
  fillPoly(ctx, [[228, 112], [346, 157], [346, 159], [228, 114]], '#c9895b');
  fillPoly(ctx, [[228, 156], [346, 201], [346, 208], [228, 163]], '#945935', '#1a0e18', 1.2);
  fillPoly(ctx, [[228, 154], [346, 199], [346, 201], [228, 156]], '#c9895b');

  // Display all 6 Boutique Accessories on tufted velvet cushions with crisp non-overlapping shelf tags!
  ACCESSORIES.forEach((acc) => {
    const owned = state.ownedAccessories.includes(acc.id);
    const equipped = state.accessory === acc.id;
    const isDragged = state.drag?.kind === 'accessory' && state.drag.accId === acc.id;
    const isHover = state.hoveredTarget === `closet:acc:${acc.id}`;

    // Tufted velvet display cushion resting cleanly on the shelf
    ctx.fillStyle = equipped ? '#ffe082' : '#e6a3c2';
    ctx.fillRect(acc.shelfX - 10, acc.shelfY + 3, 20, 4);
    ctx.fillStyle = equipped ? '#fff5c2' : '#f7cce0';
    ctx.fillRect(acc.shelfX - 8, acc.shelfY + 3, 16, 2);

    if (!isDragged) {
      drawAccessoryIcon(
        ctx,
        acc.id,
        acc.shelfX,
        acc.shelfY - 2 - (isHover ? 3 : 0),
        isHover ? 1.14 : 1,
      );
    }
    // Crisp badge mounted right on the shelf fascia directly beneath each accessory!
    if (equipped) {
      drawTinyPriceTag(ctx, acc.shelfX, acc.shelfY + 11, 'ON', true, 'owned');
    } else if (owned) {
      drawTinyPriceTag(ctx, acc.shelfX, acc.shelfY + 11, 'OK', isHover, 'owned');
    } else {
      drawTinyPriceTag(ctx, acc.shelfX, acc.shelfY + 11, String(acc.cost), isHover, 'coin');
    }
  });

  // Stacked Pastel Striped Boutique Hatboxes tucked cleanly on the right floor (clear of Crown badge!)
  const hbX = 316,
    hbY = 215;
  drawIsoShadow(ctx, hbX, hbY + 11, 14, 6, 0.22);
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(hbX - 11, hbY - 1, 22, 12);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(hbX - 10, hbY, 20, 10);
  ctx.fillStyle = '#fff5f8';
  ctx.fillRect(hbX - 6, hbY, 3, 10);
  ctx.fillRect(hbX + 2, hbY, 3, 10);
  // Top smaller mint hatbox + golden ribbon bow
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(hbX - 8, hbY - 11, 16, 11);
  ctx.fillStyle = '#75d6b8';
  ctx.fillRect(hbX - 7, hbY - 10, 14, 9);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(hbX - 2, hbY - 12, 4, 3);

  // Ornate Brass & Walnut Valet Coat Stand ("OFF") — Seated 100% Inside Floor with Clean Margin!
  const hookX = 274,
    hookY = 216;
  drawIsoShadow(ctx, hookX, hookY + 12, 15, 6, 0.24);
  ctx.fillStyle = '#1a0e18';
  ctx.fillRect(hookX - 4, hookY - 26, 8, 37);
  ctx.fillRect(hookX - 12, hookY + 7, 24, 7);
  ctx.fillStyle = '#693c22';
  ctx.fillRect(hookX - 3, hookY - 24, 6, 34);
  ctx.fillRect(hookX - 11, hookY + 8, 22, 5);
  // Gold finial & curved brass hooks
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(hookX - 3, hookY - 28, 6, 4);
  ctx.fillRect(hookX - 11, hookY - 19, 22, 3);
  ctx.fillRect(hookX - 11, hookY - 22, 3, 4);
  ctx.fillRect(hookX + 8, hookY - 22, 3, 4);
  drawTinyPriceTag(
    ctx,
    hookX,
    hookY + 15,
    'OFF',
    state.hoveredTarget === 'closet:unequip' || state.drag?.kind === 'worn_accessory',
  );

  // Draw Mochi modeling squarely centered on the plush velvet runway rug!
  const catAnchor = getCatAnchor(state);
  drawPixelCat(ctx, catAnchor.x, catAnchor.y, catAnchor.scale, time, {
    fur: state.fur,
    accessory: state.drag?.kind === 'worn_accessory' ? 'none' : state.accessory,
    expression: state.closet.poseTimer > 0 ? 'happy' : state.cat.expression,
    blink: state.cat.isBlinking,
    mouthOpen: state.cat.mouthOpen,
    hopY: state.cat.hopY,
    scaleX: state.cat.scaleX,
    scaleY: state.cat.scaleY,
    gazeX: state.cat.gazeX,
    gazeY: state.cat.gazeY,
    earTwitch: state.cat.earTwitch,
  });

  // Camera flash effect when clicking the mirror (full portrait coverage)
  if (state.closet.mirrorFlash > 0) {
    ctx.fillStyle = `rgba(255, 252, 235, ${state.closet.mirrorFlash * 0.55})`;
    ctx.fillRect(-160, -340, W + 320, H + 680);
  }

  // Drop target cues when dragging accessories or paint jars
  if (state.drag?.kind === 'accessory' || state.drag?.kind === 'fur') {
    drawHoverRing(ctx, catAnchor.x, catAnchor.y - 4, 36, time, '#ffe066');
  } else if (state.drag?.kind === 'worn_accessory') {
    drawHoverRing(ctx, hookX, hookY - 10, 22, time, '#ff9ec0');
  }

  if (state.hoveredTarget === 'closet:mirror') drawHoverRing(ctx, mx + mw / 2, my + mh / 2, 30, time, '#fff29c');
  if (state.hoveredTarget === 'closet:unequip') drawHoverRing(ctx, hookX, hookY - 10, 18, time, '#ff9ec0');
}

export function drawFurJar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  swatch: string,
  equipped: boolean,
): void {
  const jx = Math.round(x),
    jy = Math.round(y);
  // Crisp golden coaster halo beneath equipped jar (no boxy frame clipping neighbors!)
  if (equipped) {
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.ellipse(jx, jy + 8, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9e6b14';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    drawIsoShadow(ctx, jx, jy + 8, 8, 3, 0.22);
  }
  ctx.fillStyle = '#09090d';
  ctx.fillRect(jx - 7, jy - 7, 14, 15);
  // Cork stopper & golden neck collar
  ctx.fillRect(jx - 4, jy - 10, 8, 4);
  ctx.fillStyle = '#c48f5e';
  ctx.fillRect(jx - 3, jy - 9, 6, 3);
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(jx - 4, jy - 6, 8, 1);
  // Glass body + vibrant paint fill + drip highlight
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(jx - 6, jy - 4, 12, 11);
  ctx.fillStyle = swatch;
  ctx.fillRect(jx - 6, jy - 6, 12, 7);
  ctx.fillRect(jx - 4, jy + 1, 4, 3);
  ctx.fillRect(jx + 2, jy + 1, 2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(jx - 4, jy - 5, 2, 5);
}

export function drawDraggedOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
): void {
  const drag = state.drag;
  if (!drag) return;
  const { x, y, lifted } = getDraggedItemPoint(state);

  // Subtle fingertip anchor ring & shadow tether when item is lifted above touch point
  if (lifted) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 242, 178, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(Math.round(state.pointerX), Math.round(state.pointerY), 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 242, 178, 0.45)';
    ctx.fillRect(Math.round(state.pointerX) - 1, Math.round(state.pointerY - 12), 2, 4);
    ctx.restore();
  }

  if (drag.kind === 'sponge') {
    drawSpongeSprite(ctx, x, y);
  } else if (drag.kind === 'towel') {
    ctx.fillStyle = '#09090d';
    ctx.fillRect(Math.round(x - 13), Math.round(y - 10), 26, 20);
    ctx.fillStyle = '#ff9ec0';
    ctx.fillRect(Math.round(x - 12), Math.round(y - 9), 24, 18);
    ctx.fillStyle = '#ffd1e3';
    ctx.fillRect(Math.round(x - 12), Math.round(y + 3), 24, 4);
  } else if (drag.kind === 'duck') {
    drawDuckSprite(ctx, x, y);
  } else if (drag.kind === 'yarn') {
    drawYarnBall(ctx, x, y, time * 6);
  } else if (drag.kind === 'wand') {
    drawFeatherWand(ctx, x, y, time * 1.5);
  } else if (drag.kind === 'fridge_food' || drag.kind === 'table_food') {
    drawPixelFoodSprite(ctx, drag.foodId, x, y, 1.25);
  } else if (drag.kind === 'accessory' || drag.kind === 'worn_accessory') {
    drawAccessoryIcon(ctx, drag.accId, x, y, 1.3);
  } else if (drag.kind === 'fur') {
    drawFurJar(ctx, x, y, FUR_PALETTES[drag.furId].swatch, false);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.55));

    if (p.type === 'heart') {
      ctx.fillStyle = '#ff5e8e';
      ctx.fillRect(x - 3, y - 2, 2, 2);
      ctx.fillRect(x + 1, y - 2, 2, 2);
      ctx.fillRect(x - 2, y, 4, 2);
      ctx.fillRect(x - 1, y + 2, 2, 1);
    } else if (p.type === 'sparkle') {
      ctx.fillStyle = '#fff280';
      ctx.fillRect(x, y - 3, 1, 7);
      ctx.fillRect(x - 3, y, 7, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 1, 1);
    } else if (p.type === 'zzz') {
      ctx.fillStyle = '#d9b8ff';
      ctx.font = '7.5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Z', x, y);
    } else if (p.type === 'bubble') {
      ctx.fillStyle = '#b3f0ff';
      ctx.fillRect(x - 2, y - 2, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    } else if (p.type === 'crumb') {
      ctx.fillStyle = '#f2c166';
      ctx.fillRect(x, y, 3, 3);
    } else if (p.type === 'note') {
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(x, y, 3, 3);
      ctx.fillRect(x + 2, y - 5, 1, 6);
      ctx.fillRect(x + 2, y - 5, 3, 2);
    } else if (p.type === 'steam') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    } else if (p.type === 'splash') {
      ctx.fillStyle = '#7be0ff';
      ctx.fillRect(x, y, 2, 3);
    } else if (p.type === 'dust') {
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(x - 1, y - 1, 3, 2);
    }
    ctx.globalAlpha = 1;
  }
}

export function drawSpeechBubble(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.cat.speechTimer <= 0 || !state.cat.speechText) return;
  if (state.screen === 'hub' || state.playroom.miniGame.active) return;

  const text = state.cat.speechText;
  ctx.font = '6.5px "Press Start 2P", monospace';
  const tw = Math.max(50, ctx.measureText(text).width + 16);
  const cat = getCatAnchor(state);
  const bx = Math.max(12, Math.min(W - tw - 12, Math.round(cat.x - tw / 2)));
  const by = Math.max(12, Math.round(cat.y - 74));

  ctx.fillStyle = '#09090d';
  drawRoundedRect(ctx, bx - 2, by - 2, tw + 4, 22, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, bx, by, tw, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#09090d';
  ctx.fillRect(bx + Math.floor(tw / 2) - 3, by + 18, 6, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + Math.floor(tw / 2) - 2, by + 17, 4, 3);

  ctx.fillStyle = '#2a3356';
  ctx.textAlign = 'center';
  ctx.fillText(text, bx + tw / 2, by + 12);
}

export function drawTransitionOverlay(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  width = W,
  height = H,
): void {
  if (alpha <= 0.01) return;
  ctx.fillStyle = `rgba(10, 24, 17, ${Math.min(1, alpha)})`;
  ctx.fillRect(0, 0, width, height);
}
