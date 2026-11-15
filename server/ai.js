// Shared assistant logic used by the Vercel functions (api/*.js) and by the local server (server.js).
// The API key is read ONLY from the server-side environment variable ANTHROPIC_API_KEY.
import { buildSystemPrompt } from "./prompt.js";

const SYSTEM = buildSystemPrompt();
const API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 25000;
const LIMIT_PER_MIN = 15;
const hits = new Map(); // best effort only: serverless instances do not share memory

export function config() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  const placeholder = !key || /^(your|sk-ant-x+|changeme|placeholder)/i.test(key);
  return {
    key: placeholder ? "" : key,
    // Model ID verified in Anthropic's models overview (Claude Sonnet 5.5). Override with ANTHROPIC_MODEL.
    model: (process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5").trim(),
    effort: (process.env.ANTHROPIC_EFFORT || "medium").trim()
  };
}

export function health() {
  const c = config();
  // Never include the key itself.
  return { ok: true, aiConfigured: Boolean(c.key), model: c.key ? c.model : null, fallbackAvailable: true };
}

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > LIMIT_PER_MIN;
}

export function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const msgs = input.slice(-8)
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }));
  if (msgs.some(m => m.content.length > 2000)) return null; // reject rather than silently truncate
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  // Merge consecutive same-role messages so the API accepts the list.
  const out = [];
  for (const m of msgs) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += "\n" + m.content;
    else out.push({ ...m });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;
  if (out.reduce((n, m) => n + m.content.length, 0) > 9000) return null;
  return out;
}

const fail = (status, error, message) => ({ status, body: { error, message } });

export async function handleChat(body, ip = "unknown") {
  const c = config();
  if (!c.key) return fail(503, "AI_NOT_CONFIGURED", "The AI service is not configured on this server.");
  if (limited(ip)) return fail(429, "RATE_LIMIT", "Too many questions. Please wait a minute and try again.");
  const messages = cleanMessages(body && body.messages);
  if (!messages) return fail(400, "BAD_REQUEST", "Send 1 to 8 messages, ending with a question from the user (max 2000 characters each).");
  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": c.key, "anthropic-version": "2023-06-01" },
      // Thinking tokens count toward max_tokens, so leave room for them.
      body: JSON.stringify({ model: c.model, max_tokens: 4096, system: SYSTEM, messages, output_config: { effort: c.effort } }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      const type = out && out.error && out.error.type;
      console.error("Anthropic API error", r.status, type);
      if (r.status === 401 || r.status === 403) return fail(502, "AI_AUTH_ERROR", "The AI service rejected the server’s credentials. The site owner must check the API key.");
      if (r.status === 429) return fail(429, "AI_RATE_LIMIT", "The AI service is busy or over its limit. Please try again shortly.");
      if (r.status === 404 || r.status === 400) return fail(502, "AI_CONFIG_ERROR", "The AI service rejected the request (check the model name and settings).");
      return fail(502, "AI_UPSTREAM_ERROR", "The AI service returned an error (status " + r.status + ").");
    }
    const text = (out.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!text) return fail(502, "AI_EMPTY", "The AI service returned no text.");
    return { status: 200, body: { text, truncated: out.stop_reason === "max_tokens", model: c.model } };
  } catch (e) {
    console.error("Chat error:", e && e.name);
    if (e && (e.name === "TimeoutError" || e.name === "AbortError")) return fail(504, "AI_TIMEOUT", "The AI service took too long to answer.");
    return fail(502, "AI_UNREACHABLE", "Could not reach the AI service.");
  }
}
