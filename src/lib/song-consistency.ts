import { CAPO_MAX, shapeKey } from "@/lib/capo";
import { detectChordKeyPc, prefersFlats, relativeMajorPc, transposeKey, transposeText } from "@/lib/transpose";

export type SongEntry = { key: string; minor: boolean; capo: string; chords: string; lyrics: string };
export type SongConflict = { field: "chords" | "lyrics"; label: string; writtenKey: string; soundingKey: string; pc: number };
export type SongResolution = "key" | "capo" | "transpose" | "keep";

/** Suggestions only: chord analysis must never mutate an entry without a choice. */
export function checkSongConsistency(entry: SongEntry) {
  const key = entry.key + (entry.minor ? "m" : "");
  const capo = Number(entry.capo);
  const expectedShapes = shapeKey(key, capo);
  const expectedPc = relativeMajorPc(expectedShapes);
  const detected: { field: "chords" | "lyrics"; label: string; pc: number }[] = [];
  for (const field of ["chords", "lyrics"] as const) {
    const pc = detectChordKeyPc(entry[field]);
    if (pc !== null) detected.push({ field, label: field === "chords" ? "Chord progression" : "Lyrics", pc });
  }
  const conflicts: SongConflict[] = detected.filter(({ pc }) => pc !== expectedPc).map(({ field, label, pc }) => {
    const writtenKey = entry.minor ? transposeKey("Am", pc) : transposeKey("C", pc);
    return { field, label, pc, writtenKey, soundingKey: transposeKey(writtenKey, capo) };
  });
  const first = detected[0];
  const agree = first !== undefined && detected.every(({ pc }) => pc === first.pc);
  const commonKey = agree ? conflicts[0]?.soundingKey ?? null : null;
  const candidateCapo = agree ? (relativeMajorPc(key) - first.pc + 12) % 12 : null;
  const suggestedCapo = candidateCapo !== null && candidateCapo <= CAPO_MAX ? candidateCapo : null;
  const annotations = (["chords", "lyrics"] as const).flatMap((field) =>
    [...entry[field].matchAll(/\(capo\s+(\d+)\)/gi)]
      .filter((match) => Number(match[1]) !== capo)
      .map((match) => `${field === "chords" ? "Chord progression" : "Lyrics"} says capo ${match[1]}, but the selected capo is ${capo}.`),
  );
  return { conflicts, annotations, expectedShapes, suggestedKey: commonKey, suggestedCapo };
}

/** Return an updated copy only for the explicitly selected resolution. */
export function resolveSongConsistency<T extends SongEntry>(entry: T, resolution: SongResolution): T {
  if (resolution === "keep") return { ...entry };
  const check = checkSongConsistency(entry);
  if (resolution === "key" && check.suggestedKey) {
    const key = check.suggestedKey;
    return { ...entry, key: entry.minor ? key.slice(0, -1) : key };
  }
  if (resolution === "capo" && check.suggestedCapo !== null) {
    return { ...entry, capo: String(check.suggestedCapo) };
  }
  if (resolution !== "transpose") return { ...entry };
  const result = { ...entry };
  const targetPc = relativeMajorPc(check.expectedShapes);
  for (const conflict of check.conflicts) {
    result[conflict.field] = transposeText(entry[conflict.field], targetPc - conflict.pc, prefersFlats(check.expectedShapes));
  }
  for (const field of ["chords", "lyrics"] as const) {
    result[field] = result[field].replace(/\(capo\s+\d+\)/gi, `(capo ${entry.capo})`);
  }
  return result;
}