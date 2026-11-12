import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SongValueControlProps = {
  label: string;
  value: string | number;
  detail?: string;
  changed?: boolean;
  decreaseLabel?: string;
  increaseLabel?: string;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onReset: () => void;
};

export function SongValueControl({ label, value, detail, changed, decreaseLabel, increaseLabel, decreaseDisabled, increaseDisabled, onDecrease, onIncrease, onReset }: SongValueControlProps) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="icon" className={cn("size-9 rounded-full font-mono text-xs sm:size-11 sm:text-sm", changed && "text-chord ring-1 ring-primary")} aria-label={`${label}: ${value}`} title={label}>
            {value}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" sideOffset={12} className="w-52 p-3" aria-label={`${label} options`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{label}</span>
            <span className="font-mono text-lg font-semibold text-chord">{value}</span>
          </div>
          {detail && <p className="mb-3 text-xs text-muted-foreground">{detail}</p>}
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" size="icon" onClick={onDecrease} disabled={decreaseDisabled} aria-label={decreaseLabel ?? `${label} down`} title={decreaseLabel ?? `${label} down`}><ChevronDown /></Button>
            <Button variant="ghost" size="icon" onClick={onReset} aria-label={`Reset ${label.toLowerCase()}`} title={`Reset ${label.toLowerCase()}`}><RotateCcw /></Button>
            <Button variant="secondary" size="icon" onClick={onIncrease} disabled={increaseDisabled} aria-label={increaseLabel ?? `${label} up`} title={increaseLabel ?? `${label} up`}><ChevronUp /></Button>
          </div>
        </PopoverContent>
      </Popover>
      <span className="text-[10px] leading-none text-muted-foreground">{label}</span>
    </div>
  );
}