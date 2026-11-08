import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useSetlist, useSongs } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/setlists/$id")({
  head: () => ({ meta: [{ title: "Setlist — Setlist" }, { name: "description", content: "Songs in this setlist." }] }),
  component: SetlistPage,
});

function SetlistPage() {
  const { id } = Route.useParams();
  const { data: setlist } = useSetlist(id);
  const { data: songs } = useSongs();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => qc.invalidateQueries();

  if (!setlist) return <p className="text-muted-foreground">Loading…</p>;
  const items = setlist.items;
  const inSet = new Set(items.map((i) => i.song?.id));

  async function add(songId: string) {
    const pos = items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
    const { error } = await supabase.from("setlist_songs").insert({ setlist_id: id, song_id: songId, position: pos });
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function removeItem(itemId: string) {
    await supabase.from("setlist_songs").delete().eq("id", itemId);
    refresh();
  }
  async function move(idx: number, dir: -1 | 1) {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("setlist_songs").update({ position: b.position }).eq("id", a.id),
      supabase.from("setlist_songs").update({ position: a.position }).eq("id", b.id),
    ]);
    refresh();
  }
  async function deleteSet() {
    if (!confirm(`Delete setlist "${setlist!.name}"? Songs stay in your library.`)) return;
    await supabase.from("setlists").delete().eq("id", id);
    refresh();
    navigate({ to: "/setlists" });
  }

  const available = (songs ?? []).filter((s) => !inSet.has(s.id) && (s.title + s.artist).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/setlists" aria-label="Back"><ArrowLeft /></Link></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">{setlist.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">Created {formatDate(setlist.created_at)} · {items.length} songs</p>
        </div>
        <Button variant="ghost" size="icon" onClick={deleteSet} aria-label="Delete setlist"><Trash2 /></Button>
      </div>

      <ol className="mt-6 space-y-2">
        {items.map((it, idx) => it.song && (
          <li key={it.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="w-6 text-center font-mono text-sm text-primary">{idx + 1}</span>
            <Link to="/songs/$id" params={{ id: it.song.id }} className="min-w-0 flex-1">
              <div className="truncate font-semibold">{it.song.title}</div>
              <div className="truncate text-xs text-muted-foreground">{it.song.artist} · {it.song.song_key}</div>
            </Link>
            <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Move up"><ArrowUp /></Button>
            <Button variant="ghost" size="icon" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} aria-label="Move down"><ArrowDown /></Button>
            <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Remove from setlist"><X /></Button>
          </li>
        ))}
      </ol>

      {adding ? (
        <div className="mt-6 rounded-xl border border-border p-4">
          <div className="flex gap-2">
            <Input placeholder="Search your songs" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <Button variant="ghost" onClick={() => setAdding(false)}>Done</Button>
          </div>
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto">
            {available.map((s) => (
              <li key={s.id}>
                <button onClick={() => add(s.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-secondary">
                  <Plus className="size-4 text-primary" />
                  <span className="flex-1 truncate">{s.title} <span className="text-muted-foreground">— {s.artist}</span></span>
                </button>
              </li>
            ))}
            {!available.length && <li className="px-3 py-2 text-sm text-muted-foreground">No more songs to add.</li>}
          </ul>
        </div>
      ) : (
        <Button className="mt-6" onClick={() => setAdding(true)}><Plus /> Add songs</Button>
      )}
    </div>
  );
}
