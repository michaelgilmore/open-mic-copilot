import { describe, it, expect } from "vitest";
import { originalCapo, capoChordSteps, capoChordText } from "@/lib/capo";

describe("capo-aware chord shapes", () => {
  it("Perfect is Ab with G shapes at capo 1", () => {
    expect(originalCapo(null, "G Em C D (capo 1)")).toBe(1);
    expect(capoChordSteps("Ab", "Ab", 1, 1)).toBe(0);
    expect(capoChordText("G Em C D (capo 1)", "Ab", "Ab", 1, 1)).toBe("G Em C D (capo 1)");
  });
  it("uses Ab shapes without a capo while keeping Perfect in Ab", () => {
    expect(capoChordText("G Em C D (capo 1)", "Ab", "Ab", 1, 0)).toBe("Ab Fm Db Eb (capo 0)");
  });
  it("uses Gb shapes at capo 2 while keeping Perfect in Ab", () => {
    expect(capoChordText("G Em C D (capo 1)", "Ab", "Ab", 1, 2)).toBe("Gb Ebm B Db (capo 2)");
  });
  it("changing the sounding key to A at capo 2 keeps G shapes", () => {
    expect(capoChordText("G Em C D (capo 1)", "Ab", "A", 1, 2)).toBe("G Em C D (capo 2)");
  });
  it("transposes lyric chords using the selected capo", () => {
    expect(capoChordText("[G]words\nEm C D", "Ab", "Ab", 1, 0)).toBe("[Ab]words\nFm Db Eb");
  });
  it("an explicit original capo overrides an old annotation", () => {
    expect(originalCapo(0, "G Em (capo 1)")).toBe(0);
  });
});