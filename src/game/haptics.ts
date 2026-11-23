/**
 * Lightweight, safe mobile haptic feedback helper.
 * Falls back cleanly to a no-op on desktop browsers and iOS Safari where navigator.vibrate is absent.
 */

export type HapticPattern = 'tap' | 'pickup' | 'boop' | 'success' | 'thud';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  pickup: 12,
  boop: 15,
  success: [12, 26, 18],
  thud: [18, 22, 12],
};

export function triggerHaptic(pattern: HapticPattern, muted = false): void {
  if (muted) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Ignore restricted/unsupported vibration contexts
  }
}
