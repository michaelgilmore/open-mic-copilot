import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSaveSong, useSong } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Song — Open Mic Copilot" }, { name: "description", content: "Add or edit a song." }] }),
  component: EditSong,
});

const KEYS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];

function EditSong() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { data: song } = useSong(id);
  const save = useSaveSong();
  const [f, setF] = useState({ title: "", artist: "", key: "C", minor: false, tempo: "", chords: "", lyrics: "", notes: "" });

  useEffect(() => {
    if (song) {
      const minor = song.song_key.endsWith("m");
      setF({
        title: song.title, artist: song.artist, key: minor ? song.song_key.slice(0, -1) : song.song_key, minor,
        tempo: song.tempo?.toString() ?? "", chords: song.chords, lyrics: song.lyrics, notes: song.notes,
      });
    }
  }, [song]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const saved = await save.mutateAsync({
        id: isNew ? undefined : id,
        values: {
          title: f.title.trim(), artist: f.artist.trim(), song_key: f.key + (f.minor ? "m" : ""),
          tempo: f.tempo ? parseInt(f.tempo, 10) : null, chords: f.chords, lyrics: f.lyrics, notes: f.notes,
        },
      });
      toast.success("Saved");
      navigate({ to: "/songs/$id", params: { id: saved.id } });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const select = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-3xl font-extrabold">{isNew ? "New song" : "Edit song"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="t">Title</Label><Input id="t" required value={f.title} onChange={set("title")} /></div>
        <div><Label htmlFor="a">Artist</Label><Input id="a" value={f.artist} onChange={set("artist")} /></div>
        <div>
          <Label>Key</Label>
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
    </form>
  );
}
