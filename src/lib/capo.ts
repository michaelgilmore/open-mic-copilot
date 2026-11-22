import { stepsBetween, transposeKey, transposeText, prefersFlats, detectChordKeyPc, relativeMajorPc } from "@/lib/transpose";

/** Capo choices offered in the app: 0 means no capo. */
export const CAPO_MAX = 10;

export function clampCapo(n: number): number {
  return Math.min(CAPO_MAX, Math.max(0, Math.round(n) || 0));
}

export function originalCapo(capo: number | null, chords: string): number {
  const annotated = Number(chords.match(/\(capo\s+(\d+)\)/i)?.[1] ?? 0);
  return clampCapo(capo ?? annotated);
}

/** Key of the chord shapes you finger for a sounding key at a given capo. */
export function shapeKey(soundingKey: string, capo: number): string {
  return transposeKey(soundingKey, -capo);
}

export function capoChordSteps(originalKey: string, targetKey: string, original: number, selected: number): number {
  return stepsBetween(originalKey, targetKey) + original - selected;
}

export function capoChordText(text: string, originalKey: string, targetKey: string, original: number, selected: number): string {
  // Opening a song at its saved settings is not permission to normalize its text.
  if (stepsBetween(originalKey, targetKey) === 0 && original === selected) return text;
  let steps = capoChordSteps(originalKey, targetKey, original, selected);
  // Confirm the chords in the text really are in the shapes the app expects.
  // If they are written in another key, transpose from what is actually written.
  const written = detectChordKeyPc(text);
  const expected = relativeMajorPc(shapeKey(originalKey, original));
  const target = relativeMajorPc(shapeKey(targetKey, selected));
  if (written != null && expected >= 0 && target >= 0 && written !== expected) {
    let d = (target - written) % 12;
    if (d > 6) d -= 12;
    if (d < -6) d += 12;
    steps = d;
  }
  return transposeText(text, steps, prefersFlats(shapeKey(targetKey, selected))).replace(/\(capo\s+\d+\)/gi, `(capo ${selected})`);
}
