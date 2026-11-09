export function replacementCandidates<T extends { id: string }>(
  songs: readonly T[],
  items: readonly { song: { id: string } | null }[],
): T[] {
  const usedIds = new Set(items.map((item) => item.song?.id));
  return songs.filter((song) => !usedIds.has(song.id));
}

export function pickRandomReplacement<T>(songs: readonly T[]): T | undefined {
  return songs.length ? songs[Math.floor(Math.random() * songs.length)] : undefined;
}