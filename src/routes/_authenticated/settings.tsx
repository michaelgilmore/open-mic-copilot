import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bug, Lightbulb, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { feedbackSchema, type FeedbackInput } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [
    { title: "Settings & feedback — Open Mic Copilot" },
    { name: "description", content: "Submit feature requests and report bugs for Open Mic Copilot." },
    { property: "og:title", content: "Settings & feedback — Open Mic Copilot" },
    { property: "og:description", content: "Your requests and bug reports for Open Mic Copilot." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackInput["kind"]>("feature_request");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const history = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback_submissions").select("id, kind, subject, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      const values = feedbackSchema.parse({ kind, subject, message });
      const { error } = await supabase.from("feedback_submissions").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      setOpen(false); setSubject(""); setMessage("");
      toast.success("Feedback saved. Thank you!");
    },
    onError: () => toast.error("Feedback could not be saved. Please try again."),
  });
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Feedback</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => { setKind("feature_request"); setOpen(true); }}><Lightbulb /> Request a feature</Button>
          <Button variant="outline" onClick={() => { setKind("bug_report"); setOpen(true); }}><Bug /> Report a bug</Button>
        </div>
      </section>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Your submissions</h2>
        {history.isPending && <p className="mt-4 text-muted-foreground">Loading…</p>}
        {history.isError && <p className="mt-4 text-destructive">Submissions could not be loaded.</p>}
        {history.data?.length === 0 && <p className="mt-4 text-muted-foreground">No submissions yet.</p>}
        <ul className="mt-4 divide-y divide-border">
          {history.data?.map(item => <li key={item.id} className="flex items-start gap-3 py-4">
            {item.kind === "bug_report" ? <Bug className="mt-1 size-4 shrink-0 text-primary" /> : <Lightbulb className="mt-1 size-4 shrink-0 text-primary" />}
            <div className="min-w-0"><p className="break-words font-medium">{item.subject}</p><p className="mt-1 text-xs text-muted-foreground">{item.kind === "bug_report" ? "Bug report" : "Feature request"} · {new Date(item.created_at).toLocaleDateString()}</p></div>
          </li>)}
        </ul>
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{kind === "bug_report" ? "Report a bug" : "Request a feature"}</DialogTitle><DialogDescription>Open Mic Copilot</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit.mutate(); }}>
            <div className="space-y-2"><Label htmlFor="feedback-subject">Subject</Label><Input id="feedback-subject" required maxLength={160} value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="feedback-message">{kind === "bug_report" ? "What happened?" : "What would you like?"}</Label><Textarea id="feedback-message" required maxLength={5000} rows={6} value={message} onChange={e => setMessage(e.target.value)} /></div>
            <div className="flex justify-end"><Button type="submit" disabled={submit.isPending || !subject.trim() || !message.trim()}><Send />{submit.isPending ? "Saving…" : "Submit"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}