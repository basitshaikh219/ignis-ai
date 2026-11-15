# IGNIS AI

IGNIS AI is an independent research exploration and decision-support prototype for the NASA Space Apps Challenge
"Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data".
**It is not a NASA product, NASA does not endorse it, and it is not an operational spacecraft fire-safety system.**

## What it contains
- Home dashboard and educational flame illustration
- Explore: prototype relevance ranking (editorial estimates, with the formula shown)
- Research Library: 14 NASA and journal records with search, filters and source links
- Study pages: conditions, sample size and uncertainty, findings grouped by evidence type, limitations
- Comparison Lab: per-field comparability statuses and an overall verdict that avoids unsupported conclusions
- Fire Safety Insights and Research Gaps
- Science, Methodology and About pages
- AI research assistant: live Google Gemini through a server-side API route, or clearly labelled built-in fallback answers
- Browser-side PDF text checker

## Technology
Plain HTML, CSS and JavaScript (ES modules, no framework or bundler), Node.js serverless functions (`api/`), and a small local Node.js server. The Gemini connection uses Google's HTTPS API directly, so no extra npm dependency is required.

## Folder layout
```
api/chat.js, api/health.js   Vercel serverless functions (POST /api/chat, GET /api/health)
server/ai.js                 shared assistant logic (validation, rate limit, Gemini API call, errors)
server/prompt.js             assistant rules + the records it may cite
server.js                    local development server
vercel.json                  Vercel settings (output folder, function limits, headers)
scripts/check.js             validates data, scans for secrets, syntax-checks JavaScript
public/                      website, styles, application logic and research records
.env.example                 placeholders only; never contains a real API key
```

## Run locally on Windows (PowerShell, inside the project folder)
```powershell
node -v                          # Node.js 18 or newer
npm install
Copy-Item .env.example .env      # edit .env and add your Gemini key after GEMINI_API_KEY=
npm start                        # open http://localhost:3000
npm run build                    # validates records, scans for secrets, checks JavaScript
```
Without a key, the site works and the assistant uses clearly labelled fallback answers.

## Test (Windows PowerShell, inside the project folder)
```powershell
npm test
npm start
```
Open `http://localhost:3000/api/health`. Without a key it should show `"aiConfigured":false`. With a valid key it should show `"aiConfigured":true`, provider `"Google Gemini"`, and the configured model. Then ask the assistant a question.

## Deploy on Vercel
1. Push the project to GitHub. Check that `.env` is NOT tracked: `git ls-files .env` should print nothing.
2. In Vercel, open the project and select Settings > Environment Variables.
3. Add `GEMINI_API_KEY` with your key as the value. Select Production (and Preview if required). Do not put the key in GitHub, frontend files, or `.env.example`.
4. Redeploy so the new environment variable is applied.
5. Open `https://YOUR-SITE.vercel.app/api/health`. It should report `"aiConfigured":true` and `"provider":"Google Gemini"`. Then test the assistant on the live site.

## API key and model notes
Create and manage the key through Google AI Studio. API access, available models, quotas and pricing depend on Google's current account and model terms. The default model is `gemini-3.5-flash-lite`; set `GEMINI_MODEL` in the server environment only if you deliberately choose another model available to your key. Never expose the key in browser-side JavaScript.

## Adding or fixing records
Edit `public/js/data/records.js`. Never add a value, citation or link you have not verified. Set verification honestly (`full`, `abstract` or `excerpt`) and run `npm run build`.

## Known limitations
- 14 hand-selected records; most were read at abstract level. This is not the complete NTRS or PSI database and contains no raw PSI data.
- Explore scores are editorial estimates, not NASA ratings.
- The Comparison Lab compares reported text fields, not raw measurements.
- Rate limiting is per server instance (best effort); serverless instances do not share memory.
- PDF checker and web fonts load from the internet; PDF extraction validates text structure, not scientific claims.
- AI-generated explanations can be wrong. Citations are checked against the library, but the explanation itself still needs human review.
