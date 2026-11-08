import { describe, it, expect } from "vitest";
import { hasUnsavedKeyOrTempo } from "@/lib/song-draft";

describe("hasUnsavedKeyOrTempo", () => {
  it("is dirty when the capo changes", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null, your_capo: null }, { your_key: null, your_tempo: null, your_capo: 2 })).toBe(true));
  it("is dirty when a personal capo is reset", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null, your_capo: 0 }, { your_key: null, your_tempo: null, your_capo: null })).toBe(true));
  it("is not dirty when the saved capo matches", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null, your_capo: 1 }, { your_key: null, your_tempo: null, your_capo: 1 })).toBe(false));
  it("is not dirty when nothing is set", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null }, { your_key: null, your_tempo: null })).toBe(false));
  it("is dirty when the key changes", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null }, { your_key: "Gm", your_tempo: null })).toBe(true));
  it("is dirty when the tempo changes", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: null, your_tempo: null }, { your_key: null, your_tempo: 88 })).toBe(true));
  it("is not dirty when both match what is stored", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: "Gm", your_tempo: 88 }, { your_key: "Gm", your_tempo: 88 })).toBe(false));
  it("is dirty when a stored key is cleared", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: "Gm", your_tempo: null }, { your_key: null, your_tempo: null })).toBe(true));
  it("is dirty when only the stored tempo is cleared", () =>
    expect(hasUnsavedKeyOrTempo({ your_key: "Gm", your_tempo: 88 }, { your_key: "Gm", your_tempo: null })).toBe(true));
});
