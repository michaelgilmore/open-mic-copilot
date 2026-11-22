import { describe, expect, it } from "vitest";
import { checkSongConsistency, resolveSongConsistency } from "@/lib/song-consistency";

const entry = { title: "How to Save a life", key: "G", minor: false, capo: "3", chords: "G D Em C", lyrics: "[G]words [D]more [Em]words [C]end", notes: "Keep this", tempo: "80" };

describe("new-song consistency choices", () => {
  it("flags G shapes with key G and capo 3 as sounding Bb (A#), without changing entries", () => {
    const before = { ...entry };
    const check = checkSongConsistency(entry);
    expect(check.conflicts).toHaveLength(2);
    expect(check.conflicts[0]?.soundingKey).toBe("Bb");
    expect(check.expectedShapes).toBe("E");
    expect(entry).toEqual(before);
  });
  it("can keep every entered value exactly", () => {
    expect(resolveSongConsistency(entry, "keep")).toEqual(entry);
  });
  it("can change only the sounding key to Bb", () => {
    expect(resolveSongConsistency(entry, "key")).toEqual({ ...entry, key: "Bb" });
  });
  it("can change only the capo to zero", () => {
    expect(resolveSongConsistency(entry, "capo")).toEqual({ ...entry, capo: "0" });
  });
  it("transposes both chart and lyric chords only when chosen", () => {
    expect(resolveSongConsistency(entry, "transpose")).toEqual({ ...entry, chords: "E B C#m A", lyrics: "[E]words [B]more [C#m]words [A]end" });
  });
  it("accepts Bb with G shapes and capo 3", () => {
    expect(checkSongConsistency({ ...entry, key: "Bb" }).conflicts).toEqual([]);
  });
  it("does not infer a key from just a starting G chord", () => {
    expect(checkSongConsistency({ ...entry, chords: "G", lyrics: "[G]words" }).conflicts).toEqual([]);
  });
  it("does not offer one key or capo when chart and lyrics disagree", () => {
    const check = checkSongConsistency({ ...entry, lyrics: "[F]words [C]more [Dm]words [Bb]end" });
    expect(check.suggestedKey).toBeNull();
    expect(check.suggestedCapo).toBeNull();
  });
  it("leaves mismatching capo annotations intact until text update is chosen", () => {
    const annotated = { ...entry, chords: "G D Em C (capo 1)" };
    expect(checkSongConsistency(annotated).annotations).toHaveLength(1);
    expect(resolveSongConsistency(annotated, "keep").chords).toBe(annotated.chords);
    expect(resolveSongConsistency(annotated, "transpose").chords).toBe("E B C#m A (capo 3)");
  });
});