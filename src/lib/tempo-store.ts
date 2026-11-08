import { useSyncExternalStore } from "react";

// Tiny module-level store holding the tempo (bpm) of the song being viewed,
// plus a temporary override set from the header flasher, so the flasher can
// pulse at the right rate from anywhere.
type FlasherState = { tempo: number | null; override: number | null };

let state: FlasherState = { tempo: null, override: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setFlasherTempo(bpm: number | null) {
  state = { tempo: bpm, override: null };
  emit();
}

export function adjustFlasherOverride(delta: number) {
  const base = state.override ?? state.tempo;
  if (base == null) return;
  state = { ...state, override: Math.min(300, Math.max(30, base + delta)) };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useFlasherState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({ tempo: null, override: null }));
}
