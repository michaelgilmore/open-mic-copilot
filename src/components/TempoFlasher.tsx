import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { adjustFlasherOverride, useFlasherState } from "@/lib/tempo-store";

export function TempoFlasher() {
  const { tempo, override } = useFlasherState();
  const shown = override ?? tempo;
  const [beat, setBeat] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setBeat(0);
    if (!shown || !running) return;
    const ms = 60000 / shown;
    const id = setInterval(() => setBeat((b) => b + 1), ms);
    return () => clearInterval(id);
  }, [shown, running]);

  if (!shown) return null;
  const downbeat = beat % 4 === 0;

  const arrow =
    "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-1.5 py-1">
      <button
        type="button"
        onClick={() => adjustFlasherOverride(-1)}
        aria-label="Tempo down"
        className={arrow}
      >
        <ChevronDown className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Stop tempo flasher" : "Start tempo flasher"}
        title={running ? "Stop tempo flasher" : "Start tempo flasher"}
        className="flex items-center gap-2 rounded-full px-1.5 py-0.5"
      >
        <span
          key={beat}
          className={`beat-flash size-3 rounded-full ${downbeat ? "bg-primary" : "bg-chord"} ${running ? "" : "opacity-25"}`}
          style={{ animationDuration: `${60000 / shown}ms` }}
        />
        <span
          className={`font-mono text-xs font-semibold tabular-nums ${override != null ? "text-chord" : "text-muted-foreground"}`}
        >
          {shown} <span className="text-[10px]">bpm</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => adjustFlasherOverride(1)}
        aria-label="Tempo up"
        className={arrow}
      >
        <ChevronUp className="size-4" />
      </button>
    </div>
  );
}
