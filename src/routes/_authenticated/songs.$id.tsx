import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Pencil, Trash2, ArrowLeft, Save, SkipForward, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSong, useSaveSong, useSetlist, useSong } from "@/lib/data";
import { setlistNavigation } from "@/lib/setlist-navigation";
import { setFlasherTempo } from "@/lib/tempo-store";
import { stepsBetween, transposeKey } from "@/lib/transpose";
import { originalCapo, capoChordText, shapeKey, CAPO_MAX } from "@/lib/capo";
import { hasUnsavedKeyOrTempo, type KeyTempoDraft } from "@/lib/song-draft";
import { SCROLL_DEFAULT, SCROLL_MAX, SCROLL_MIN, adjustScrollSpeed, clampScrollSpeed } from "@/lib/scroll-speed";
import { SongValueControl } from "@/components/SongValueControl";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/songs/$id")({
  // `from` carries the setlist the song was opened from so the view can offer Next.
  validateSearch: (search: Record<string, unknown>): { from?: string | undefined } => ({
    from: typeof search["from"] === "string" && search["from"] ? search["from"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Song — Open Mic Copilot" }, { name: "description", content: "Perform with lyrics, chord shapes, capo, key and tempo settings." }, { property: "og:title", content: "Song — Open Mic Copilot" }, { property: "og:description", content: "Your song's lyrics, capo-aware chords and performance settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SongView,
});

function SongView() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  const { data: song, isLoading } = useSong(id);
  const { data: sourceSetlist } = useSetlist(from ?? "");
  const nav = sourceSetlist ? setlistNavigation(sourceSetlist.items, id) : null;
  const save = useSaveSong();
  const del = useDeleteSong();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(SCROLL_DEFAULT);
  const [fontSize, setFontSize] = useState(18);
  // Pending key/tempo edits — only written to the song when Save is pressed.
  const [draft, setDraft] = useState<KeyTempoDraft>({ your_key: null, your_tempo: null, your_capo: null });
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!song) return;
    setSpeed(clampScrollSpeed(song.scroll_speed));
    setDraft({ your_key: song.your_key ?? null, your_tempo: song.your_tempo ?? null, your_capo: song.your_capo ?? null });
  }, [song]);

  // Moving to another song in a setlist should start at the top of its chart.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

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
  const shapes = shapeKey(yourKey, yourCapo);

  function commitSpeed(v: number) {
    save.mutate({ id, values: { title: currentSong.title, scroll_speed: v } });
  }

  function changeSpeed(delta: number) {
    const next = adjustScrollSpeed(speed, delta);
    setSpeed(next);
    commitSpeed(next);
  }

  function changeKey(delta: number) {
    setDraft((d) => {
      const current = d.your_key ?? currentSong.song_key;
      const next = transposeKey(current, delta);
      return { ...d, your_key: stepsBetween(currentSong.song_key, next) === 0 ? null : next };
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
      const next = Math.min(CAPO_MAX, Math.max(0, (d.your_capo ?? baseCapo) + delta));
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
        <Button asChild variant="ghost" size="icon">
          {from ? (
            <Link to="/setlists/$id" params={{ id: from }} aria-label="Back to setlist"><ArrowLeft /></Link>
          ) : (
            <Link to="/songs" aria-label="Back"><ArrowLeft /></Link>
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{song.title}</h1>
          <p className="text-muted-foreground">
            {song.artist} · {yourKey}
            {steps !== 0 ? ` (orig ${song.song_key})` : ""}
            {yourTempo ? ` · ${yourTempo} bpm` : ""}
            {yourTempo && song.tempo && yourTempo !== song.tempo ? ` (orig ${song.tempo})` : ""}
            {yourCapo > 0 ? ` · Capo ${yourCapo} (${shapes} shapes)` : " · No capo"}
          </p>
          {nav && <p className="font-mono text-xs text-muted-foreground">{nav.index + 1} of {nav.total} in {sourceSetlist?.name}</p>}
        </div>
        {nav?.next ? (
          <Button asChild variant="outline" className="shrink-0 gap-1.5" title={`Next up: ${nav.next.song?.title ?? "song"}`}>
            <Link to="/songs/$id" params={{ id: nav.next.song!.id }} search={{ from }} aria-label={`Next song: ${nav.next.song?.title ?? ""}`}>
              <SkipForward className="size-4" />
              <span className="hidden sm:inline">Next</span>
            </Link>
          </Button>
        ) : nav ? (
          <Button asChild variant="outline" className="shrink-0 gap-1.5" title="That is the last song in this setlist">
            <Link to="/setlists/$id" params={{ id: from ?? "" }} aria-label="Open setlist">
              <ListMusic className="size-4" />
              <span className="hidden sm:inline">Setlist</span>
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="icon"><Link to="/edit/$id" params={{ id }} aria-label="Edit"><Pencil /></Link></Button>
        <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete"><Trash2 /></Button>
      </div>

      {song.notes && <p className="mt-4 rounded-lg border-l-4 border-primary bg-card px-4 py-3 text-sm">{song.notes}</p>}

      {song.chords && (
        <section className="sticky top-[60px] z-10 -mx-4 mt-6 border-b border-border bg-background/95 px-4 pb-3 backdrop-blur">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Chords · {yourCapo > 0 ? `Capo ${yourCapo} · ${shapes} shapes` : `No capo · ${shapes}`}</h2>
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
        <div role="toolbar" aria-label="Song controls" className="mx-auto flex max-w-5xl flex-nowrap items-start justify-center gap-1.5 overflow-x-auto px-2 py-3 sm:gap-4 sm:px-4">
          <SongValueControl label="Key" value={yourKey} changed={steps !== 0} detail={`Original ${song.song_key}`} decreaseLabel="Key down half step" increaseLabel="Key up half step" onDecrease={() => changeKey(-1)} onIncrease={() => changeKey(1)} onReset={resetKey} />
          <SongValueControl label="Capo" value={yourCapo} changed={draft.your_capo != null} detail={`Original ${baseCapo} · ${shapes} shapes`} decreaseDisabled={yourCapo === 0} increaseDisabled={yourCapo >= CAPO_MAX} onDecrease={() => changeCapo(-1)} onIncrease={() => changeCapo(1)} onReset={() => setDraft((d) => ({ ...d, your_capo: null }))} />
          <SongValueControl label="Tempo" value={yourTempo ?? "—"} changed={draft.your_tempo != null} detail={`Original ${song.tempo ?? "—"} bpm`} decreaseDisabled={yourTempo != null && yourTempo <= 30} increaseDisabled={yourTempo != null && yourTempo >= 300} onDecrease={() => changeTempo(-1)} onIncrease={() => changeTempo(1)} onReset={resetTempo} />
          <div className="flex shrink-0 flex-col items-center gap-1">
            <Button size="icon" className="size-9 rounded-full sm:size-11" onClick={() => setPlaying(!playing)} aria-label={playing ? "Stop scrolling" : "Start scrolling"} title={playing ? "Stop scrolling" : "Start scrolling"}>
              {playing ? <Pause /> : <Play />}
            </Button>
            <span className="text-[10px] leading-none text-muted-foreground">{playing ? "Stop" : "Play"}</span>
          </div>
          <SongValueControl label="Scroll" value={speed} detail={`Speed ${SCROLL_MIN} to ${SCROLL_MAX}`} decreaseLabel="Scroll speed down" increaseLabel="Scroll speed up" decreaseDisabled={speed <= SCROLL_MIN} increaseDisabled={speed >= SCROLL_MAX} onDecrease={() => changeSpeed(-1)} onIncrease={() => changeSpeed(1)} onReset={() => { setSpeed(SCROLL_DEFAULT); commitSpeed(SCROLL_DEFAULT); }} />
          <SongValueControl label="Text" value={fontSize} decreaseLabel="Text size down" increaseLabel="Text size up" decreaseDisabled={fontSize <= 12} increaseDisabled={fontSize >= 40} onDecrease={() => setFontSize(Math.max(12, fontSize - 2))} onIncrease={() => setFontSize(Math.min(40, fontSize + 2))} onReset={() => setFontSize(18)} />
          <div className="flex shrink-0 flex-col items-center gap-1">
            <Button size="icon" className="size-9 rounded-full sm:size-11" onClick={saveChanges} disabled={!dirty || save.isPending} aria-label="Save key, tempo and capo for this song" title={dirty ? "Save changes" : "Saved"}>
              <Save />
            </Button>
            <span aria-live="polite" className="text-[10px] leading-none text-muted-foreground">{save.isPending ? "Saving" : dirty ? "Save" : "Saved"}</span>
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
