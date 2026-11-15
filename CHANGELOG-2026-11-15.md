# IGNIS AI — final evidence-policy update (15 November 2026)

## Changes in this package

- Rewrote the server-side Gemini research instructions to require direct evidence for the exact outcome asked about.
- Added explicit safeguards separating ignition, flame spread, flame growth, extinction, smoke and heat-release evidence.
- Added explicit distinctions between sample size, thickness, diameter, width, total test scale and material geometry.
- Required the assistant to distinguish experimental observations, quantitative measurements, model predictions, authors' interpretations and IGNIS interpretations.
- Required disclosure of source-review level: full text, abstract only, or search excerpt only.
- Expanded the research context sent to Gemini to include authors, publication metadata, source URL, exact citation key, conditions, findings, mechanisms, uncertainty and limitations.
- Updated citation rendering so malformed DOI-like references are marked as unverified rather than appearing like trusted source citations.
- Added automated build checks for the critical assistant evidence safeguards.
- Updated the README to document these safeguards.

## Validation performed

- `npm run build` — passed.
- `npm test` — passed.
- JavaScript syntax checks — passed.
- 14 research records validated.
- No real Gemini API request was run during this local package review because the API key is intentionally not included in the ZIP. The deployed Vercel environment must retain its existing `GEMINI_API_KEY` setting.

## Scientific limitation retained intentionally

The current 14-record library does not provide a verified, controlled larger-versus-smaller sample comparison of ignition success. The assistant is now instructed to say that the collection does not establish whether larger samples are harder to ignite, rather than substituting flame-spread or large-scale-fire findings as proof.

## Multi-turn chat fix
- Fixed conversation validation so the 2,000-character limit applies to user questions, not Gemini's longer answers.
- Preserved the latest user question while pruning the oldest complete turns if accumulated chat history exceeds the request-size budget.
- Added regression checks for follow-up questions, long AI answers, oversized user questions, and history pruning.
