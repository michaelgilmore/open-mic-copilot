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
      const withBrackets = line.replace(/\[([^\]]+)\]/g, (all, c) => (CHORD_TOKEN.test(c) ? `[${transposeChord(c, steps, preferFlats)}]` : all));
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

/** Every chord symbol transposeText would change: [bracket] chords and tokens on chord-only lines. */
export function chordTokens(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(/\[([^\]]+)\]/g)) if (m[1] && CHORD_TOKEN.test(m[1])) out.push(m[1]);
    const chordLine = line.replace(/\([^)]*\)/g, "").replace(/^\s*[A-Za-z][\w ]*:\s*/, "");
    const tokens = chordLine.trim().split(/[\s|]+/).filter(Boolean);
    if (tokens.length && tokens.some((t) => CHORD_TOKEN.test(t)) && tokens.every((t) => CHORD_TOKEN.test(t) || t === "-" || /^x\d$/.test(t))) {
      out.push(...tokens.filter((t) => CHORD_TOKEN.test(t)));
    }
  }
  return out;
}

/** Pitch class (0–11) of a key's relative major, or -1 when unparseable. */
export function relativeMajorPc(key: string): number {
  const m = key.match(/^([A-G][#b]?)(m(?!aj))?/);
  if (!m || !m[1]) return -1;
  const i = noteIndex(m[1]);
  return i < 0 ? -1 : (i + (m[2] ? 3 : 0)) % 12;
}

/**
 * Guess the key the chords in a text are written in, as a relative-major pitch class.
 * Returns null when there are too few chords to tell.
 */
export function detectChordKeyPc(text: string): number | null {
  const chords = chordTokens(text);
  if (chords.length < 3) return null;
  const parsed = chords.map((c) => {
    const m = c.match(/^([A-G][#b]?)(m(?!aj)|dim)?/);
    return { pc: noteIndex(m?.[1] ?? ""), minor: m?.[2] === "m" };
  }).filter((c) => c.pc >= 0);
  // Major-key degrees: I ii iii IV V vi, plus bVII.
  const degrees: [number, boolean][] = [[0, false], [2, true], [4, true], [5, false], [7, false], [9, true], [10, false]];
  let best: number | null = null, bestScore = -1;
  for (let t = 0; t < 12; t++) {
    let score = 0;
    for (const c of parsed) {
      const d = degrees.find(([o, mi]) => (t + o) % 12 === c.pc && mi === c.minor);
      if (d) score += d[0] === 10 ? 0.5 : 1;
    }
    const first = parsed[0];
    if (first && (first.pc === t && !first.minor || first.pc === (t + 9) % 12 && first.minor)) score += 0.75;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}
