import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Music, ListMusic, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TempoFlasher } from "@/components/TempoFlasher";

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const tab =
    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground";
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="relative mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <span className="mr-auto text-xl font-extrabold tracking-tight">
            Open Mic <span className="text-primary">Copilot</span>
          </span>
          <div className="absolute left-1/2 -translate-x-1/2">
            <TempoFlasher />
          </div>
          <Link to="/songs" className={tab} activeProps={{ className: "bg-secondary text-foreground" }}>
            <Music className="size-4" /> <span className="hidden sm:inline">Songs</span>
          </Link>
          <Link to="/setlists" className={tab} activeProps={{ className: "bg-secondary text-foreground" }}>
            <ListMusic className="size-4" /> <span className="hidden sm:inline">Setlists</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
