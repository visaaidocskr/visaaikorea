# VisaAI Korea — Setup, Deployment & Security

A production visa-document automation platform for foreigners living in South
Korea. Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase
(Auth / Postgres / private Storage / RLS) · Resend · docx + docxtemplater.

## 1. Prerequisites
- Node 20+ (tested on Node 24)
- A Supabase project (free tier is fine)
- A Resend account (optional — email degrades gracefully without it)
- An Anthropic API key (optional — Travel Purpose Statement translation/polish
  degrades gracefully without it, using the client's original text as-is)

## 2. Environment
```bash
cp .env.local.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page (server-only secret; never exposed to the browser)
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally; your domain in production
- `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_NOTIFY_EMAIL` — for transactional email
- `ANTHROPIC_API_KEY` — translates/polishes the client's "why this destination?"
  answer into professional English inside the Travel Purpose Statement (get one
  at console.anthropic.com/settings/keys). Without it, the client's original
  text is used as-is.

`.env*` is gitignored — never commit secrets.

## 3. Database
Run the migrations **in order** in the Supabase SQL Editor:
1. `supabase/migrations/0001_init_profiles.sql` — profiles, roles, RLS, new-user trigger
2. `supabase/migrations/0002_applications.sql` — applications/details/companions/files + RLS + private Storage buckets & policies
3. `supabase/migrations/0003_admin.sql` — admin_notes, audit_logs, generated_documents, email_logs, templates, rules + RLS
4. `supabase/migrations/0004_visa_engine.sql` — data-driven visa engine: destinations, nationalities,
   korean_visa_types, embassies, eligibility_rules, destination_date_rules, required_documents,
   country_guidance, financial_requirements, faqs, latest_updates (public-read, admin-write)

This also creates the 4 private buckets: `applicant-uploads`, `generated-documents`,
`document-templates`, `admin-reservations`.

### Data-driven visa engine (migration 0004)
The visa rules (eligibility, date rules, documents, guidance, embassies) live in code as the
**default** ruleset (`lib/visa/*`). Migration 0004 adds typed tables the app **reads through**:
a server-side resolver (`lib/visa/rules-source.ts`) overlays any DB rows on top of the code
defaults and passes the result into the wizard. **The app behaves identically whether or not 0004
is applied** — empty/absent tables fall back to the code defaults.

To start editing rules in the DB (and add new countries/nationalities without a redeploy), seed the
tables from the code defaults once:
```bash
npx tsx scripts/seed-visa-rules.ts      # idempotent; needs SUPABASE_SERVICE_ROLE_KEY
```
`npx tsx scripts/verify-parity.ts` asserts the ruleset-threaded engine matches the code defaults.

## 4. Create an admin
1. `npm run dev`, sign up at `/signup`.
2. In SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. `/admin` is now accessible.

For easy local testing: Supabase → Auth → Providers → Email → turn **off**
"Confirm email" so signup logs you straight in.

## 5. Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## 6. End-to-end test
1. Sign up → `/dashboard`.
2. **New application** → pick destination → fill applicant + upload passport/ARC →
   conditional documents → companions → guidance + consent → **Submit**.
   (Submission emails fire — "skipped" in logs if no Resend key.)
3. As admin: `/admin/applications` → open it → set status, add a note, view files,
   **Generate system documents**, optionally upload a `.docx` template at
   `/admin/templates` and run it, upload reservations, **Release to client**,
   **Email client: documents ready**.
4. Back as the client: `/dashboard/applications/[id]` and `/dashboard/downloads`
   → download the released documents.

## 7. Deploy (Vercel recommended)
- Push to a Git repo, import into Vercel.
- Add all `.env.local` values as Vercel environment variables (mark the service
  role key as a server/secret var — it must **not** be `NEXT_PUBLIC_`).
- Set `NEXT_PUBLIC_SITE_URL` to your production domain.
- In Supabase → Auth → URL Configuration, add your production domain to the
  redirect allow-list (`https://your-domain.com/auth/callback`).
- In Resend, verify your sending domain and set `RESEND_FROM` accordingly.

## 8. Security review summary
- **RLS everywhere.** Clients see only their own rows/files; admins gated by a
  `SECURITY DEFINER is_admin()` helper (no policy recursion). Role escalation is
  blocked at the DB (a user cannot change their own role).
- **Private storage.** All 4 buckets are private. Client file access is scoped by
  path (`{user_id}/…`); downloads use short-lived (10 min) signed URLs.
- **Service-role key is server-only** (`lib/supabase/admin.ts`, `import "server-only"`),
  never bundled to the browser.
- **Server-side validation.** Date rules and consent are re-validated in
  `submitApplication` — the client cannot bypass them.
- **Auth guard** in `proxy.ts` (Next 16's renamed middleware) plus per-page
  `requireUser` / `requireAdmin`.
- **Audit logging** of admin actions (status, notes, role changes).
- **Security headers** set in `next.config.ts` (HSTS, X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy).
- **Uploads validated** for type (JPG/PNG/PDF) and size (10 MB) client-side.
- **Disclaimer** ("approval decided only by the authority; no guarantee") shown
  at consent, on every generated document, and on the public footer/terms.

### Hardening backlog (not yet done)
- Server-side re-validation of uploaded file MIME/size (currently client-side).
- Rate limiting on auth + submission endpoints.
- PDF AcroForm filling (pdf-lib) — only DOCX generation is implemented.
- A Content-Security-Policy header (left out to avoid breaking Supabase calls;
  add once domains are finalized).
- Virus scanning of uploads.

## 9. Roadmap / Future phases

- **Document Intelligence & Auto-Fill Engine** (deferred — separate phase).
  After each upload, analyze the file with Claude vision (`@anthropic-ai/sdk`,
  `claude-opus-4-8`) against an extensible document-type registry to confirm it
  matches the expected category (Passport / ARC front / ARC back / future types),
  with confidence scoring and ✓/⚠/✗ embassy-grade feedback. A confident mismatch
  would block that document; degrades to a no-op without `ANTHROPIC_API_KEY`.
  Then extend to **auto-fill** applicant fields from the extracted passport/ARC
  data. Design notes captured; build after the core workflow is production-ready.
