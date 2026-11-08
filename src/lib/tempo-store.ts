import { useSyncExternalStore } from "react";

// Tiny module-level store holding the tempo (bpm) of the song being viewed,
// so the header tempo flasher can pulse at the right rate from anywhere.
let tempo: number | null = null;
const listeners = new Set<() => void>();

export function setFlasherTempo(bpm: number | null) {
  tempo = bpm;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return tempo;
}

export function useFlasherTempo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
