import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkSongConsistency, type SongEntry, type SongResolution } from "@/lib/song-consistency";

export function SongConsistencyDialog({ open, entry, pending, onClose, onResolve }: {
  open: boolean;
  entry: SongEntry;
  pending: boolean;
  onClose: () => void;
  onResolve: (resolution: SongResolution) => void;
}) {
  const check = checkSongConsistency(entry);
  const key = entry.key + (entry.minor ? "m" : "");
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 shrink-0 text-primary" />Check key and capo</DialogTitle>
          <DialogDescription>Nothing has been changed or saved. Choose how to handle these values.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>Sounding key <strong>{key}</strong> with {Number(entry.capo) ? `capo ${entry.capo}` : "no capo"} calls for <strong>{check.expectedShapes}</strong> chord shapes.</p>
          {check.conflicts.map((conflict) => <p key={conflict.field}>{conflict.label} appears to use <strong>{conflict.writtenKey}</strong> shapes, which would sound in <strong>{conflict.soundingKey}</strong> with this capo.</p>)}
          {check.annotations.map((message, i) => <p key={i}>{message}</p>)}
          <p className="text-xs text-muted-foreground">Key estimates can be ambiguous; the first chord alone does not establish a song’s key.</p>
        </div>
        <div className="flex flex-col gap-2">
          {check.suggestedKey && <Button type="button" variant="outline" className="h-auto min-h-9 whitespace-normal py-2" disabled={pending} onClick={() => onResolve("key")}>Use sounding key {check.suggestedKey} · keep chords and capo</Button>}
          {check.suggestedCapo !== null && check.conflicts.length > 0 && <Button type="button" variant="outline" className="h-auto min-h-9 whitespace-normal py-2" disabled={pending} onClick={() => onResolve("capo")}>Use {check.suggestedCapo ? `capo ${check.suggestedCapo}` : "no capo"} · keep key and chords</Button>}
          <Button type="button" variant="outline" className="h-auto min-h-9 whitespace-normal py-2" disabled={pending} onClick={() => onResolve("transpose")}>Update chord text to match {key} with {Number(entry.capo) ? `capo ${entry.capo}` : "no capo"}</Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => onResolve("keep")}>Save exactly as entered</Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Go back and edit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}