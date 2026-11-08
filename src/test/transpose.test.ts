import { describe, it, expect } from "vitest";
import { transposeChord, transposeKey, transposeText } from "@/lib/transpose";

describe("transpose by half steps", () => {
  it("moves G up one half step to G#", () => expect(transposeChord("G", 1)).toBe("G#"));
  it("moves C down one half step to B", () => expect(transposeChord("C", -1)).toBe("B"));
  it("handles slash chords", () => expect(transposeChord("D/F#", 2)).toBe("E/G#"));
  it("transposes a chord line", () => expect(transposeText("G  C  D  Em", 2)).toBe("A  D  E  F#m"));
  it("leaves lyric lines alone but transposes [bracket] chords", () =>
    expect(transposeText("A[G]mazing grace", 2)).toBe("A[A]mazing grace"));
  it("key C up 3 is Eb", () => expect(transposeKey("C", 3)).toBe("Eb"));
});
