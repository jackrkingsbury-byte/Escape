# ESCAPE Business HQ

Your private mission control for running the ESCAPE course business. A single-file, zero-dependency web app with six AI agents that handle marketing, sales, analytics, content creation, growth, and support.

---

## What this is

ESCAPE HQ is a standalone dashboard that lives completely separately from the ESCAPE course site. It's your private ops center — not visible to students. From here you can:

- **Run AI agents** to write marketing posts, draft sales follow-ups, generate analytics summaries, create new dares, find influencer prospects, and handle support emails
- **Manage your code vault** — all access codes in one place, tracked as Available / Sent / Used
- **Track revenue and members** manually until you connect a payment provider
- **Automate daily tasks** via GitHub Actions (marketing posts every morning, sales check every 4 hours, analytics every Monday)

---

## Deploy on Netlify (2 minutes)

1. Download or clone this repo
2. Go to [app.netlify.com](https://app.netlify.com)
3. Drag and drop `index.html` onto the Netlify deploy zone
4. Done — your HQ is live at a private Netlify URL

> Keep the URL private. This is your owner dashboard — no auth is built in, so treat the URL as your password.

---

## Set up GitHub Actions

To enable the automated daily/hourly agent runs:

1. Fork this repo on GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add two secrets:
   - `COMPOSIO_KEY` — your Composio API key (from [app.composio.dev](https://app.composio.dev))
   - `ANTHROPIC_KEY` — your Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))
4. The three workflows will now run on schedule:
   - `daily-marketing.yml` — 7am UTC every day
   - `weekly-analytics.yml` — Monday 8am UTC
   - `sales-monitor.yml` — every 4 hours

To run a workflow manually: go to the **Actions** tab → select a workflow → click **Run workflow**.

---

## Access code flow

1. **Add codes to the vault**: In ESCAPE HQ → Code Vault, paste your codes (one per line) or upload a `.txt` file. They'll be saved as "Available".
2. **Sales Agent sends a code**: When you run the Sales Agent for "Send codes", it pulls the next available code, marks it "Sent", and drafts an email (or sends it via Composio if connected).
3. **Mark as Used**: Once a student activates their code on the ESCAPE site, you can manually mark it "Used" in the vault, or the Support Agent can catch activation confirmations in email.

---

## How to add real Composio integrations

The agents use Composio to interact with external tools (Gmail, Twitter, etc.). To connect them:

1. Go to [app.composio.dev](https://app.composio.dev) and create an account
2. Connect the apps you want to use:
   - **Gmail** — for Sales Agent (send codes) and Support Agent (read emails)
   - **Twitter/X** — for Marketing Agent (post content)
   - **Google Sheets** — for Analytics Agent (log revenue data)
3. Copy your Composio API key
4. In ESCAPE HQ → Settings, paste your Composio key
5. Click "Test connection" to verify it works
6. Add the key to GitHub secrets as `COMPOSIO_KEY` for automated workflows

The agent executor in `index.html` will automatically switch from demo mode to real API calls once both Composio and Anthropic keys are set.

---

## Local development

No build step needed. Just open `index.html` in your browser.

All data is stored in `localStorage` under the `hq_` prefix. To reset all data, open browser dev tools → Application → Local Storage → delete all `hq_*` keys.

---

## File structure

```
EscapeHQ/
├── index.html                          # The entire app (single file)
├── README.md                           # This file
└── .github/
    └── workflows/
        ├── daily-marketing.yml         # Marketing Agent (daily, 7am UTC)
        ├── weekly-analytics.yml        # Analytics Agent (Mondays, 8am UTC)
        └── sales-monitor.yml           # Sales Agent (every 4 hours)
```

---

## Tech stack

- Pure HTML/CSS/JavaScript — no framework, no build step
- Google Fonts: Fraunces, Hanken Grotesk, JetBrains Mono
- All data in localStorage
- Claude API (claude-sonnet-4-6) for agent intelligence
- Composio for tool integrations (email, social, etc.)

---

Built for ESCAPE — *Most people scroll through life. ESCAPE members live it.*
