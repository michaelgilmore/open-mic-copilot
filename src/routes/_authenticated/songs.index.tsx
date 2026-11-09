import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useSongs } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/songs/")({
  head: () => ({ meta: [{ title: "My Songs — Open Mic Copilot" }, { name: "description", content: "Your song library." }, { property: "og:title", content: "My Songs — Open Mic Copilot" }, { property: "og:description", content: "Browse your personal songs and chord charts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SongsPage,
});

function SongsPage() {
  const { data: songs, isLoading } = useSongs();
  const [q, setQ] = useState("");
  const list = (songs ?? []).filter((s) => (s.title + " " + s.artist).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="mr-auto text-3xl font-extrabold">Songs</h1>
        <Button asChild><Link to="/edit/$id" params={{ id: "new" }}><Plus /> Add song</Link></Button>
      </div>
      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-9" placeholder="Search title or artist" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {songs?.length ? "No matches." : "No songs yet — add your first one."}
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {list.map((s) => (
            <li key={s.id}>
              <Link to="/songs/$id" params={{ id: s.id }} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold">{s.title}</div>
                  <div className="truncate text-sm text-muted-foreground">{s.artist || "—"}</div>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  <div className="text-base font-semibold text-chord">{s.your_key ?? s.song_key}</div>
                  {s.tempo ? `${s.tempo} bpm` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
