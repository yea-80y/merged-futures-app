import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { requireAuth } from "../middleware/auth.js";
import { toggleReservation, getReservations } from "../lib/reservations/service.js";
import { issuePod, removePodForTalk } from "../lib/pod/service.js";

export const reservations = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Per-talk queue — serialises all reservation toggles for a given talk so
// each one reads the latest Swarm feed state before writing.
// Same pattern as WoCo's queueSeriesClaim.
// ---------------------------------------------------------------------------

const talkQueues = new Map<string, Promise<void>>();

function queueTalkToggle<T>(talkId: string, fn: () => Promise<T>): Promise<T> {
  const prev = (talkQueues.get(talkId) ?? Promise.resolve()) as Promise<void>;
  const current = prev.then(() => fn());
  // Error-swallowing tail so the chain never permanently breaks
  talkQueues.set(talkId, current.then(() => {}, () => {}));
  return current;
}

// In-flight lock: reject duplicate toggle from same user+talk while processing
const toggleInFlight = new Set<string>();

// POST /api/reservations/toggle — authenticated
// Body: { talkId, talkTitle?, talkTime?, talkRoom?, speakers? }
// Returns: { reserved, count, attendees, podRef? }
reservations.post("/toggle", requireAuth, async (c) => {
  const parentAddress = c.get("parentAddress") as string;
  const body = c.get("body") as Record<string, unknown>;
  const talkId = body.talkId as string;

  if (!talkId || typeof talkId !== "string") {
    return c.json({ ok: false, error: "Missing talkId" }, 400);
  }

  const lockKey = `${talkId}:${parentAddress.toLowerCase()}`;
  if (toggleInFlight.has(lockKey)) {
    return c.json({ ok: false, error: "Toggle already in progress — please wait" }, 429);
  }
  toggleInFlight.add(lockKey);

  try {
    const response = await queueTalkToggle(talkId, async () => {
      const result = await toggleReservation(talkId, parentAddress);

      let podRef: string | undefined;
      if (result.reserved) {
        // Issue POD — if it fails, rollback the reservation
        try {
          podRef = await issuePod(
            talkId,
            (body.talkTitle as string) || talkId,
            (body.talkTime as string) || "",
            (body.talkRoom as string) || "",
            Array.isArray(body.speakers) ? (body.speakers as string[]) : [],
            parentAddress,
          );
        } catch (podErr) {
          console.error("[api] issuePod failed, rolling back reservation:", podErr);
          // Rollback: toggle again to remove the reservation
          await toggleReservation(talkId, parentAddress);
          throw new Error("Failed to issue attendance proof — please try again");
        }
      } else {
        // Remove POD — non-critical, best-effort
        try {
          await removePodForTalk(talkId, parentAddress);
        } catch (podErr) {
          console.error("[api] removePodForTalk error (non-fatal):", podErr);
        }
      }

      return {
        reserved: result.reserved,
        count: result.attendees.length,
        attendees: result.attendees,
        podRef,
      };
    });

    return c.json({ ok: true, data: response });
  } catch (err) {
    console.error("[api] toggleReservation error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ ok: false, error: msg }, 500);
  } finally {
    toggleInFlight.delete(lockKey);
  }
});

// GET /api/reservations/:talkId — public
// Returns: { count: number, attendees: string[] }
reservations.get("/:talkId", async (c) => {
  const talkId = c.req.param("talkId");

  try {
    const attendees = await getReservations(talkId);
    return c.json({ ok: true, data: { count: attendees.length, attendees } });
  } catch (err) {
    console.error("[api] getReservations error:", err);
    return c.json({ ok: false, error: "Failed to load reservations" }, 500);
  }
});

// POST /api/reservations/bulk — public
// Body: { talkIds: string[] }
// Returns: { counts, attendees }
reservations.post("/bulk", async (c) => {
  let body: { talkIds?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const talkIds = body.talkIds;
  if (!Array.isArray(talkIds)) {
    return c.json({ ok: false, error: "talkIds must be an array" }, 400);
  }

  try {
    const counts: Record<string, number> = {};
    const allAttendees: Record<string, string[]> = {};

    await Promise.all(
      (talkIds as string[]).map(async (id) => {
        const attendees = await getReservations(id);
        counts[id] = attendees.length;
        allAttendees[id] = attendees;
      }),
    );

    return c.json({ ok: true, data: { counts, attendees: allAttendees } });
  } catch (err) {
    console.error("[api] bulk reservations error:", err);
    return c.json({ ok: false, error: "Failed to load reservations" }, 500);
  }
});
