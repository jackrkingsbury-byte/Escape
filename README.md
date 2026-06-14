# ⚡ Life OS

**Level up your real life.** Life OS is a gamified, AI-powered life-improvement platform: users pick outcomes (confidence, fitness, friends, money, discipline, focus, communication) and the product turns them into concrete daily missions, weekly challenges, streaks, XP, achievements — with an always-on AI coach.

> Duolingo for life · Notion meets Habitica · AI coach meets mission control

## Feature map

| Area | What's included |
|---|---|
| **Auth** | Email/password + Google OAuth (Supabase Auth), secure cookie sessions, protected routes via middleware |
| **AI system** | Mission generator, weekly challenge creator, streaming life coach, weekly review, roadmap builder — all on Claude (`claude-opus-4-8`) with structured outputs + prompt caching |
| **Missions** | Daily missions & weekly epic challenges, 4 difficulty tiers, XP rewards, dedup against history |
| **Progression** | XP ledger, level curve (`100·n^1.5`), streaks with compounding bonuses, level titles |
| **Achievements** | 16-badge catalog (incl. premium-exclusive), automatic unlock evaluation, XP bonuses |
| **Premium** | Paystack subscriptions (monthly/yearly, ZAR), webhook-driven plan sync, hosted manage/cancel link, free-tier metering |
| **Referrals** | Per-user codes, attribution at signup, 500 XP + badge on conversion |
| **Design** | Dark glassmorphism system, electric-blue/orange palette, micro-animations, mobile-first with bottom nav |

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres, Auth, Row Level Security
- **Anthropic Claude** — `@anthropic-ai/sdk`, model `claude-opus-4-8`
- **Paystack** — subscriptions + hosted manage link (South Africa, ZAR)
- **Netlify** — deployment (`@netlify/plugin-nextjs`)
- **Zod** — runtime validation on every API boundary

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local   # fill in Supabase, Anthropic, Paystack keys

# 3. Database
# Apply supabase/migrations/0001_init.sql via the Supabase SQL editor,
# or: supabase link && supabase db push

# 4. Run
npm run dev
```

For Paystack webhooks during local testing, expose your dev server with a tunnel
(e.g. `npx localtunnel --port 3000`) and point the Paystack webhook URL at
`<tunnel-url>/api/paystack/webhook`.

Enable the **Google provider** in Supabase Auth settings and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect allowlist.

## Project structure

```
supabase/migrations/   SQL schema, RLS policies, triggers, seed data
src/
  middleware.ts        Session refresh + route protection
  lib/
    ai/                Anthropic client + prompt architecture
    supabase/          Browser / server / admin clients
    auth.ts            Authed-context resolver for API routes
    entitlements.ts    Premium checks + free-tier usage metering
    gamification.ts    XP / level / streak math
    achievements.ts    Unlock evaluation engine
    paystack.ts        Paystack client + plan config
  app/
    page.tsx           Marketing landing
    login/ signup/     Auth screens
    onboarding/        3-step focus/intensity/goal wizard
    pricing/           Plans + checkout
    (app)/             Authenticated shell: dashboard, missions, coach,
                       roadmap, review, achievements, settings
    api/               missions, coach (streaming), review, roadmap,
                       onboarding, paystack (checkout/manage/webhook)
    auth/callback/     OAuth code exchange + referral attribution
docs/                  Architecture & deployment guides
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — data model, AI prompt design, premium logic, security model
- [Deployment](docs/DEPLOYMENT.md) — Netlify + Supabase + Paystack production setup
