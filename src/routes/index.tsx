import { createFileRoute, Link } from "@tanstack/react-router";
import { Music, ArrowUpDown, PlayCircle, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Open Mic Copilot — Your open mic songbook" },
      { name: "description", content: "Keep lyrics, chords, tempo and setlists in one place. Transpose by half steps and auto-scroll on stage." },
      { property: "og:title", content: "Open Mic Copilot — Your open mic songbook" },
      { property: "og:description", content: "Lyrics, chords, transposing, auto-scroll and setlists for solo performers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: Music, t: "Your songbook", d: "Lyrics, chords, tempo and notes for every song." },
    { icon: ArrowUpDown, t: "Change keys", d: "Shift chords up or down by half steps in a tap." },
    { icon: PlayCircle, t: "Auto-scroll", d: "Hands-free lyrics at the speed you choose." },
    { icon: ListMusic, t: "Setlists", d: "Build dated sets from your own songs." },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-sm uppercase tracking-widest text-primary">for open mic night</p>
      <h1 className="mt-3 text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
        Every song.<br />Every set.<br /><span className="text-primary">Ready to play.</span>
      </h1>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg"><Link to="/auth">Get started</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/songs">My songs</Link></Button>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.t} className="rounded-xl border border-border bg-card p-5">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
