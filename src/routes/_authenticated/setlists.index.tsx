import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useSetlists } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/setlists/")({
  head: () => ({ meta: [{ title: "Setlists — Open Mic Copilot" }, { name: "description", content: "Your setlists." }, { property: "og:title", content: "Setlists — Open Mic Copilot" }, { property: "og:description", content: "Create and organize your open mic setlists." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SetlistsPage,
});

function SetlistsPage() {
  const { data, isLoading } = useSetlists();
  const [name, setName] = useState("");
  const [randomOpen, setRandomOpen] = useState(false);
  const [randomCount, setRandomCount] = useState("5");
  const [generating, setGenerating] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data: s, error } = await supabase.from("setlists").insert({ name: name.trim() }).select().single();
    if (error) { toast.error(error.message); return; }
    setName("");
    qc.invalidateQueries();
    navigate({ to: "/setlists/$id", params: { id: s.id } });
  }

  async function generateRandom(e: React.FormEvent) {
    e.preventDefault();
    const count = Math.floor(Number(randomCount));
    if (!Number.isFinite(count) || count < 1) {
      toast.error("Enter at least 1 song.");
      return;
    }
    setGenerating(true);
    const { data: songs, error: songsError } = await supabase.from("songs").select("id");
    if (songsError) {
      setGenerating(false);
      toast.error(songsError.message);
      return;
    }
    if (!songs?.length) {
      setGenerating(false);
      toast.error("Add some songs to your library first.");
      return;
    }
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));
    if (count > shuffled.length) {
      toast.info(`You only have ${shuffled.length} songs, so the setlist has ${picked.length}.`);
    }
    const setName = `Random set · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    const { data: s, error } = await supabase.from("setlists").insert({ name: setName }).select().single();
    if (error) {
      setGenerating(false);
      toast.error(error.message);
      return;
    }
    const { error: itemsError } = await supabase
      .from("setlist_songs")
      .insert(picked.map((song, i) => ({ setlist_id: s.id, song_id: song.id, position: i })));
    setGenerating(false);
    if (itemsError) {
      toast.error(itemsError.message);
      return;
    }
    setRandomOpen(false);
    qc.invalidateQueries();
    navigate({ to: "/setlists/$id", params: { id: s.id } });
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Setlists</h1>
      <form onSubmit={create} className="mt-5 flex gap-2">
        <Input className="h-11" placeholder="New setlist name, e.g. Blue Moon open mic" value={name} onChange={(e) => setName(e.target.value)} />
        <Button className="h-11"><Plus /> Create</Button>
      </form>
      <Dialog open={randomOpen} onOpenChange={setRandomOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-3 h-11"><Shuffle /> Random setlist</Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={generateRandom}>
            <DialogHeader>
              <DialogTitle>Random setlist</DialogTitle>
              <DialogDescription>Pick how many songs, and I'll shuffle your library into a new setlist.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="random-count">How many songs?</Label>
              <Input
                id="random-count"
                type="number"
                min={1}
                inputMode="numeric"
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-5">
              <Button type="submit" disabled={generating}>
                <Shuffle /> {generating ? "Shuffling…" : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No setlists yet.</div>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {data.map((s) => (
            <li key={s.id}>
              <Link to="/setlists/$id" params={{ id: s.id }} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary">
                <div className="text-lg font-semibold">{s.name}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  Created {formatDate(s.created_at)} · {s.setlist_songs?.[0]?.count ?? 0} songs
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
