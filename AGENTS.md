<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Feedback is stored with authenticated insert/read-own policies in feedback_submissions; why: reports must persist without exposing other users' submissions, even before email sending is configured.
- Data access goes through the browser Supabase client with per-user RLS (user_id = auth.uid()) on songs, setlists, setlist_songs; why: each signed-in user must only see their own entries.
- Transposition logic lives in src/lib/transpose.ts with tests in src/test/transpose.test.ts; why: key changes must stay correct for chord lines and inline [chord] markers.
- New accounts get starter songs copied from public.song_library by a signup trigger on auth.users; why: songs are per-user, so shared seed data must be copied into each user's own rows.
- Song keys represent sounding pitch; capo-aware chord rendering lives in src/lib/capo.ts and uses the original capo (explicit field or legacy chart annotation) and personal capo override to derive shapes; why: changing capo must preserve the selected sounding key while keeping legacy starter charts compatible.
