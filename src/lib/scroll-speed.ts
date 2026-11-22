// Scroll speed for the auto-scrolling lyrics, in pixels per second.
// The control only ever offers whole values between SCROLL_MIN and SCROLL_MAX.
export const SCROLL_MIN = 5;
export const SCROLL_MAX = 30;
export const SCROLL_DEFAULT = 30;

// Snap any stored/typed value into the allowed range as a whole number.
export function clampScrollSpeed(value: number): number {
  if (!Number.isFinite(value)) return SCROLL_DEFAULT;
  return Math.min(SCROLL_MAX, Math.max(SCROLL_MIN, Math.round(value)));
}

// One tap of the up/down arrows moves a single step, never past the ends.
export function adjustScrollSpeed(current: number, delta: number): number {
  return clampScrollSpeed(clampScrollSpeed(current) + delta);
}
