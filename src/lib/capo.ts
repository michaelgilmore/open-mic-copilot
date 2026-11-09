import { stepsBetween, transposeKey, transposeText, prefersFlats } from "@/lib/transpose";

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
  const steps = capoChordSteps(originalKey, targetKey, original, selected);
  return transposeText(text, steps, prefersFlats(shapeKey(targetKey, selected))).replace(/\(capo\s+\d+\)/gi, `(capo ${selected})`);
}
