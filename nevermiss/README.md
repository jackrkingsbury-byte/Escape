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

## Build order
See the repo research docs for the feature roadmap (M0–M7). Feature 1
(this commit) is the project foundation + landing page. Feature 2 is the
Claude reply-agent core.
