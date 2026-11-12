// Position of a song inside a setlist, used to offer "next song" while performing.

export type SetlistNavItem = {
  id: string;
  song?: { id: string; title: string; artist?: string | null } | null;
};

export type SetlistNavigation<T extends SetlistNavItem> = {
  /** Position among the items that actually resolve to a song. */
  index: number;
  total: number;
  current: T;
  next: T | null;
  previous: T | null;
};

export function setlistNavigation<T extends SetlistNavItem>(
  items: T[],
  songId: string,
): SetlistNavigation<T> | null {
  const withSongs = items.filter((item) => item.song);
  const index = withSongs.findIndex((item) => item.song?.id === songId);
  if (index === -1) return null;
  return {
    index,
    total: withSongs.length,
    current: withSongs[index] as T,
    next: withSongs[index + 1] ?? null,
    previous: withSongs[index - 1] ?? null,
  };
}
