const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"]);

function noteIndex(n: string): number {
  const i = SHARPS.indexOf(n);
  return i >= 0 ? i : FLATS.indexOf(n);
}

export function transposeNote(note: string, steps: number, preferFlats = false): string {
  const i = noteIndex(note);
  if (i < 0) return note;
  const j = (((i + steps) % 12) + 12) % 12;
  return (preferFlats ? FLATS : SHARPS)[j] ?? note;
}

/** Transpose a chord symbol like "F#m7/C#". */
export function transposeChord(chord: string, steps: number, preferFlats = false): string {
  return chord.replace(/([A-G][#b]?)/g, (m) => transposeNote(m, steps, preferFlats));
}

export function transposeKey(key: string, steps: number): string {
  const m = key.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return key;
  const root = m[1];
  if (!root) return key;
  const rest = m[2] ?? "";
  const target = transposeNote(root, steps, false);
  const flat = transposeNote(root, steps, true);
  // prefer conventional spelling
  const pick = FLAT_KEYS.has(flat + rest) || ["Bb", "Eb", "Ab", "Db"].includes(flat) ? flat : target;
  return pick + rest;
}

export function prefersFlats(key: string): boolean {
  return FLAT_KEYS.has(key) || /^[A-G]b/.test(key);
}

/** Half steps from one key to another, in [-6, 6]. Returns 0 when either key is unparseable. */
export function stepsBetween(fromKey: string, toKey: string): number {
  const from = fromKey.match(/^([A-G][#b]?)/);
  const to = toKey.match(/^([A-G][#b]?)/);
  if (!from || !to) return 0;
  const fromRoot = from[1];
  const toRoot = to[1];
  if (!fromRoot || !toRoot) return 0;
  const a = noteIndex(fromRoot);
  const b = noteIndex(toRoot);
  if (a < 0 || b < 0) return 0;
  let d = (b - a) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

const CHORD_TOKEN =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus|add)?\d*(sus\d|add\d|maj\d|b\d|#\d)*(\/[A-G][#b]?)?$/;

/** Transpose a chord sheet. Bracketed chords [Am] always; whole lines only if every token is a chord. */
export function transposeText(text: string, steps: number, preferFlats = false): string {
  if (!steps) return text;
  return text
    .split("\n")
    .map((line) => {
      const withBrackets = line.replace(/\[([^\]]+)\]/g, (_, c) => `[${transposeChord(c, steps, preferFlats)}]`);
      // Capo annotations describe the guitar setup, not chord tokens.
      // Ignore them when recognizing a chord line, but preserve them verbatim.
      // Also ignore section labels ("Verse:") and parenthetical notes ("(open tuning)").
      const chordLine = line.replace(/\([^)]*\)/g, "").replace(/^\s*[A-Za-z][\w ]*:\s*/, "");
      const tokens = chordLine.trim().split(/[\s|]+/).filter(Boolean);
      if (tokens.length && tokens.some((t) => CHORD_TOKEN.test(t)) && tokens.every((t) => CHORD_TOKEN.test(t) || t === "-" || /^x\d$/.test(t))) {
        const label = line.match(/^\s*[A-Za-z][\w ]*:\s*/)?.[0] ?? "";
        return label + line.slice(label.length).replace(/\([^)]*\)|[^\s|()]+/g, (t) => (CHORD_TOKEN.test(t) ? transposeChord(t, steps, preferFlats) : t));
      }
      return withBrackets;
    })
    .join("\n");
}
