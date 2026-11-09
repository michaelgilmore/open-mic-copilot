import { describe, expect, it, vi } from "vitest";
import { pickRandomReplacement, replacementCandidates } from "@/lib/setlist-replacement";

describe("setlist song replacement", () => {
  const songs = [{ id: "current" }, { id: "other-in-set" }, { id: "new-a" }, { id: "new-b" }];
  it("offers another database song without duplicating the setlist", () => {
    expect(replacementCandidates(songs, [{ song: { id: "current" } }, { song: { id: "other-in-set" } }]))
      .toEqual([{ id: "new-a" }, { id: "new-b" }]);
  });
  it("picks a random available song from the entire candidate pool", () => {
    const candidates = songs.slice(2);
    const random = vi.spyOn(Math, "random");
    try {
      random.mockReturnValue(0);
      expect(pickRandomReplacement(candidates)).toEqual({ id: "new-a" });
      random.mockReturnValue(0.999);
      expect(pickRandomReplacement(candidates)).toEqual({ id: "new-b" });
    } finally {
      random.mockRestore();
    }
  });
  it("does not pick a song when none are available", () => {
    expect(pickRandomReplacement([])).toBeUndefined();
  });
});