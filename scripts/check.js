// Validates the data and checks every JavaScript file for syntax errors.
// "npm run build" runs this. The site needs no bundler, so there is nothing to compile.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { R, VER, citeKey } from "../public/js/data/records.js";
import { buildSystemPrompt } from "../server/prompt.js";
import { cleanMessages } from "../server/ai.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let problems = 0;
const fail = m => { console.error("PROBLEM:", m); problems++; };

const ids = new Set();
for (const r of R) {
  if (ids.has(r.id)) fail("duplicate id " + r.id);
  ids.add(r.id);
  for (const k of ["id", "t", "url", "rid", "sum", "q", "qs", "p"]) if (!r[k]) fail(`${r.id}: missing ${k}`);
  if (!/^https:\/\//.test(r.url || "")) fail(`${r.id}: url must start with https://`);
  if (!Array.isArray(r.f) || !r.f.length) fail(`${r.id}: no findings`);
  if (!VER[r.ver]) fail(`${r.id}: ver must be full, abstract or excerpt`);
  if (!Array.isArray(r.unc) || !Array.isArray(r.lim)) fail(`${r.id}: unc and lim arrays are required`);
  for (const f of r.f) if (!["Experimental observation", "Quantitative measurement", "Model prediction", "Authors’ interpretation"].includes(f[0])) fail(`${r.id}: unknown finding type ${f[0]}`);
}
const keys = new Set(R.map(citeKey));
if (keys.size !== R.length) fail("duplicate citation keys");
console.log(`Records checked: ${R.length}`);

// Guardrails that prevent the assistant from confusing ignition, spread and scale.
const researchPrompt = buildSystemPrompt();
for (const phrase of [
  "A lower flame-spread rate does NOT establish a lower probability of ignition",
  "direct comparison",
  "Do not treat thicker as interchangeable with larger",
  "Model prediction",
  "Search excerpt only (unverified)",
  "The current IGNIS collection does not establish whether larger samples are harder to ignite"
]) {
  if (!researchPrompt.includes(phrase)) fail("assistant evidence policy is missing: " + phrase);
}
if (!researchPrompt.includes("CITATION KEY: [NTRS 20210011521]")) fail("Saffire IV/V citation key missing from assistant context");
console.log("Assistant evidence guardrails checked.");

// Regression tests for multi-turn chat history.
const longAnswer = "A".repeat(2600);
const twoTurnHistory = cleanMessages([
  { role: "user", content: "First question?" },
  { role: "assistant", content: longAnswer },
  { role: "user", content: "A follow-up question?" }
]);
if (!twoTurnHistory || twoTurnHistory.length !== 3 || twoTurnHistory[1].content.length !== 2600) {
  fail("multi-turn chat must accept assistant answers longer than 2,000 characters");
}
if (cleanMessages([{ role: "user", content: "Q".repeat(2001) }]) !== null) {
  fail("user questions longer than 2,000 characters must be rejected");
}
if (cleanMessages([
  { role: "user", content: "Question?" },
  { role: "assistant", content: "Answer." }
]) !== null) {
  fail("chat history must end with a user message");
}
const oversizedHistory = cleanMessages([
  { role: "user", content: "Old question?" },
  { role: "assistant", content: "X".repeat(5000) },
  { role: "user", content: "Recent question?" },
  { role: "assistant", content: "Y".repeat(3000) },
  { role: "user", content: "Newest follow-up?" }
]);
if (!oversizedHistory || oversizedHistory[oversizedHistory.length - 1].content !== "Newest follow-up?") {
  fail("long conversations must retain the newest question while pruning old context");
}
console.log("Multi-turn chat regression checks passed.");


// Secrets must never be committed or served.
const secretRe = /(?:sk-ant-[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{30,})/;
function walkAll(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    if (["node_modules", ".git", "dist"].includes(d.name)) return [];
    return d.isDirectory() ? walkAll(path.join(dir, d.name)) : [path.join(dir, d.name)];
  });
}
for (const f of walkAll(root)) {
  if (/\.(png|ico|zip)$/.test(f)) continue;
  if (path.basename(f) === ".env") { console.warn("Note: a local .env exists. Keep it out of GitHub (it is in .gitignore)."); continue; }
  if (secretRe.test(fs.readFileSync(f, "utf8"))) fail("possible API key in " + path.relative(root, f));
}
for (const f of ["api/chat.js", "api/health.js", "vercel.json"]) if (!fs.existsSync(path.join(root, f))) fail("missing " + f);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}
for (const f of [...walk(path.join(root, "public")), ...walk(path.join(root, "server")), ...walk(path.join(root, "api")), path.join(root, "server.js")]) {
  if (!f.endsWith(".js")) continue;
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail("syntax error in " + path.relative(root, f) + "\n" + e.stderr); }
}
if (problems) { console.error(problems + " problem(s) found."); process.exit(1); }
console.log("All checks passed. No bundling step is needed: the site is plain HTML, CSS and JavaScript.");
