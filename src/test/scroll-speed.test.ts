import { describe, it, expect } from "vitest";
import { SCROLL_DEFAULT, SCROLL_MAX, SCROLL_MIN, adjustScrollSpeed, clampScrollSpeed } from "@/lib/scroll-speed";

describe("scroll speed limits", () => {
  it("offers 5 to 30", () => {
    expect(SCROLL_MIN).toBe(5);
    expect(SCROLL_MAX).toBe(30);
  });

  it("pulls a stored speed above the top back down", () =>
    expect(clampScrollSpeed(150)).toBe(30));

  it("pulls a stored speed below the bottom back up", () =>
    expect(clampScrollSpeed(2)).toBe(5));

  it("keeps a whole number inside the range", () =>
    expect(clampScrollSpeed(12)).toBe(12));

  it("rounds a fractional stored speed", () =>
    expect(clampScrollSpeed(12.6)).toBe(13));

  it("falls back to the default for an unusable value", () =>
    expect(clampScrollSpeed(Number.NaN)).toBe(SCROLL_DEFAULT));
});

describe("adjustScrollSpeed", () => {
  it("moves by ones", () => {
    expect(adjustScrollSpeed(12, 1)).toBe(13);
    expect(adjustScrollSpeed(12, -1)).toBe(11);
  });

  it("stops at the top", () =>
    expect(adjustScrollSpeed(SCROLL_MAX, 1)).toBe(SCROLL_MAX));

  it("stops at the bottom", () =>
    expect(adjustScrollSpeed(SCROLL_MIN, -1)).toBe(SCROLL_MIN));

  it("brings an out-of-range stored speed back inside before moving", () =>
    expect(adjustScrollSpeed(150, -1)).toBe(29));
});
