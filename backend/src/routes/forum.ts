import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { requireAuth } from "../middleware/auth.js";
import { createPost, getBoard, getThread } from "../lib/forum/service.js";
import { downloadFromBytes } from "../lib/swarm/bytes.js";
import type { SignedPostPayload, Hex0x, CanonicalPost } from "../shared/types.js";

export const forum = new Hono<AppEnv>();

// POST /api/forum/post — authenticated, create a new post
forum.post("/post", requireAuth, async (c) => {
  const sessionAddress = c.get("sessionAddress") as string;
  const body = c.get("body") as Record<string, unknown>;

  const payload = body.payload as SignedPostPayload;
  const signature = body.signature as Hex0x;

  if (!payload || !signature) {
    return c.json({ ok: false, error: "Missing payload or signature" }, 400);
  }

  try {
    const result = await createPost(payload, signature, sessionAddress);
    return c.json({ ok: true, data: result });
  } catch (err) {
    console.error("[api] createPost error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ ok: false, error: msg }, 400);
  }
});

// GET /api/forum/board?boardId=... — public, list thread roots
forum.get("/board", async (c) => {
  const boardId = c.req.query("boardId");
  if (!boardId) {
    return c.json({ ok: false, error: "Missing boardId" }, 400);
  }

  try {
    const threads = await getBoard(boardId);
    return c.json({ ok: true, data: { boardId, threads } });
  } catch (err) {
    console.error("[api] getBoard error:", err);
    return c.json({ ok: false, error: "Failed to load board" }, 500);
  }
});

// GET /api/forum/thread?boardId=...&threadRef=... — public, list posts in thread
forum.get("/thread", async (c) => {
  const boardId = c.req.query("boardId");
  const threadRef = c.req.query("threadRef");
  if (!boardId || !threadRef) {
    return c.json({ ok: false, error: "Missing boardId or threadRef" }, 400);
  }

  try {
    const posts = await getThread(boardId, threadRef);
    return c.json({ ok: true, data: { boardId, threadRef, posts } });
  } catch (err) {
    console.error("[api] getThread error:", err);
    return c.json({ ok: false, error: "Failed to load thread" }, 500);
  }
});

// ── Bulk-resolve endpoints (eliminate N frontend requests) ──

// GET /api/forum/board-posts?boardId=... — resolve all board refs to post data
forum.get("/board-posts", async (c) => {
  const boardId = c.req.query("boardId");
  if (!boardId) {
    return c.json({ ok: false, error: "Missing boardId" }, 400);
  }

  try {
    const refs = await getBoard(boardId);
    const posts = await Promise.all(
      refs.map(async (ref): Promise<CanonicalPost | null> => {
        try {
          const raw = await downloadFromBytes(ref);
          return JSON.parse(raw) as CanonicalPost;
        } catch {
          return null;
        }
      }),
    );
    return c.json({ ok: true, data: { posts, refs } });
  } catch (err) {
    console.error("[api] board-posts error:", err);
    return c.json({ ok: false, error: "Failed to load board posts" }, 500);
  }
});

// GET /api/forum/thread-posts?boardId=...&threadRef=... — resolve all thread refs to post data
forum.get("/thread-posts", async (c) => {
  const boardId = c.req.query("boardId");
  const threadRef = c.req.query("threadRef");
  if (!boardId || !threadRef) {
    return c.json({ ok: false, error: "Missing boardId or threadRef" }, 400);
  }

  try {
    const refs = await getThread(boardId, threadRef);
    const posts = await Promise.all(
      refs.map(async (ref): Promise<CanonicalPost | null> => {
        try {
          const raw = await downloadFromBytes(ref);
          return JSON.parse(raw) as CanonicalPost;
        } catch {
          return null;
        }
      }),
    );
    return c.json({ ok: true, data: { posts, refs } });
  } catch (err) {
    console.error("[api] thread-posts error:", err);
    return c.json({ ok: false, error: "Failed to load thread posts" }, 500);
  }
});
