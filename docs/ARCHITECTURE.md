# Life OS — Architecture

## System overview

```
Browser ──► Next.js (App Router, Vercel)
              │
              ├── Supabase Auth  (email + Google OAuth, cookie sessions)
              ├── Supabase Postgres (RLS-protected user data)
              ├── Anthropic API  (claude-opus-4-8 — missions, coach, reviews, roadmaps)
              └── Stripe         (subscriptions; webhook → plan sync)
```

Server components fetch data with the **user's own JWT** (RLS enforced). A separate **service-role client** (`createAdminClient`) is used only where the server must write privileged state: XP grants, achievement unlocks, AI usage metering, billing sync, referral attribution.

## Data model

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`. XP, level, streaks, plan, focus areas, referral code. Created by trigger on signup. |
| `goals` | User outcomes; drive AI mission generation. |
| `missions` | Daily/weekly units of action. Status machine: `active → completed/skipped/expired`. |
| `xp_events` | Append-only XP ledger (`mission_complete`, `streak_bonus`, `achievement`, `referral`). |
| `achievements` / `user_achievements` | Public catalog + per-user unlocks. |
| `coach_messages` | Coach conversation memory (last 20 turns sent to the model). |
| `weekly_reviews` | One AI review per user-week (`unique(user_id, week_start)` = natural cache key). |
| `roadmaps` | Premium week-by-week plans (JSONB milestones). |
| `referrals` | Attribution rows; `pending → converted` when the referred user subscribes. |
| `ai_usage` | Per-user-per-day counters backing free-tier limits. |

### Anti-cheat

Clients can never self-grant progression. Two layers:

1. **RLS** restricts every table to the owning user.
2. The `profiles_protect` trigger zeroes out any client-side change to `xp`, `level`, streaks, `plan`, Stripe columns, and referral fields. Progression flows only through `complete_mission()` (SECURITY DEFINER, owner-validated, atomic) and service-role writes.

### Level curve

Cumulative XP for level *n* = `100 · (n-1)^1.5`. Implemented identically in SQL (`complete_mission`) and TypeScript (`lib/gamification.ts`). Streak bonus = `min(streak, 30) × 2` XP per day continued.

## AI prompt architecture

All prompts share a frozen `CORE_IDENTITY` prefix (`lib/ai/prompts.ts`) marked with `cache_control: ephemeral` — feature briefs layer on top, and **volatile user context always goes in the user message**, never the system prompt, keeping the prompt cache hot.

| Feature | Endpoint | Technique |
|---|---|---|
| Mission generator | `POST /api/missions/generate` | Structured outputs (`output_config.format` json_schema) + Zod re-validation |
| Weekly challenge | same, `cadence: "weekly"` | Premium-gated; single epic mission |
| Life coach | `POST /api/coach` | `messages.stream()` → plain-text streaming response; 20-turn memory + live progress context |
| Weekly review | `POST /api/review` | Structured outputs; cached per ISO week in `weekly_reviews` |
| Roadmap builder | `POST /api/roadmap` | Premium-gated; structured milestones JSONB |

All calls use `claude-opus-4-8` with adaptive thinking (`thinking: {type: "adaptive"}`). Every route checks `stop_reason === "refusal"` before reading content and parses model JSON with `JSON.parse` (never string matching).

## Premium access logic

- `profiles.plan` is **only** written by the Stripe webhook (single source of truth).
- `isPremium()` additionally checks `current_period_end` hasn't passed (grace handling).
- Free limits live in `entitlements.ts`: 2 mission generations/day, 10 coach messages/day. `consumeUsage()` increments `ai_usage` and returns allow/deny; routes respond `402` with an upgrade message the UI renders inline.
- Premium-only surfaces: weekly challenges, roadmaps, premium achievements.

## Subscription lifecycle

1. `POST /api/stripe/checkout` — creates/reuses the Stripe customer (stored on profile), opens Checkout with `supabase_user_id` metadata.
2. Webhook (`checkout.session.completed`, `customer.subscription.*`) → `syncSubscription()` maps Stripe status → `plan`, stores `subscription_status` and `current_period_end`.
3. On first activation of a referred user, the referral converts: referrer gets 500 XP + `referral_1` badge.
4. `POST /api/stripe/portal` — self-serve cancel/upgrade via the Stripe Billing Portal.

## Security model

- All API routes resolve the session via `getAuthedContext()`; unauthenticated → 401.
- Zod validation on every request body.
- Stripe webhook signature verification; service-role key is server-only.
- Security headers (frame-deny, nosniff, referrer policy) in `next.config.mjs`.
- AI prompt-injection surface is limited: user free-text reaches only the coach (chat, by design) and roadmap objective (constrained to 500 chars, output schema-validated).
