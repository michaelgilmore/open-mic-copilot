import { useEffect, useState } from "react";
import { useFlasherTempo } from "@/lib/tempo-store";

export function TempoFlasher() {
  const tempo = useFlasherTempo();
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setBeat(0);
    if (!tempo || muted) return;
    const ms = 60000 / tempo;
    const id = setInterval(() => setBeat((b) => b + 1), ms);
    return () => clearInterval(id);
  }, [tempo, muted]);

  if (!tempo) return null;
  const downbeat = beat % 4 === 0;

  return (
    <button
      type="button"
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "Resume tempo flasher" : "Pause tempo flasher"}
      title={muted ? "Resume tempo flasher" : "Pause tempo flasher"}
      className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5"
    >
      <span
        key={beat}
        className={`beat-flash size-3 rounded-full ${downbeat ? "bg-primary" : "bg-chord"} ${muted ? "opacity-25" : ""}`}
        style={{ animationDuration: `${60000 / tempo}ms` }}
      />
      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
        {tempo} <span className="text-[10px]">bpm</span>
      </span>
    </button>
  );
}
