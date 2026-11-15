# IGNIS AI

IGNIS AI is an independent research tool for exploring NASA microgravity fire-safety studies, built for the NASA Space Apps Challenge "Flame in Freefall".
**It is not a NASA product, is not endorsed by NASA, and is not a certified fire-safety system.**

## What it contains
- Home with a flame demo and dashboard statistics computed from the real records
- Explore (weighted ranking with placeholder estimates), Research Library (search and filters), study detail pages
- Comparison Lab with fair-comparison statuses, Fire Safety Insights with research gaps
- Science, Methodology, About pages
- An AI research assistant (needs an API key on the server; without one it uses built-in fallback answers)
- A PDF text checker (runs in your browser)

## Technology
Plain HTML, CSS and JavaScript (ES modules, no framework, no bundler) plus a small zero-dependency Node.js server (`server.js`).
The server hosts the website and a safe `/api/chat` endpoint that calls the Anthropic API, so your API key stays on the server and never reaches the browser.

## Folder layout
```
ignis-ai/
  package.json        project settings and commands
  server.js           web server + /api/chat + /api/health
  .env.example        template for your settings (copy to .env)
  .gitignore
  README.md
  scripts/check.js    validates the data and checks all JavaScript (npm run build)
  server/prompt.js    the assistant's rules and the records it may cite
  public/
    index.html        all pages (one page app, hash links like #library)
    favicon.svg
    css/styles.css
    js/main.js        application logic
    js/data/records.js   research library records (edit here to add studies)
    js/data/profiles.js  placeholder investigation profiles for Explore
    js/data/kb.js        background facts and offline fallback answers
```

## Install on Windows (one time)
1. Install **Node.js LTS** from https://nodejs.org (accept the defaults). Version 18 or newer works.
2. Install **Visual Studio Code** from https://code.visualstudio.com
3. Unzip the project, then in VS Code choose File > Open Folder and select the `ignis-ai` folder.
4. Open the terminal: Terminal > New Terminal (it opens PowerShell).
5. Check Node is installed:
```powershell
node -v
npm -v
```

## Run locally
```powershell
npm install
Copy-Item .env.example .env
npm start
```
Open http://localhost:3000 in your browser. Press Ctrl+C in the terminal to stop.
(`npm install` has no packages to download; it simply prepares the project.)

Without an API key the site works fully, and the assistant answers a few common questions from a built-in list. To enable the AI assistant:
1. Create an API key at https://console.anthropic.com (API usage is billed to your account; set a spending limit there).
2. Open `.env` in VS Code and paste it after `ANTHROPIC_API_KEY=` (no quotes, no spaces).
3. Check `ANTHROPIC_MODEL` against the model names in Anthropic's documentation.
4. Stop the server (Ctrl+C) and run `npm start` again. The terminal should say "AI assistant: enabled".

Never share `.env` or commit it to GitHub (`.gitignore` already excludes it).

## "Build" for production
```powershell
npm run build
```
This validates the research records and checks every JavaScript file. The site has no compile step, so there is nothing else to generate.

## Deploy publicly (example: Render, free tier available)
1. Create a GitHub account and a new empty repository.
2. In the VS Code terminal:
```powershell
git init
git add .
git commit -m "IGNIS AI"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/ignis-ai.git
git push -u origin main
```
3. At https://render.com choose New > Web Service, connect the repository, and set:
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment variables: `ANTHROPIC_API_KEY` (your key) and `ANTHROPIC_MODEL`
4. Deploy. Render gives you a public URL. Visitors do not need a Claude account.
Other hosts that run Node (Railway, Fly.io, an Azure/AWS VM) work the same way. Static-only hosts (GitHub Pages, Netlify drop) can show the site but cannot run the AI endpoint, so the assistant would use fallback answers.

## Adding or fixing research records
Edit `public/js/data/records.js`. Each record needs `id`, `t` (title), `url`, `rid`, `sum`, `q`, `qs` (where the question came from), `p`, and `f` (findings). Never add a finding, number or link you have not verified in the source. Run `npm run build` to validate.

## Known limitations
- The library holds 11 records, read at abstract level only (all marked "Unverified candidate source"). It is not the whole NTRS or PSI database.
- Explore scores are placeholder estimates, not NASA ratings.
- The PDF checker extracts text from the first 5 pages only, does not validate it, and does not add it to the library. It loads pdf.js from cdnjs, so it needs an internet connection, as do the Google Fonts (fallback fonts are used offline).
- The AI assistant can be wrong. It is instructed to cite only the library records and to say when evidence is insufficient. Verify important claims in the original papers.
- Rate limit: 15 AI questions per minute per visitor, to protect your API budget.
