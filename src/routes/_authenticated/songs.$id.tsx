import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Play, Pause, Pencil, Trash2, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSong, useSaveSong, useSong } from "@/lib/data";
import { setFlasherTempo } from "@/lib/tempo-store";
import { prefersFlats, stepsBetween, transposeKey, transposeText } from "@/lib/transpose";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_authenticated/songs/$id")({
  head: () => ({ meta: [{ title: "Song — Open Mic Copilot" }, { name: "description", content: "View and perform a song." }] }),
  component: SongView,
});

function SongView() {
  const { id } = Route.useParams();
  const { data: song, isLoading } = useSong(id);
  const save = useSaveSong();
  const del = useDeleteSong();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [fontSize, setFontSize] = useState(18);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => { if (song) setSpeed(song.scroll_speed); }, [song]);

  const flasherTempo = song ? (song.your_tempo ?? song.tempo) : null;
  useEffect(() => {
    setFlasherTempo(flasherTempo);
    return () => setFlasherTempo(null);
  }, [flasherTempo]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now(), acc = 0;
    const tick = (t: number) => {
      acc += ((t - last) / 1000) * speedRef.current;
      last = t;
      if (acc >= 1) {
        const px = Math.floor(acc);
        acc -= px;
        window.scrollBy(0, px);
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) { setPlaying(false); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (isLoading || !song) return <p className="text-muted-foreground">Loading…</p>;
  const yourKey = song.your_key ?? song.song_key;
  const steps = stepsBetween(song.song_key, yourKey);
  const flats = prefersFlats(yourKey);
  const yourTempo = song.your_tempo ?? song.tempo;

  function commitSpeed(v: number) {
    save.mutate({ id, values: { title: song!.title, scroll_speed: v } });
  }

  function changeKey(delta: number) {
    const next = transposeKey(yourKey, delta);
    save.mutate({ id, values: { title: song!.title, your_key: next === song!.song_key ? null : next } });
  }

  function resetKey() {
    save.mutate({ id, values: { title: song!.title, your_key: null } });
  }

  function changeTempo(delta: number) {
    const base = yourTempo ?? 120;
    const next = Math.min(300, Math.max(30, base + delta));
    save.mutate({ id, values: { title: song!.title, your_tempo: next === song!.tempo ? null : next } });
  }

  function resetTempo() {
    save.mutate({ id, values: { title: song!.title, your_tempo: null } });
  }

  async function remove() {
    if (!confirm(`Delete "${song!.title}"?`)) return;
    await del.mutateAsync(id);
    toast.success("Song deleted");
    navigate({ to: "/songs" });
  }

  return (
    <div className="pb-40">
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/songs" aria-label="Back"><ArrowLeft /></Link></Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{song.title}</h1>
          <p className="text-muted-foreground">
            {song.artist} · {yourKey}
            {song.your_key && song.your_key !== song.song_key ? ` (orig ${song.song_key})` : ""}
            {yourTempo ? ` · ${yourTempo} bpm` : ""}
            {song.your_tempo && song.tempo && song.your_tempo !== song.tempo ? ` (orig ${song.tempo})` : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="icon"><Link to="/edit/$id" params={{ id }} aria-label="Edit"><Pencil /></Link></Button>
        <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete"><Trash2 /></Button>
      </div>

      {song.notes && <p className="mt-4 rounded-lg border-l-4 border-primary bg-card px-4 py-3 text-sm">{song.notes}</p>}

      {song.chords && (
        <section className="mt-6">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Chords</h2>
          <pre className="mt-2 whitespace-pre-wrap font-mono font-semibold text-chord" style={{ fontSize }}>{transposeText(song.chords, steps, flats)}</pre>
        </section>
      )}
      <section className="mt-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lyrics</h2>
        <pre className="mt-2 whitespace-pre-wrap font-mono leading-relaxed" style={{ fontSize }}>
          {renderLyrics(transposeText(song.lyrics, steps, flats))}
        </pre>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => changeKey(-1)} aria-label="Key down half step"><Minus /></Button>
            <div className="w-16 text-center">
              <div className="font-mono text-lg font-semibold text-chord">{yourKey}</div>
              <div className="text-[10px] text-muted-foreground">{steps === 0 ? "original" : `${steps > 0 ? "+" : ""}${steps} from ${song.song_key}`}</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeKey(1)} aria-label="Key up half step"><Plus /></Button>
            {steps !== 0 && <Button variant="ghost" size="icon" onClick={resetKey} aria-label="Reset key"><RotateCcw /></Button>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => changeTempo(-1)} aria-label="Tempo down"><Minus /></Button>
            <div className="w-20 text-center">
              <div className="font-mono text-lg font-semibold">{yourTempo ?? "—"}</div>
              <div className="text-[10px] text-muted-foreground">{song.your_tempo && song.tempo && song.your_tempo !== song.tempo ? `orig ${song.tempo}` : "bpm"}</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeTempo(1)} aria-label="Tempo up"><Plus /></Button>
            {song.your_tempo && song.your_tempo !== song.tempo && <Button variant="ghost" size="icon" onClick={resetTempo} aria-label="Reset tempo"><RotateCcw /></Button>}
          </div>
          <div className="flex min-w-[220px] flex-1 items-center gap-3">
            <Button size="icon" className="size-11 rounded-full" onClick={() => setPlaying(!playing)} aria-label={playing ? "Stop scrolling" : "Start scrolling"}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Scroll speed {speed}</div>
              <Slider min={5} max={150} step={1} value={[speed]} onValueChange={(v) => setSpeed(v[0] ?? speed)} onValueCommit={(v) => commitSpeed(v[0] ?? speed)} aria-label="Scroll speed" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A−</Button>
            <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>A+</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderLyrics(text: string) {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith("[") ? <span key={i} className="font-semibold text-chord">{part.slice(1, -1)}</span> : part,
  );
}
