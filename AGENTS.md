<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All site content lives in the database (site_settings jsonb + per-type tables with sort/visible); the public page and /admin read the same queries in src/lib/site.ts so admin edits show up live.
- Admin rights come only from public.user_roles via has_role; the first account to sign up is made admin by a trigger.
- The media bucket is private (workspace blocks public buckets); uploads store a long-lived signed URL.
