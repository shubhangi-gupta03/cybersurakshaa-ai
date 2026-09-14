# CyberSuraksha AI v2.0 — Production Setup Guide
# PS 26184 · SIH 2026 · Ministry of Home Affairs / I4C

## What this system does differently from v1
- Live data scraped from The420.in, PIB, Google News, Telegram every 5 minutes
- Real-time alert popups via Supabase Realtime (no page refresh needed)
- Groq API key stays server-side (never exposed in frontend code)
- Evidence hashes stored in real Supabase PostgreSQL database
- ML predictions via real Netlify function (not hardcoded)

---

## Step 1 — Create Supabase project (5 minutes)

1. Go to https://supabase.com → Sign up → New project
2. Choose a name: `cybersuraksha`
3. Set a strong database password (save it)
4. Choose region: Asia South (Mumbai) → Create project
5. Wait ~2 minutes for project to initialize
6. Go to: Settings → API
7. Copy these two values:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon public key** → long JWT starting with `eyJ...`
   - **service_role key** → another long JWT (keep this SECRET)

8. Go to: SQL Editor → New query
9. Paste the entire contents of `scripts/schema.sql`
10. Click Run → should say "Success"

---

## Step 2 — Get Groq API key (2 minutes)

1. Go to https://console.groq.com
2. Sign up / Login
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Save it — you'll add it to Netlify later

---

## Step 3 — Set up project locally (5 minutes)

```bash
# 1. Extract the ZIP, open terminal in the folder
cd cybersuraksha-ai

# 2. Install dependencies
npm install

# 3. Create local env file
cp .env.example .env.local

# 4. Edit .env.local with your Supabase values:
# VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 5. Test locally (optional)
npm run dev
# Open http://localhost:5173
```

---

## Step 4 — Deploy to Netlify (5 minutes)

### Option A: Drag and Drop (Fastest)
1. Run: `npm run build`
2. Go to https://app.netlify.com
3. Drag the `dist/` folder into the deploy box
4. Get your URL

### Option B: GitHub (Auto-deploys on push — Recommended)
1. Push this folder to GitHub:
```bash
git init
git add .
git commit -m "CyberSuraksha AI v2.0 - Production"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cybersuraksha-ai.git
git push -u origin main
```
2. Go to https://app.netlify.com → Add new site → Import from GitHub
3. Select your repo → Build command: `npm run build` → Publish dir: `dist`
4. Click Deploy

---

## Step 5 — Add Environment Variables to Netlify (2 minutes)

Go to: Netlify dashboard → Your site → Site settings → Environment variables

Add these variables:
```
VITE_SUPABASE_URL         = https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY    = eyJhbGc... (anon/public key)
SUPABASE_URL              = https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY      = eyJhbGc... (service_role key — KEEP SECRET)
GROQ_API_KEY              = gsk_... (your Groq key)
```

Then: Deploys → Trigger deploy → Deploy site

---

## Step 6 — Change site name (1 minute)

Netlify → Site settings → Change site name → `cybersuraksha-ai`

Your live URL: https://cybersuraksha-ai.netlify.app

---

## How the data refresh works

```
Every 5 minutes (Netlify scheduled function):
  → Scrapes The420.in RSS feed
  → Scrapes PIB press release RSS
  → Scrapes Google News (cybercrime india queries)
  → Reads Telegram @cyberdost public channel
  → Extracts: state, amount, crime type, severity
  → Stores new alerts in Supabase
  → Supabase Realtime pushes to all browsers instantly
  → Alert popup appears on officer screens in < 3 seconds
```

---

## Architecture summary

```
Data Sources (every 5 min)
├── Google News RSS     → free, no key
├── The420.in RSS       → free, no key  
├── PIB RSS             → free, official govt
└── Telegram web        → free, public channels

Netlify Functions (serverless)
├── scrape.js           → runs every 5 min (scheduled)
├── stats.js            → GET /api/stats
├── alerts.js           → GET /api/alerts
├── chat.js             → POST /api/chat (Groq proxy)
├── evidence.js         → POST /api/evidence
└── predict.js          → GET /api/predict

Supabase (PostgreSQL)
├── alerts              → live alert feed
├── state_risk          → per-state risk scores
├── evidence_chain      → SHA-256 hashes
├── predictions         → ML outputs
└── scraped_stats       → parsed news numbers

React Frontend (Netlify CDN)
├── Fetches from /api/* endpoints
├── Supabase Realtime subscription
└── Alert popups on new DB inserts

Cost: ₹0 / month
```

---

## For SIH Demo Day

Before presenting:
1. Open your Netlify URL
2. Login as `lea / lea123`
3. Dashboard shows live scraped data with timestamp
4. Alert tab shows real news articles as alerts
5. Upload a file in Evidence → real SHA-256 computed → stored in Supabase
6. AI chat connects to Groq via server-side proxy

The "Last updated" timestamp on dashboard shows judges data is actually being scraped — not hardcoded.
