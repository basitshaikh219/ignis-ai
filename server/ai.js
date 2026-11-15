// Shared assistant logic used by the Vercel functions (api/*.js) and local server (server.js).
// The Gemini API key is read ONLY from the server-side GEMINI_API_KEY environment variable.
import { buildSystemPrompt } from "./prompt.js";

const SYSTEM = buildSystemPrompt();
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const TIMEOUT_MS = 25000;
const LIMIT_PER_MIN = 15;
const hits = new Map(); // best effort only: serverless instances do not share memory

export function config() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  const placeholder = !key || /^(your|changeme|placeholder|replace-me)/i.test(key);
  return {
    key: placeholder ? "" : key,
    // Low-cost stable Flash-Lite default. Override with GEMINI_MODEL if needed.
    model: (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim()
  };
}

export function health() {
  const c = config();
  // Never include the key itself.
  return { ok: true, aiConfigured: Boolean(c.key), provider: c.key ? "Google Gemini" : null, model: c.key ? c.model : null, fallbackAvailable: true };
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
  // The 2,000-character limit applies to user questions, not Gemini answers.
  // Rejecting longer assistant answers caused follow-up turns to fail.
  if (msgs.some(m => m.role === "user" && m.content.length > 2000)) return null;
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  const out = [];
  for (const m of msgs) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += "\\n" + m.content;
    else out.push({ ...m });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;

  // Keep the newest conversation context within the request-size budget.
  // Drop oldest complete turns, never the newest user question.
  const totalChars = () => out.reduce((n, m) => n + m.content.length, 0);
  while (totalChars() > 9000 && out.length > 1) {
    out.shift(); // oldest user message
    if (out.length && out[0].role === "assistant") out.shift();
  }
  if (!out.length || out[out.length - 1].role !== "user" || totalChars() > 9000) return null;
  return out;
}

const fail = (status, error, message) => ({ status, body: { error, message } });

export async function handleChat(body, ip = "unknown") {
  const c = config();
  if (!c.key) return fail(503, "AI_NOT_CONFIGURED", "The AI service is not configured on this server.");
  if (limited(ip)) return fail(429, "RATE_LIMIT", "Too many questions. Please wait a minute and try again.");
  const messages = cleanMessages(body && body.messages);
  if (!messages) return fail(400, "BAD_REQUEST", "Send 1 to 8 messages, ending with a question from the user (max 2000 characters each).");

  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  try {
    const url = `${API_BASE}${encodeURIComponent(c.model)}:generateContent?key=${encodeURIComponent(c.key)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { maxOutputTokens: 4096 }
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      const status = out?.error?.status || "";
      // Do not log the request URL: it contains the API key.
      console.error("Gemini API error", r.status, status);
      if (r.status === 401 || r.status === 403 || status === "PERMISSION_DENIED" || status === "UNAUTHENTICATED") {
        return fail(502, "AI_AUTH_ERROR", "Google Gemini rejected the server credentials. The site owner must check the API key and its permissions.");
      }
      if (r.status === 429 || status === "RESOURCE_EXHAUSTED") {
        return fail(429, "AI_RATE_LIMIT", "Gemini is busy or the API quota has been reached. Please try again later.");
      }
      if (r.status === 400 || r.status === 404) {
        return fail(502, "AI_CONFIG_ERROR", "Gemini rejected the request. Check the model name and API configuration.");
      }
      return fail(502, "AI_UPSTREAM_ERROR", "The Gemini service returned an error (status " + r.status + ").");
    }

    const candidate = out?.candidates?.[0];
    const text = (candidate?.content?.parts || []).map(p => p.text || "").join("\n").trim();
    if (!text) {
      const reason = candidate?.finishReason || out?.promptFeedback?.blockReason || "no text returned";
      console.error("Gemini returned no text", reason);
      return fail(502, "AI_EMPTY", "Gemini could not return a text answer for this request. Please rephrase your question.");
    }
    return {
      status: 200,
      body: {
        text,
        truncated: candidate?.finishReason === "MAX_TOKENS",
        model: c.model
      }
    };
  } catch (e) {
    console.error("Gemini chat error:", e && e.name);
    if (e && (e.name === "TimeoutError" || e.name === "AbortError")) return fail(504, "AI_TIMEOUT", "Gemini took too long to answer.");
    return fail(502, "AI_UNREACHABLE", "Could not reach the Gemini service.");
  }
}
