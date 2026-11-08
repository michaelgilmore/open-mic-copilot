// The "your key / your tempo" overrides a user can set on a song.
// A null value means "play it as written" (the original key/tempo).
export type KeyTempoDraft = {
  your_key: string | null;
  your_tempo: number | null;
  your_capo?: number | null;
};

// True when the draft differs from what is already stored for the song,
// i.e. the save button should be enabled.
export function hasUnsavedKeyOrTempo(saved: KeyTempoDraft, draft: KeyTempoDraft): boolean {
  return saved.your_key !== draft.your_key || saved.your_tempo !== draft.your_tempo || (saved.your_capo ?? null) !== (draft.your_capo ?? null);
}
