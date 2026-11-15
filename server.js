// IGNIS AI server: serves the website and a safe /api/chat proxy to the Anthropic API.
// Zero dependencies. Requires Node.js 18 or newer.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSystemPrompt } from "./server/prompt.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");

// Minimal .env loader (keeps real environment variables as the priority).
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
const SYSTEM = buildSystemPrompt();

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"
};

// Simple per-IP rate limit: 15 questions per minute.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 15;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers
  });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { "Content-Type": "application/json" });

function readBody(req, limit = 30000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > limit) { reject(new Error("too_large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  let msgs = input.slice(-8)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

async function chat(req, res) {
  if (!API_KEY) return json(res, 503, { error: "AI_NOT_CONFIGURED", message: "No API key is set on the server." });
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  if (limited(ip)) return json(res, 429, { error: "RATE_LIMIT", message: "Too many questions. Please wait a minute." });
  let data;
  try { data = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: "BAD_REQUEST", message: "Invalid request." }); }
  const messages = cleanMessages(data.messages);
  if (!messages) return json(res, 400, { error: "BAD_REQUEST", message: "A user question is required." });
  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, system: SYSTEM, messages }),
      signal: AbortSignal.timeout(60000)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Anthropic API error", r.status, out && out.error && out.error.type);
      return json(res, 502, { error: "AI_UPSTREAM_ERROR", message: "The AI service returned an error (status " + r.status + ")." });
    }
    const text = (out.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!text) return json(res, 502, { error: "AI_EMPTY", message: "The AI service returned no text." });
    json(res, 200, { text });
  } catch (e) {
    console.error("Chat error:", e.name);
    json(res, 504, { error: "AI_UNREACHABLE", message: "Could not reach the AI service." });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.normalize(path.join(PUBLIC, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "Not found", { "Content-Type": "text/plain" });
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const p = (req.url || "").split("?")[0];
  if (req.method === "GET" && p === "/api/health") return json(res, 200, { ok: true, aiConfigured: Boolean(API_KEY) });
  if (req.method === "POST" && p === "/api/chat") return chat(req, res);
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
  send(res, 405, "Method not allowed");
});

server.listen(PORT, () => {
  console.log(`IGNIS AI running at http://localhost:${PORT}`);
  console.log(API_KEY ? `AI assistant: enabled (model ${MODEL})` : "AI assistant: no API key set, using built-in fallback answers");
});
