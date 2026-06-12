# Life OS — Production Deployment

## 1. Supabase

1. Create a project at [database.new](https://database.new).
2. Apply the migration: paste `supabase/migrations/0001_init.sql` into the SQL editor (or `supabase link && supabase db push`).
3. **Auth → Providers**: enable Email and Google (create OAuth credentials in Google Cloud Console; authorized redirect URI = `https://YOUR_PROJECT.supabase.co/auth/v1/callback`).
4. **Auth → URL Configuration**: set Site URL to your production domain and add `https://yourdomain.com/auth/callback` to redirect URLs.
5. Copy the project URL, anon key, and service-role key into env vars.

## 2. Stripe

1. Create a product **Life OS Premium** with two recurring prices: $9/month and $79/year. Copy the price IDs.
2. Add a webhook endpoint `https://yourdomain.com/api/stripe/webhook` listening to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the webhook signing secret.
4. Enable the **Customer Portal** (Settings → Billing → Customer portal).

## 3. Anthropic

Create an API key at [platform.claude.com](https://platform.claude.com) with access to `claude-opus-4-8`. Note: AI routes set `maxDuration` up to 180s — keep your hosting plan's function timeout at or above that.

## 4. Vercel

```bash
vercel link
vercel env add   # add every variable from .env.example
vercel --prod
```

Environment variables required in production:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | safe for client |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** |
| `ANTHROPIC_API_KEY` | server-only |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | server-only |
| `STRIPE_PRICE_PREMIUM_MONTHLY` / `STRIPE_PRICE_PREMIUM_YEARLY` | price IDs |

## 5. Post-deploy checklist

- [ ] Sign up with email → confirmation link lands on `/auth/callback` → onboarding
- [ ] Sign in with Google → onboarding
- [ ] Generate missions, complete one → XP/streak update on dashboard
- [ ] Coach chat streams responses
- [ ] Free limits return upgrade prompts after 2 generations / 10 messages
- [ ] Checkout (Stripe test card `4242…`) → webhook flips plan to premium → roadmaps unlock
- [ ] Customer portal opens from settings
- [ ] Referral link signup → conversion grants 500 XP after subscribe

## Optional integrations

- **Analytics**: add PostHog via `NEXT_PUBLIC_POSTHOG_KEY` and a provider in `src/app/layout.tsx`.
- **Email automation**: wire Resend (`RESEND_API_KEY`) into a daily cron (Vercel Cron → route handler) for streak-reminder emails.
- **Cron jobs**: schedule a daily route to mark overdue missions `expired` and pre-generate next-day missions for premium users.
