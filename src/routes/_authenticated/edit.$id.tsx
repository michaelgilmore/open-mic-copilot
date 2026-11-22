import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSaveSong, useSong } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { originalCapo, shapeKey, capoChordText, CAPO_MAX } from "@/lib/capo";
import { checkSongConsistency, resolveSongConsistency, type SongResolution } from "@/lib/song-consistency";
import { SongConsistencyDialog } from "@/components/SongConsistencyDialog";

export const Route = createFileRoute("/_authenticated/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Song — Open Mic Copilot" }, { name: "description", content: "Add or edit lyrics, chords, original key, tempo and capo." }, { property: "og:title", content: "Edit Song — Open Mic Copilot" }, { property: "og:description", content: "Manage your song's original key, capo and chord chart." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: EditSong,
});

const KEYS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];

function EditSong() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { data: song } = useSong(id);
  const save = useSaveSong();
  const [f, setF] = useState({ title: "", artist: "", key: "C", minor: false, tempo: "", capo: "0", chords: "", lyrics: "", notes: "" });
  const [showConflict, setShowConflict] = useState(false);

  useEffect(() => {
    if (song) {
      const minor = song.song_key.endsWith("m");
      setF({
        title: song.title, artist: song.artist, key: minor ? song.song_key.slice(0, -1) : song.song_key, minor,
        tempo: song.tempo?.toString() ?? "", capo: String(originalCapo(song.capo, song.chords)), chords: song.chords, lyrics: song.lyrics, notes: song.notes,
      });
    }
  }, [song]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const check = checkSongConsistency(f);
    if (isNew && (check.conflicts.length || check.annotations.length)) {
      setShowConflict(true);
      return;
    }
    await persist(f);
  }

  async function persist(values: typeof f) {
    try {
      const saved = await save.mutateAsync({
        id: isNew ? undefined : id,
        values: {
          title: values.title, artist: values.artist, song_key: values.key + (values.minor ? "m" : ""),
          tempo: values.tempo ? parseInt(values.tempo, 10) : null, capo: Number(values.capo), chords: values.chords, lyrics: values.lyrics, notes: values.notes,
        },
      });
      toast.success("Saved");
      navigate({ to: "/songs/$id", params: { id: saved.id } });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function resolve(resolution: SongResolution) {
    const next = resolveSongConsistency(f, resolution);
    setF(next);
    // Key/capo choices may leave a conflicting literal annotation; review it again.
    const remaining = checkSongConsistency(next);
    if (resolution !== "keep" && (remaining.conflicts.length || remaining.annotations.length)) return;
    await persist(next);
  }

  const select = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-3xl font-extrabold">{isNew ? "New song" : "Edit song"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="t">Title</Label><Input id="t" required value={f.title} onChange={set("title")} /></div>
        <div><Label htmlFor="a">Artist</Label><Input id="a" value={f.artist} onChange={set("artist")} /></div>
        <div>
          <Label>Original sounding key</Label>
          <div className="flex gap-2">
            <select className={select} value={f.key} onChange={set("key")} aria-label="Key">
              {KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <select className={select} value={f.minor ? "m" : ""} onChange={(e) => setF({ ...f, minor: e.target.value === "m" })} aria-label="Major or minor">
              <option value="">Major</option><option value="m">Minor</option>
            </select>
          </div>
        </div>
        <div><Label htmlFor="bpm">Tempo (BPM)</Label><Input id="bpm" type="number" min={20} max={300} value={f.tempo} onChange={set("tempo")} /></div>
        <div>
          <Label htmlFor="capo">Original chord-chart capo</Label>
          <select id="capo" className={select + " w-full"} value={f.capo} onChange={(e) => {
            if (isNew) {
              setF({ ...f, capo: e.target.value });
              return;
            }
            // Keep the sounding key: rewrite chord shapes in the chart and lyrics for the new capo.
            const key = f.key + (f.minor ? "m" : "");
            const from = Number(f.capo), to = Number(e.target.value);
            setF({ ...f, capo: e.target.value, chords: capoChordText(f.chords, key, key, from, to), lyrics: capoChordText(f.lyrics, key, key, from, to) });
          }}>
            <option value="0">No capo</option>
            {Array.from({ length: CAPO_MAX }, (_, i) => i + 1).map((n) => <option key={n} value={String(n)}>{n}</option>)}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Chart shapes: {shapeKey(f.key + (f.minor ? "m" : ""), Number(f.capo))}{Number(f.capo) ? ` with capo ${f.capo}` : ""}</p>
        </div>
      </div>
      <div>
        <Label htmlFor="c">Chord progression</Label>
        <Textarea id="c" rows={4} className="font-mono" placeholder={"Verse: G  D  Em  C\nChorus: C  G  D"} value={f.chords} onChange={set("chords")} />
      </div>
      <div>
        <Label htmlFor="l">Lyrics</Label>
        <p className="mb-1 text-xs text-muted-foreground">Tip: put chords on their own line above the words, or inline like [G]Amazing — both will change key.</p>
        <Textarea id="l" rows={14} className="font-mono" value={f.lyrics} onChange={set("lyrics")} />
      </div>
      <div><Label htmlFor="n">Notes</Label><Textarea id="n" rows={3} placeholder="Capo 2, fingerpick intro…" value={f.notes} onChange={set("notes")} /></div>
      <div className="flex gap-3">
        <Button disabled={save.isPending}>Save song</Button>
        <Button type="button" variant="ghost" onClick={() => history.back()}>Cancel</Button>
      </div>
      <SongConsistencyDialog open={showConflict} entry={f} pending={save.isPending} onClose={() => setShowConflict(false)} onResolve={resolve} />
    </form>
  );
}
