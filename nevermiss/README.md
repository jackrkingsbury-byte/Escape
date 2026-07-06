# NeverMiss

The AI front desk that captures and converts every WhatsApp lead for service
businesses — so they never lose a job to whoever answers first.

Strategy, research, and the business case live in the repo's `research/` folder
(`THE-BUSINESS.md`, `OPPORTUNITY-RESEARCH.md`, `RED-TEAM-KILL-MEMO.md`).

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel ·
Anthropic API · Twilio WhatsApp.

## Local development
```bash
cd nevermiss
cp .env.example .env.local   # fill in NEXT_PUBLIC_WA_NUMBER + NEXT_PUBLIC_CONTACT_EMAIL
npm install
npm run dev                  # http://localhost:3000
```

## Scripts
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript, no emit

## Deployment (Vercel)
1. Import the GitHub repo into Vercel.
2. Set the project **Root Directory** to `nevermiss`.
3. Add env vars from `.env.example` (public ones now; secrets as features land).
4. Deploy.

## Supabase setup (Feature 2)
1. Create a project at supabase.com and copy the Project URL + anon key + service-role key.
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server-only, never exposed
   ```
3. Run the schema: paste `supabase/migrations/0001_init.sql` into the Supabase
   SQL editor (or `supabase db push`).
4. In Supabase Auth settings, add your app URL + `/auth/callback` to the allowed
   redirect URLs (e.g. `http://localhost:3000/auth/callback`).
5. Restart `npm run dev` → sign in at `/login`, land on `/dashboard`.

The app runs fine **without** Supabase configured — auth stays dormant and the
dashboard shows a "connect Supabase" notice. The marketing site is unaffected.

## Build order
See the repo research docs for the roadmap. Feature 1 = foundation + landing
page. Feature 2 (this commit) = Supabase schema, RLS, auth, protected
dashboard. Feature 3 = the Claude reply-agent core.
