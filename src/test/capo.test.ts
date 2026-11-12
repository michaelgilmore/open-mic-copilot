import { describe, it, expect } from "vitest";
import { originalCapo, capoChordSteps, capoChordText, shapeKey } from "@/lib/capo";

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
describe("capo review fixes", () => {
  it("transposes labelled chord lines", () =>
    expect(capoChordText("Verse: G  D  Em  C", "G", "A", 0, 0)).toBe("Verse: A  E  F#m  D"));
  it("transposes lines with parenthetical notes", () =>
    expect(capoChordText("C# F# (open tuning)", "C#", "D", 0, 0)).toBe("D G (open tuning)"));
  it("Free Fallin' in F with capo 3 shows D shapes", () => expect(shapeKey("F", 3)).toBe("D"));
  it("capo is limited to 10", () => expect(originalCapo(12, "")).toBe(10));
  it("raising capo 3 to 5 keeps F sounding with C shapes", () =>
    expect(capoChordText("D Dsus4 D A (capo 3)", "F", "F", 3, 5)).toBe("C Csus4 C G (capo 5)"));
});

describe("changing the chart capo on the edit screen", () => {
  it("keeps Perfect sounding in Ab: G shapes at capo 1 become Ab shapes at no capo", () => {
    expect(capoChordText("G Em C D (capo 1)", "Ab", "Ab", 1, 0)).toBe("Ab Fm Db Eb (capo 0)");
  });
});

describe("text chords written in a different key than the song", () => {
  const lyrics = "F  C\nwords\nDm  A#\nmore\nF C Dm A#";
  it("By And By: A with capo 2 shows G shapes even when lyrics were written in F", () =>
    expect(capoChordText(lyrics, "A", "A", 2, 2)).toBe("G  D\nwords\nEm  C\nmore\nG D Em C"));
  it("matching text is unchanged", () =>
    expect(capoChordText("G D Em C", "A", "A", 2, 2)).toBe("G D Em C"));
  it("no capo on By And By gives A shapes for mismatched lyrics", () =>
    expect(capoChordText(lyrics, "A", "A", 2, 0)).toBe("A  E\nwords\nF#m  D\nmore\nA E F#m D"));
});
