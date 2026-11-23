import { AccessoryId, CatExpression, FUR_PALETTES, FurId, SoapBubble } from '../types';

export interface DrawCatOptions {
  fur: FurId;
  accessory: AccessoryId;
  expression: CatExpression;
  blink: boolean;
  mouthOpen: number;
  hopY?: number;
  scaleX?: number;
  scaleY?: number;
  gazeX?: number;
  gazeY?: number;
  earTwitch?: number;
  inBed?: boolean;
  carried?: boolean;
  soapBubbles?: SoapBubble[];
  wetLevel?: number;
  flipX?: boolean;
  alpha?: number;
}

/**
 * Renders Mochi with crisp pixel art, squash-and-stretch, gaze tracking,
 * animated tail/ears/paws, accessories, soap suds, and wet droplets.
 */
export function drawPixelCat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  time: number,
  opts: DrawCatOptions,
): void {
  const pal = FUR_PALETTES[opts.fur] || FUR_PALETTES.classic;
  const expr = opts.carried ? 'carried' : opts.expression;
  const isSleeping = expr === 'sleeping';
  const hopY = opts.hopY || 0;
  const breath = isSleeping
    ? Math.sin(time * 2.2) * 0.4
    : Math.sin(time * 3.8) > 0.55
      ? 0.45
      : 0;

  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  // Ground shadow
  if (!opts.inBed) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
    const shScale = opts.carried ? 0.62 : Math.max(0.62, 1 + hopY / 55);
    const shY = opts.carried ? cy + 12 * s : cy + 8.3 * s;
    ctx.fillRect(
      Math.round(cx - 6.8 * s * shScale),
      Math.round(shY),
      Math.round(13.6 * s * shScale),
      Math.round(2.3 * s),
    );
  }

  // Transform origin at bottom-center of cat for snappy squash & stretch
  const sx = (opts.scaleX ?? 1) * (opts.flipX ? -1 : 1);
  const sy = opts.scaleY ?? 1;
  ctx.translate(Math.round(cx), Math.round(cy + 8 * s + hopY));
  ctx.scale(sx, sy);

  const ox = -10 * s;
  const oy = -19 * s + breath * s * 0.6;

  const px = (gx: number, gy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(ox + gx * s),
      Math.round(oy + gy * s),
      Math.max(1, Math.round(w * s)),
      Math.max(1, Math.round(h * s)),
    );
  };

  // 1. Curving Wagging Tail
  const wagSpeed = expr === 'happy' || expr === 'excited' ? 13 : opts.carried ? 10 : 4.2;
  const wag = isSleeping ? 0 : Math.round(Math.sin(time * wagSpeed) * 1.1);
  if (!opts.inBed) {
    px(3, 15, 3, 3, pal.outline);
    px(1, 13 + wag, 3, 3, pal.outline);
    px(0, 11 + wag, 3, 3, pal.outline);
    px(4, 16, 2, 1, pal.patchDark);
    px(2, 14 + wag, 2, 2, pal.patch);
    px(1, 12 + wag, 1, 2, pal.patch);
  }

  // 2. Body & 4 Stubby Paws (or dangling paws when carried!)
  if (!opts.inBed) {
    const dangle = opts.carried ? Math.sin(time * 16) * 0.9 : 0;
    px(5, 12, 10, 7, pal.outline);
    px(5, 18 + dangle * 0.4, 4, 2.2, pal.outline);
    px(11, 18 - dangle * 0.4, 4, 2.2, pal.outline);
    px(8, 17, 4, 2, pal.outline);

    px(6, 13, 8, 4, pal.body);
    px(6, 13, 2, 2, pal.patch);
    px(6, 15, 1, 2, pal.shade);
    px(6, 17 + dangle * 0.4, 2, 2, pal.body);
    px(8, 17, 1, 1, pal.shade);
    px(9, 17, 2, 1, pal.body);
    px(12, 17 - dangle * 0.4, 2, 2, pal.body);
    px(10, 16, 1, 2, pal.outline);
    px(7, 17, 1, 2, pal.outline);
  }

  // 3. Head & Ears (with subtle ear twitch!)
  const twitch = opts.earTwitch ? Math.round(opts.earTwitch) : 0;
  px(4, 1 + twitch, 4, 4, pal.outline);
  px(12, 1, 4, 4, pal.outline);
  px(7, 2, 6, 2, pal.outline);
  px(3, 5, 14, 6, pal.outline);
  px(4, 11, 12, 2, pal.outline);

  px(4, 5, 12, 6, pal.body);
  px(5, 3, 10, 9, pal.body);

  // Ear details + forehead taupe patch
  px(5, 2 + twitch, 2, 3, pal.patch);
  px(5, 3 + twitch, 2, 2, pal.earInner);
  px(7, 3, 2, 2, pal.patch);
  px(6, 4, 2, 2, pal.shade);

  px(13, 2, 2, 3, pal.patch);
  px(13, 3, 2, 2, pal.earInner);
  px(12, 3, 1, 1, pal.shade);

  // Subtle left cheek shading
  px(4, 6, 1, 4, pal.shade);
  px(5, 10, 1, 1, pal.shade);

  // 4. Face: Blush, Eyes with Gaze Tracking, Mouth
  const blushW = expr === 'happy' || expr === 'excited' ? 2 : 1;
  px(4, 9, blushW, 1, pal.blush);
  px(16 - blushW, 9, blushW, 1, pal.blush);

  const gx = Math.max(-0.5, Math.min(0.5, opts.gazeX ?? 0));
  const gy = Math.max(-0.4, Math.min(0.4, opts.gazeY ?? 0));

  if (isSleeping) {
    px(6, 8, 2, 1, pal.outline);
    px(12, 8, 2, 1, pal.outline);
  } else if (expr === 'happy') {
    px(6, 7, 2, 1, pal.outline);
    px(5, 8, 1, 1, pal.outline);
    px(8, 8, 1, 1, pal.outline);

    px(12, 7, 2, 1, pal.outline);
    px(11, 8, 1, 1, pal.outline);
    px(14, 8, 1, 1, pal.outline);
  } else if (expr === 'excited') {
    // Sparkling wide eager eyes!
    px(6, 6.4, 2.2, 2.6, pal.outline);
    px(11.8, 6.4, 2.2, 2.6, pal.outline);
    px(6.3 + gx * 0.4, 6.8 + gy * 0.4, 1, 1, '#fff6a6');
    px(12.1 + gx * 0.4, 6.8 + gy * 0.4, 1, 1, '#fff6a6');
  } else if (expr === 'surprised' || expr === 'carried') {
    px(6, 6.2, 2, 2.8, pal.outline);
    px(12, 6.2, 2, 2.8, pal.outline);
    px(6.2, 6.5, 0.9, 0.9, '#ffffff');
    px(12.2, 6.5, 0.9, 0.9, '#ffffff');
  } else if (opts.blink) {
    px(6, 8, 2, 1, pal.outline);
    px(12, 8, 2, 1, pal.outline);
  } else {
    px(6 + gx * 0.55, 7 + gy * 0.5, 2, 2, pal.outline);
    px(12 + gx * 0.55, 7 + gy * 0.5, 2, 2, pal.outline);
    // Tiny eye glint for liveliness
    px(6.2 + gx * 0.55, 7.1 + gy * 0.5, 0.65, 0.65, '#ffffff');
    px(12.2 + gx * 0.55, 7.1 + gy * 0.5, 0.65, 0.65, '#ffffff');
  }

  // Mouth
  if (opts.mouthOpen > 0.22 || expr === 'eating') {
    const openH = opts.mouthOpen > 0.62 ? 2.4 : 1.7;
    px(9, 8.2, 2, openH, pal.outline);
    px(9.4, 8.7, 1.2, Math.max(0.7, openH - 0.8), '#eb6c7d');
  } else if (expr === 'excited') {
    px(9, 8.3, 2, 1.6, pal.outline);
    px(9.4, 8.8, 1.2, 0.9, '#ff85a2');
  } else if (expr === 'surprised' || expr === 'carried') {
    px(9.3, 8.5, 1.4, 1.4, pal.outline);
  } else {
    px(9, 8, 0.7, 1.2, pal.outline);
    px(10.3, 8, 0.7, 1.2, pal.outline);
    px(9.2, 9, 1.6, 0.8, pal.outline);
  }

  // 5. Equipped Accessories
  const acc = opts.accessory;
  if (acc === 'bow') {
    px(4, 1 + twitch, 5, 3, '#09090d');
    px(4.5, 1.5 + twitch, 1.5, 2, '#ff77a8');
    px(7, 1.5 + twitch, 1.5, 2, '#ff77a8');
    px(6, 2 + twitch, 1, 1, '#ffd1e3');
  } else if (acc === 'shades') {
    px(4, 7, 12, 1, '#09090d');
    px(5, 7, 4, 2.4, '#111524');
    px(11, 7, 4, 2.4, '#111524');
    px(5.5, 7.4, 1, 0.8, '#8be9fd');
    px(11.5, 7.4, 1, 0.8, '#8be9fd');
  } else if (acc === 'crown') {
    px(7, -1, 6, 4, '#09090d');
    px(7.5, 0, 1, 2.5, '#ffd43b');
    px(9.5, -0.5, 1, 3, '#ffd43b');
    px(11.5, 0, 1, 2.5, '#ffd43b');
    px(7.5, 1.5, 5, 1, '#f59f00');
    px(9.5, 1.3, 1, 1, '#ff4d6d');
  } else if (acc === 'daisy') {
    [6.5, 9.5, 12.5].forEach((dx) => {
      px(dx - 0.6, 1.4, 2.2, 2.2, '#ffffff');
      px(dx, 2, 1, 1, '#f5cf38');
    });
  } else if (acc === 'frog') {
    px(4.5, 0, 11, 3.5, '#09090d');
    px(5, 0.5, 10, 2.5, '#5ec269');
    px(5.5, -1, 2.5, 2, '#09090d');
    px(12, -1, 2.5, 2, '#09090d');
    px(6, -0.5, 1.5, 1.2, '#ffffff');
    px(12.5, -0.5, 1.5, 1.2, '#ffffff');
    px(6.5, -0.2, 0.7, 0.7, '#09090d');
    px(13, -0.2, 0.7, 0.7, '#09090d');
  } else if (acc === 'scarf' && !opts.inBed) {
    px(5, 11.5, 10, 2.5, '#09090d');
    px(5.5, 12, 9, 1.5, '#e64553');
    px(6.5, 12, 1.5, 1.5, '#ff8590');
    px(11, 13.5, 2.5, 3, '#09090d');
    px(11.5, 13.5, 1.5, 2.5, '#e64553');
  }

  // 6. Wet Water Droplets (after shower before towel-drying!)
  if (opts.wetLevel && opts.wetLevel > 0.15 && !opts.inBed) {
    const dropOff = (time * 3) % 1;
    px(4.2, 10.5 + dropOff * 3, 0.9, 1.4, '#7be0ff');
    px(14.8, 9.5 + ((dropOff + 0.5) % 1) * 3, 0.9, 1.4, '#7be0ff');
    px(9.5, 14.5 + dropOff * 2.5, 0.9, 1.2, '#b3f0ff');
  }

  // 7. Soap Suds Overlay
  if (opts.soapBubbles && opts.soapBubbles.length > 0) {
    opts.soapBubbles.forEach((b) => {
      const bx = Math.round(b.rx * s);
      const by = Math.round((b.ry - 9) * s);
      const r = Math.max(2, Math.round(b.r));
      ctx.fillStyle = '#c5f4ff';
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - r + 1, by - r + 1, Math.max(1, r - 1), Math.max(1, r - 1));
    });
  }

  ctx.restore();
}
