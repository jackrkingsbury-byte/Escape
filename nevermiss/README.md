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
- `npm test` — guardrails + scorecard suites (no network, no keys)

## Store Scorecard (the distribution loop)

`research/WHAT-PEOPLE-ACTUALLY-BUY.md` concluded that the bottleneck is
distribution, not product — and that tools producing a **shareable public
output** pull users in without ad spend. The scorecard is that output.

```
paste store link → /api/storescan → score /100 + share code
                                        │
                        /s/<code>  ◀────┘   public page, no login
                             │
                        /api/og?c=<code>    1200×630 preview WhatsApp unfurls
```

- `lib/scorecard.ts` — scoring engine. Five categories (photos 30, descriptions
  25, freshness 20, in-stock 15, range 10) summing to 100. Every point is
  arithmetic on the public storefront and each category ships its own `explain`
  string, so the score is never a black box.
- **The whole card travels in the URL.** A share code is base64url over the raw
  facts plus a checksum — no database, links never expire, and `/s/[code]`
  renders statically. Codes are untrusted input: counts are clamped to the
  catalogue they describe, and a tampered or truncated code renders the
  "can't read this" page rather than a fake score.
- `scripts/scorecard.test.ts` proves the score equals the sum of its parts,
  codes round-trip exactly, and junk codes fail closed.

Set `NEXT_PUBLIC_SITE_URL` in production. Without it, share links fall back to
Vercel's per-deployment URL, which changes on every deploy and would break
scorecards people have already posted.

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
