// Vercel serverless function: GET /api/health
import { health } from "../server/ai.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(health());
}
