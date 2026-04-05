import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { getUserCollection } from "../lib/pod/service.js";
import { downloadFromBytes } from "../lib/swarm/bytes.js";
import type { PodDocument } from "../shared/types.js";

export const pods = new Hono<AppEnv>();

// GET /api/pods/:address — public
// Returns the holder's full POD collection (documents, not just refs)
pods.get("/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  try {
    const refs = await getUserCollection(address);
    if (refs.length === 0) {
      return c.json({ ok: true, data: [] });
    }

    const documents = await Promise.all(
      refs.map(async (ref) => {
        try {
          const text = await downloadFromBytes(ref);
          const doc = JSON.parse(text) as PodDocument;
          return { ...doc, ref };
        } catch {
          return null;
        }
      }),
    );

    const valid = documents.filter((d): d is PodDocument & { ref: string } => d !== null);
    return c.json({ ok: true, data: valid });
  } catch (err) {
    console.error("[api] getUserCollection error:", err);
    return c.json({ ok: false, error: "Failed to load collection" }, 500);
  }
});
