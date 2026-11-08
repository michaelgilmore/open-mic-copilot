import { describe, it, expect } from "vitest";
import { stepsBetween, transposeChord, transposeKey, transposeText } from "@/lib/transpose";

describe("transpose by half steps", () => {
  it("moves G up one half step to G#", () => expect(transposeChord("G", 1)).toBe("G#"));
  it("moves C down one half step to B", () => expect(transposeChord("C", -1)).toBe("B"));
  it("handles slash chords", () => expect(transposeChord("D/F#", 2)).toBe("E/G#"));
  it("transposes a chord line", () => expect(transposeText("G  C  D  Em", 2)).toBe("A  D  E  F#m"));
  it("leaves lyric lines alone but transposes [bracket] chords", () =>
    expect(transposeText("A[G]mazing grace", 2)).toBe("A[A]mazing grace"));
  it("key C up 3 is Eb", () => expect(transposeKey("C", 3)).toBe("Eb"));
});

describe("stepsBetween", () => {
  it("C to D is 2", () => expect(stepsBetween("C", "D")).toBe(2));
  it("G to E is -3", () => expect(stepsBetween("G", "E")).toBe(-3));
  it("keeps minor suffixes out of the math", () => expect(stepsBetween("Am", "Cm")).toBe(3));
  it("wraps the short way: B to C is 1", () => expect(stepsBetween("B", "C")).toBe(1));
  it("enharmonics match: C to Db is 1", () => expect(stepsBetween("C", "Db")).toBe(1));
  it("unparseable keys give 0", () => expect(stepsBetween("?", "C")).toBe(0));
});
