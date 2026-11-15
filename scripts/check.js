// Validates the data and checks every JavaScript file for syntax errors.
// "npm run build" runs this. The site needs no bundler, so there is nothing to compile.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { R } from "../public/js/data/records.js";

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
}
console.log(`Records checked: ${R.length}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}
for (const f of [...walk(path.join(root, "public")), ...walk(path.join(root, "server")), path.join(root, "server.js")]) {
  if (!f.endsWith(".js")) continue;
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail("syntax error in " + path.relative(root, f) + "\n" + e.stderr); }
}
if (problems) { console.error(problems + " problem(s) found."); process.exit(1); }
console.log("All checks passed. No bundling step is needed: the site is plain HTML, CSS and JavaScript.");
