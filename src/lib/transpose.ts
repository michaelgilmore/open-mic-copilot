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
  return (preferFlats ? FLATS : SHARPS)[j]!;
}

/** Transpose a chord symbol like "F#m7/C#". */
export function transposeChord(chord: string, steps: number, preferFlats = false): string {
  return chord.replace(/([A-G][#b]?)/g, (m) => transposeNote(m, steps, preferFlats));
}

export function transposeKey(key: string, steps: number): string {
  const m = key.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return key;
  const root = m[1]!;
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

const CHORD_TOKEN =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus|add)?\d*(sus\d|add\d|maj\d|b\d|#\d)*(\/[A-G][#b]?)?$/;

/** Transpose a chord sheet. Bracketed chords [Am] always; whole lines only if every token is a chord. */
export function transposeText(text: string, steps: number, preferFlats = false): string {
  if (!steps) return text;
  return text
    .split("\n")
    .map((line) => {
      const withBrackets = line.replace(/\[([^\]]+)\]/g, (_, c) => `[${transposeChord(c, steps, preferFlats)}]`);
      const tokens = line.trim().split(/[\s|]+/).filter(Boolean);
      if (tokens.length && tokens.every((t) => CHORD_TOKEN.test(t) || t === "-" || /^x\d$/.test(t))) {
        return line.replace(/\S+/g, (t) => (CHORD_TOKEN.test(t) ? transposeChord(t, steps, preferFlats) : t));
      }
      return withBrackets;
    })
    .join("\n");
}
