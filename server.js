// IGNIS AI server: serves the website and a safe /api/chat proxy to the Google Gemini API.
// Zero dependencies. Requires Node.js 18 or newer.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleChat, health, config } from "./server/ai.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");

// Minimal .env loader for LOCAL use only (real environment variables take priority).
// On Vercel there is no .env file: set variables in the dashboard instead.
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

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"
};

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

async function chat(req, res) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  let data = null;
  try { data = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: "BAD_REQUEST", message: "Invalid request." }); }
  const out = await handleChat(data, ip);
  json(res, out.status, out.body);
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
  if (req.method === "GET" && p === "/api/health") return json(res, 200, health());
  if (req.method === "POST" && p === "/api/chat") return chat(req, res);
  if (p === "/api/chat") return send(res, 405, JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Use POST." }), { "Content-Type": "application/json", Allow: "POST" });
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
  send(res, 405, "Method not allowed");
});

server.listen(PORT, () => {
  const c = config();
  console.log(`IGNIS AI running at http://localhost:${PORT}`);
  console.log(c.key ? `AI assistant: enabled with Google Gemini (model ${c.model})` : "AI assistant: no API key set, using built-in fallback answers");
});
