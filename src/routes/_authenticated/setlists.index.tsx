import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, useSetlists } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/setlists/")({
  head: () => ({ meta: [{ title: "Setlists — Open Mic Copilot" }, { name: "description", content: "Your setlists." }] }),
  component: SetlistsPage,
});

function SetlistsPage() {
  const { data, isLoading } = useSetlists();
  const [name, setName] = useState("");
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

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Setlists</h1>
      <form onSubmit={create} className="mt-5 flex gap-2">
        <Input className="h-11" placeholder="New setlist name, e.g. Blue Moon open mic" value={name} onChange={(e) => setName(e.target.value)} />
        <Button className="h-11"><Plus /> Create</Button>
      </form>
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
