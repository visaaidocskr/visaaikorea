# Authentication — TEMPORARILY DISABLED

Auth (login/signup/session checks/route guards) has been temporarily switched off
so the whole app is usable without logging in while core features are built. This
folder holds **verbatim copies of the original files** so auth can be restored
exactly.

> ⚠️ **Dev-only.** While disabled, the server Supabase client uses the
> **service-role key** (bypasses Row-Level Security) and every page renders as a
> single "dev user". Do **NOT** deploy this state to a public environment.

## What was changed (live files → what they do now)

| Live file | Change while disabled | Original saved here as |
|-----------|-----------------------|------------------------|
| `lib/auth.ts` | `getSessionUser` / `requireUser` / `requireAdmin` return the dev user (no network, no redirect) | `lib__auth.ts` |
| `lib/supabase/server.ts` | `createClient()` returns the **service-role** client so RLS-scoped queries still return data with no session | `lib__supabase__server.ts` |
| `proxy.ts` | Pass-through middleware — no `auth.getUser()` call, no login redirects | `proxy.ts` |
| `app/api/generate-documents/route.ts` | Removed the inline `auth.getUser()` 401 gate | `app__api__generate-documents__route.ts` |
| `lib/dev-user.ts` | **NEW** — resolves one real `profiles.id` to act as the dev user | (delete on restore) |
| `lib/supabase/proxy.ts` | No longer imported (dead while disabled); unchanged | `lib__supabase__proxy.ts` |

Nothing else was touched. Login/signup pages, auth server actions, the browser
Supabase client, and the OAuth callback still exist and are unchanged — they are
simply no longer required or enforced.

## The dev user

`lib/dev-user.ts` picks the identity used for all reads/writes:

1. If `DEV_USER_ID` is set in `.env.local`, that `profiles.id` is used (fastest,
   deterministic — recommended).
2. Otherwise it looks up the first **admin** profile (else any profile) via the
   service-role client, once, and caches it.
3. If none exists, it falls back to a synthetic admin user (reads work; inserts
   that require the `profiles` FK will fail until a real id is provided).

Because `applications.user_id` / `uploaded_files.user_id` are NOT-NULL foreign
keys to `public.profiles(id)`, submitting an application needs a **real**
profile id. Set `DEV_USER_ID` to your existing account's profile id if inserts
fail:

```sql
select id, email, role from public.profiles order by role;  -- copy an id
```
```bash
# .env.local
DEV_USER_ID=<that-uuid>
```

## How to RESTORE authentication later

1. Copy the originals back:
   ```bash
   cp auth-disabled/lib__auth.ts                              lib/auth.ts
   cp auth-disabled/lib__supabase__server.ts                  lib/supabase/server.ts
   cp auth-disabled/proxy.ts                                  proxy.ts
   cp auth-disabled/app__api__generate-documents__route.ts    app/api/generate-documents/route.ts
   ```
2. Delete the shim helper: `rm lib/dev-user.ts`
3. (Optional) remove `DEV_USER_ID` from `.env.local`.
4. `npx tsc --noEmit && npm run build` to confirm.
5. Delete this `auth-disabled/` folder.

That returns the app to full RLS-enforced, session-based auth with the proxy
route guards and the per-request auth performance optimizations intact.
