# IGNIS AI

IGNIS AI is an independent research exploration and decision-support prototype for the NASA Space Apps Challenge
"Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data".
**It is not a NASA product, NASA does not endorse it, and it is not an operational spacecraft fire-safety system.**

## What it contains
- Home with a dashboard computed from the real records, and an educational flame illustration
- Explore: prototype relevance ranking (editorial estimates, with the formula shown)
- Research Library: 14 real NASA and journal records with search and filters; each links to its source and shows what was actually read
- Study pages: conditions, sample size and uncertainty, findings grouped by evidence type, limitations
- Comparison Lab: per-field comparability statuses and an overall verdict that refuses unsupported conclusions
- Fire Safety Insights and Research Gaps
- Science, Methodology, About
- AI assistant (live Claude through a server route, or labelled built-in fallback answers) and a browser-side PDF text checker

## Technology
Plain HTML, CSS and JavaScript (ES modules, no framework, no bundler) and Node.js serverless functions (`api/`).
Locally, `server.js` serves the site and the same functions. Zero npm dependencies.

## Folder layout
```
api/chat.js, api/health.js   Vercel serverless functions (POST /api/chat, GET /api/health)
server/ai.js                 shared assistant logic (validation, rate limit, Anthropic call, errors)
server/prompt.js             assistant rules + the records it may cite
server.js                    local development server (uses server/ai.js)
vercel.json                  Vercel settings (output folder, function limits, headers)
scripts/check.js             validates data, scans for secrets, syntax-checks all JavaScript
public/                      the website (index.html, css/, js/, js/data/records.js ...)
.env.example                 placeholders only
```

## Run locally on Windows (PowerShell, inside the project folder)
```powershell
node -v                          # Node.js 18 or newer
npm install
Copy-Item .env.example .env      # then edit .env and paste your key after ANTHROPIC_API_KEY=
npm start                        # open http://localhost:3000
npm run build                    # validates data, scans for secrets, checks JavaScript
```
Without a key the site works and the assistant says it is in fallback mode.

## Test (Windows PowerShell, inside the project folder)
```powershell
npm test            # same as: npm run build. Validates the records, scans for secrets, syntax-checks all JavaScript
npm start           # then open http://localhost:3000/api/health
```
Without a key, `/api/health` must show `"aiConfigured":false`, and the Ask AI page must say "Fallback mode" and label every answer "Built-in fallback answer". With a valid key in `.env`, it shows `"aiConfigured":true` and the page says "Live AI mode".
Manual check: open every menu page, search the Library, open a study, compare two studies, ask the assistant a question.

## Deploy on Vercel
1. Push the project to GitHub. Check that `.env` is NOT tracked: `git ls-files .env` should print nothing.
2. In Vercel, import the repository. Framework Preset: Other. `vercel.json` sets the build command and output folder (`public`).
3. Project > Settings > Environment Variables: add `ANTHROPIC_API_KEY` (value = your key; Production, and Preview if you want; use the Sensitive option).
4. Deployments > the latest deployment > Redeploy. Environment variable changes only apply to NEW deployments.
5. Open `https://YOUR-SITE.vercel.app/api/health`. It must show `"aiConfigured":true`. Then ask the assistant a question.

## Adding or fixing records
Edit `public/js/data/records.js`. Never add a value, citation or link you have not verified. Set `ver` honestly (`full`, `abstract` or `excerpt`) and run `npm run build`.

## Known limitations
- 14 hand-selected records, most read at abstract level; not all of NTRS or the PSI database. No raw PSI data.
- Explore scores are editorial estimates, not NASA ratings.
- The Comparison Lab compares reported text fields, not raw measurements.
- Rate limiting is per server instance (best effort): serverless instances do not share memory.
- PDF checker and web fonts load from the internet (cdnjs, Google Fonts); it extracts text only and validates nothing.
- The AI can be wrong. Citations are checked against the library, but the explanation text is not.
