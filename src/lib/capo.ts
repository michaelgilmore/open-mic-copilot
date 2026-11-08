import { stepsBetween, transposeKey, transposeText, prefersFlats } from "@/lib/transpose";

export function originalCapo(capo: number | null, chords: string): number {
  const annotated = Number(chords.match(/\(capo\s+(\d+)\)/i)?.[1] ?? 0);
  return Math.min(12, Math.max(0, capo ?? annotated));
}

export function capoChordSteps(originalKey: string, targetKey: string, original: number, selected: number): number {
  return stepsBetween(originalKey, targetKey) + original - selected;
}

export function capoChordText(text: string, originalKey: string, targetKey: string, original: number, selected: number): string {
  const steps = capoChordSteps(originalKey, targetKey, original, selected);
  const shapeKey = transposeKey(targetKey, -selected);
  return transposeText(text, steps, prefersFlats(shapeKey)).replace(/\(capo\s+\d+\)/gi, `(capo ${selected})`);
}