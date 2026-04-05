import { keccak256, toUtf8Bytes, verifyMessage, getAddress } from "ethers";
import type { SignedPostPayload, CanonicalPost, Hex0x } from "../../shared/types.js";
import { uploadToBytes } from "../swarm/bytes.js";
import {
  readFeedPage,
  writeFeedPage,
  pack4096,
  decode4096,
} from "../swarm/feeds.js";
import { topicBoard, topicThread } from "../swarm/topics.js";

// ── Topic hashing ──

function boardTopicHex(boardId: string): Hex0x {
  return keccak256(toUtf8Bytes(`board:${boardId}`)) as Hex0x;
}

function threadTopicHex(boardId: string, threadRef: string): Hex0x {
  return keccak256(toUtf8Bytes(`thread:${boardId}:${threadRef}`)) as Hex0x;
}

// ── Create post ──

export async function createPost(
  payload: SignedPostPayload,
  signature: Hex0x,
  expectedSigner: string,
): Promise<{ postRef: string; threadRef: string }> {
  // Verify EIP-191 signature
  const payloadJson = JSON.stringify(payload);
  let recovered: string;
  try {
    recovered = verifyMessage(payloadJson, signature);
  } catch {
    throw new Error("Invalid signature");
  }

  // For session-delegated users, the signer is the session key
  // We trust the auth middleware already verified the session → parent binding
  if (recovered.toLowerCase() !== expectedSigner.toLowerCase()) {
    throw new Error("Signature does not match session key");
  }

  // Build canonical post
  const canonical: CanonicalPost = {
    kind: "post",
    payload,
    signature,
    signatureType: "eip191",
    server: {
      receivedAt: Date.now(),
      boardTopic: boardTopicHex(payload.boardId),
      threadTopic: threadTopicHex(
        payload.boardId,
        payload.threadRef ?? "ROOT",
      ),
    },
    v: 1,
  };

  // Upload to Swarm /bytes
  const postRef = await uploadToBytes(JSON.stringify(canonical));

  // Determine thread ref: if this IS a thread root, the threadRef is the post itself
  const isReply = !!payload.threadRef;
  const effectiveThreadRef = isReply ? payload.threadRef! : postRef;

  // Build feed-write tasks (board + thread are independent, run in parallel)
  const feedWrites: Promise<void>[] = [];

  // Update board feed (add thread root if new thread)
  if (!isReply) {
    feedWrites.push(
      (async () => {
        const boardTopic = topicBoard(payload.boardId);
        const existing = await readFeedPage(boardTopic);
        const refs = existing ? decode4096(existing) : [];
        // Newest first for board: prepend
        refs.unshift(postRef);
        await writeFeedPage(boardTopic, pack4096(refs.slice(0, 128)));
      })(),
    );
  }

  // Update thread feed (add post ref)
  feedWrites.push(
    (async () => {
      const tTopic = topicThread(payload.boardId, effectiveThreadRef);
      const existingThread = await readFeedPage(tTopic);
      const threadRefs = existingThread ? decode4096(existingThread) : [];
      threadRefs.unshift(postRef);
      await writeFeedPage(tTopic, pack4096(threadRefs.slice(0, 128)));
    })(),
  );

  await Promise.all(feedWrites);

  return { postRef, threadRef: effectiveThreadRef };
}

// ── Read board (list of thread root refs) ──

export async function getBoard(boardId: string): Promise<string[]> {
  const page = await readFeedPage(topicBoard(boardId));
  if (!page) return [];
  return decode4096(page);
}

// ── Read thread (list of post refs) ──

export async function getThread(boardId: string, threadRef: string): Promise<string[]> {
  const page = await readFeedPage(topicThread(boardId, threadRef));
  if (!page) return [];
  return decode4096(page);
}
