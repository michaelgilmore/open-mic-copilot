import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Play, Pause, Pencil, Trash2, RotateCcw, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSong, useSaveSong, useSong } from "@/lib/data";
import { setFlasherTempo } from "@/lib/tempo-store";
import { stepsBetween, transposeKey } from "@/lib/transpose";
import { originalCapo, capoChordText } from "@/lib/capo";
import { hasUnsavedKeyOrTempo, type KeyTempoDraft } from "@/lib/song-draft";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/songs/$id")({
  head: () => ({ meta: [{ title: "Song — Open Mic Copilot" }, { name: "description", content: "Perform with lyrics, chord shapes, capo, key and tempo settings." }, { property: "og:title", content: "Song — Open Mic Copilot" }, { property: "og:description", content: "Your song's lyrics, capo-aware chords and performance settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
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
  // Pending key/tempo edits — only written to the song when Save is pressed.
  const [draft, setDraft] = useState<KeyTempoDraft>({ your_key: null, your_tempo: null, your_capo: null });
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!song) return;
    setSpeed(song.scroll_speed);
    setDraft({ your_key: song.your_key ?? null, your_tempo: song.your_tempo ?? null, your_capo: song.your_capo ?? null });
  }, [song]);

  const flasherTempo = song ? (draft.your_tempo ?? song.tempo) : null;
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

  const currentSong = song;
  const stored: KeyTempoDraft = { your_key: song.your_key ?? null, your_tempo: song.your_tempo ?? null, your_capo: song.your_capo ?? null };
  const dirty = hasUnsavedKeyOrTempo(stored, draft);
  const yourKey = draft.your_key ?? song.song_key;
  const steps = stepsBetween(song.song_key, yourKey);
  const baseCapo = originalCapo(song.capo, song.chords);
  const yourCapo = draft.your_capo ?? baseCapo;
  const yourTempo = draft.your_tempo ?? song.tempo;

  function commitSpeed(v: number) {
    save.mutate({ id, values: { title: currentSong.title, scroll_speed: v } });
  }

  function changeSpeed(delta: number) {
    const next = Math.min(150, Math.max(5, speed + delta));
    setSpeed(next);
    commitSpeed(next);
  }

  function changeKey(delta: number) {
    setDraft((d) => {
      const current = d.your_key ?? currentSong.song_key;
      const next = transposeKey(current, delta);
      return { ...d, your_key: next === currentSong.song_key ? null : next };
    });
  }

  function resetKey() {
    setDraft((d) => ({ ...d, your_key: null }));
  }

  function changeTempo(delta: number) {
    setDraft((d) => {
      const base = d.your_tempo ?? currentSong.tempo ?? 120;
      const next = Math.min(300, Math.max(30, base + delta));
      return { ...d, your_tempo: next === currentSong.tempo ? null : next };
    });
  }

  function resetTempo() {
    setDraft((d) => ({ ...d, your_tempo: null }));
  }

  function changeCapo(delta: number) {
    setDraft((d) => {
      const next = Math.min(12, Math.max(0, (d.your_capo ?? baseCapo) + delta));
      return { ...d, your_capo: next === baseCapo ? null : next };
    });
  }

  async function saveChanges() {
    if (!dirty || save.isPending) return;
    try {
      await save.mutateAsync({
        id,
        values: { title: currentSong.title, your_key: draft.your_key, your_tempo: draft.your_tempo, your_capo: draft.your_capo ?? null },
      });
      toast.success("Saved key, tempo & capo");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${currentSong.title}"?`)) return;
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
            {steps !== 0 ? ` (orig ${song.song_key})` : ""}
            {yourTempo ? ` · ${yourTempo} bpm` : ""}
            {yourTempo && song.tempo && yourTempo !== song.tempo ? ` (orig ${song.tempo})` : ""}
            {` · Capo ${yourCapo}`}
          </p>
        </div>
        <Button asChild variant="outline" size="icon"><Link to="/edit/$id" params={{ id }} aria-label="Edit"><Pencil /></Link></Button>
        <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete"><Trash2 /></Button>
      </div>

      {song.notes && <p className="mt-4 rounded-lg border-l-4 border-primary bg-card px-4 py-3 text-sm">{song.notes}</p>}

      {song.chords && (
        <section className="sticky top-[60px] z-10 -mx-4 mt-6 border-b border-border bg-background/95 px-4 pb-3 backdrop-blur">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Chords · Capo {yourCapo}</h2>
          <pre className="mt-2 whitespace-pre-wrap font-mono font-semibold text-chord" style={{ fontSize }}>{capoChordText(song.chords, song.song_key, yourKey, baseCapo, yourCapo)}</pre>
        </section>
      )}
      <section className="mt-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lyrics</h2>
        <pre className="mt-2 whitespace-pre-wrap font-mono leading-relaxed" style={{ fontSize }}>
          {renderLyrics(capoChordText(song.lyrics, song.song_key, yourKey, baseCapo, yourCapo))}
        </pre>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => changeKey(-1)} aria-label="Key down half step"><Minus /></Button>
            <div className="w-16 text-center">
              <div className="font-mono text-lg font-semibold text-chord">{yourKey}</div>
              <div className="text-[10px] text-muted-foreground">{steps === 0 ? "key · original" : `${steps > 0 ? "+" : ""}${steps} from ${song.song_key}`}</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeKey(1)} aria-label="Key up half step"><Plus /></Button>
            {steps !== 0 && <Button variant="ghost" size="icon" onClick={resetKey} aria-label="Reset key"><RotateCcw /></Button>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => changeCapo(-1)} disabled={yourCapo === 0} aria-label="Capo down"><Minus /></Button>
            <div className="w-12 text-center">
              <div className="font-mono text-lg font-semibold">{yourCapo}</div>
              <div className="text-[10px] text-muted-foreground">{yourCapo === baseCapo ? "capo" : `orig ${baseCapo}`}</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeCapo(1)} disabled={yourCapo === 12} aria-label="Capo up"><Plus /></Button>
            {draft.your_capo != null && <Button variant="ghost" size="icon" onClick={() => setDraft((d) => ({ ...d, your_capo: null }))} aria-label="Reset capo"><RotateCcw /></Button>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" onClick={() => changeTempo(-1)} aria-label="Tempo down"><Minus /></Button>
            <div className="w-20 text-center">
              <div className="font-mono text-lg font-semibold">{yourTempo ?? "—"}</div>
              <div className="text-[10px] text-muted-foreground">{yourTempo && song.tempo && yourTempo !== song.tempo ? `orig ${song.tempo}` : "bpm"}</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeTempo(1)} aria-label="Tempo up"><Plus /></Button>
            {draft.your_tempo != null && <Button variant="ghost" size="icon" onClick={resetTempo} aria-label="Reset tempo"><RotateCcw /></Button>}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" className="size-11 rounded-full" onClick={() => setPlaying(!playing)} aria-label={playing ? "Stop scrolling" : "Start scrolling"}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button variant="secondary" size="icon" onClick={() => changeSpeed(-5)} aria-label="Scroll speed down"><Minus /></Button>
            <div className="w-14 text-center">
              <div className="font-mono text-lg font-semibold">{speed}</div>
              <div className="text-[10px] text-muted-foreground">scroll</div>
            </div>
            <Button variant="secondary" size="icon" onClick={() => changeSpeed(5)} aria-label="Scroll speed up"><Plus /></Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A−</Button>
            <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>A+</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveChanges} disabled={!dirty || save.isPending} aria-label="Save key, tempo and capo for this song">
              <Save />
              {save.isPending ? "Saving…" : "Save"}
            </Button>
            <span className={cn("text-[10px]", dirty ? "text-chord" : "text-muted-foreground")}>
              {dirty ? "unsaved changes" : "saved"}
            </span>
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
