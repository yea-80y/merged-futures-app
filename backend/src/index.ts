import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.js";
import { profiles } from "./routes/profiles.js";
import { forum } from "./routes/forum.js";
import { reservations } from "./routes/reservations.js";
import { pods } from "./routes/pods.js";
import { BEE_URL, POSTAGE_BATCH_ID } from "./config/swarm.js";

const app = new Hono<AppEnv>();

// CORS
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Session-Address",
      "X-Session-Delegation",
    ],
  }),
);

// Health check
app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "mf8-server",
    timestamp: new Date().toISOString(),
    swarm: BEE_URL,
    hasBatch: !!POSTAGE_BATCH_ID,
  }),
);

// Swarm proxy — allows frontend to read from Swarm via backend
// (avoids CORS issues with some Swarm gateways)
app.get("/api/swarm/bytes/:ref", async (c) => {
  const ref = c.req.param("ref");
  try {
    const res = await fetch(`${BEE_URL}/bytes/${ref}`);
    if (!res.ok) return c.json({ ok: false, error: "Not found" }, 404);
    const data = await res.arrayBuffer();
    return c.body(data, 200, {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } catch {
    return c.json({ ok: false, error: "Failed to fetch from Swarm" }, 502);
  }
});

// Mount routes
app.route("/api/profile", profiles);
app.route("/api/forum", forum);
app.route("/api/reservations", reservations);
app.route("/api/pods", pods);

// Start
const port = parseInt(process.env.PORT || "3001", 10);
console.log(`[mf8] Server starting on port ${port}`);
console.log(`[mf8] Swarm gateway: ${BEE_URL}`);
console.log(`[mf8] Postage batch: ${POSTAGE_BATCH_ID ? POSTAGE_BATCH_ID.slice(0, 16) + "..." : "NOT SET"}`);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[mf8] Server running at http://localhost:${info.port}`);
});
