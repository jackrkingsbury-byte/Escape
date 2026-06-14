# Life OS — Production Deployment (Netlify + Supabase + Paystack)

Follow these in order. You'll have a live app once all three services are wired up.

## 1. Supabase (database + auth + login)

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name, a strong database password, and the region closest to you (e.g. `EU (London)` or `South Africa` if offered). Wait ~2 min for it to provision.
2. In the project, open **SQL Editor → New query**. Open `supabase/migrations/0001_init.sql` from this repo, copy the whole file, paste it in, and click **Run**. This creates every table, security rule, trigger, and the achievement list.
3. Open **Project Settings → API**. Copy these three values (you'll paste them into Netlify in step 4):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)
4. **Auth → Providers → Email**: leave enabled.
5. **Auth → Providers → Google** (optional but recommended): toggle on. You'll need a Google OAuth client — in [Google Cloud Console](https://console.cloud.google.com) create an OAuth client ID, set the authorized redirect URI to `https://YOUR_PROJECT.supabase.co/auth/v1/callback`, then paste the client ID + secret into Supabase.
6. **Auth → URL Configuration**: set **Site URL** to your future Netlify URL (you'll get it in step 4 — come back and fill this in), and add `https://YOUR-SITE.netlify.app/auth/callback` under **Redirect URLs**.

## 2. Anthropic (the AI brain)

The missions, coach, weekly reviews, and roadmaps all call Claude — without this key those buttons return an error, but the rest of the app works.

1. Go to [platform.claude.com](https://platform.claude.com), create an account, add a payment method (international cards accepted), and create an **API key**.
2. Copy it → `ANTHROPIC_API_KEY` (starts with `sk-ant-`).

## 3. Paystack (payments — South Africa)

1. Sign up at [paystack.com](https://paystack.com) and complete business verification (needed before you can accept live payments; test mode works immediately).
2. **Dashboard → Plans → Create Plan** — make two plans in **ZAR**:
   - "Life OS Premium Monthly", amount R99, interval **Monthly** → copy its **Plan Code** (`PLN_...`) → `PAYSTACK_PLAN_MONTHLY`
   - "Life OS Premium Yearly", amount R899, interval **Annually** → copy its **Plan Code** → `PAYSTACK_PLAN_YEARLY`
3. **Settings → API Keys & Webhooks**:
   - Copy the **Secret Key** (`sk_test_...` in test mode) → `PAYSTACK_SECRET_KEY`
   - Copy the **Public Key** (`pk_test_...`) → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Set the **Webhook URL** to `https://YOUR-SITE.netlify.app/api/paystack/webhook` (come back after step 4 to fill the real URL).
4. Paystack signs webhooks with your secret key, so there's no separate webhook secret to copy.

## 4. Netlify (hosting)

This is where the app actually runs. You connect Netlify to your GitHub repo — you do **not** put any Netlify key into GitHub.

1. Push this repo to GitHub (your branch is already pushed).
2. Go to [netlify.com](https://netlify.com), sign up/login **with GitHub**, click **Add new site → Import an existing project → GitHub**, and pick the `Escape` repo.
3. Netlify auto-detects Next.js (the `netlify.toml` in this repo sets the build command and the Next.js plugin). Just confirm.
4. Before the first deploy, open **Site configuration → Environment variables** and add every variable from the table below.
5. Click **Deploy**. You'll get a URL like `https://your-site.netlify.app`.
6. **Go back and finish the URLs you deferred:** set `NEXT_PUBLIC_APP_URL` to this Netlify URL, add it to Supabase Auth (Site URL + redirect), and set it as the Paystack webhook URL. Then trigger one more deploy.

### Environment variables to add in Netlify

| Variable | Where it came from |
|---|---|
| `NEXT_PUBLIC_APP_URL` | your Netlify URL, e.g. `https://your-site.netlify.app` (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (**secret**) |
| `ANTHROPIC_API_KEY` | Anthropic console (**secret**) |
| `PAYSTACK_SECRET_KEY` | Paystack → API Keys (**secret**) |
| `PAYSTACK_PLAN_MONTHLY` | Paystack → Plans (Plan Code) |
| `PAYSTACK_PLAN_YEARLY` | Paystack → Plans (Plan Code) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack → API Keys |

## 5. Post-deploy checklist

- [ ] Sign up with email → confirmation link lands on `/auth/callback` → onboarding
- [ ] Sign in with Google → onboarding
- [ ] Generate missions, complete one → XP/streak update on dashboard
- [ ] Coach chat streams responses (needs `ANTHROPIC_API_KEY`)
- [ ] Free limits show upgrade prompts after 2 generations / 10 messages
- [ ] Upgrade → Paystack checkout (test card `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`) → webhook flips plan to premium → roadmaps unlock
- [ ] "Manage billing" in settings opens the Paystack management link
- [ ] Referral link signup → conversion grants 500 XP after the friend subscribes

## Notes

- **Yoco vs Paystack:** Yoco is excellent for in-person card machines and one-off payment links, but it has no recurring-subscription API, so it can't drive the Premium plan. Paystack does, which is why the code uses it.
- **Going live:** swap the Paystack test keys for live keys once your business is verified, and update the env vars in Netlify.

## Optional integrations

- **Analytics**: add PostHog via `NEXT_PUBLIC_POSTHOG_KEY`.
- **Email automation**: wire Resend (`RESEND_API_KEY`) into a scheduled function for streak reminders.
