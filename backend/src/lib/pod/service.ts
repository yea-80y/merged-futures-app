import { Wallet } from "ethers";
import { FEED_PRIVATE_KEY, normalizePk } from "../../config/swarm.js";
import { uploadToBytes, downloadFromBytes } from "../swarm/bytes.js";
import { readFeedPage, writeFeedPage, pack4096, decode4096 } from "../swarm/feeds.js";
import { topicUserCollection } from "../swarm/topics.js";
import type { PodPayload, PodDocument } from "../../shared/types.js";

let _wallet: Wallet | null = null;
function getPlatformWallet(): Wallet {
  if (!_wallet) _wallet = new Wallet(normalizePk(FEED_PRIVATE_KEY));
  return _wallet;
}

export async function issuePod(
  talkId: string,
  talkTitle: string,
  talkTime: string,
  talkRoom: string,
  speakers: string[],
  holderAddress: string,
): Promise<string> {
  const wallet = getPlatformWallet();

  const payload: PodPayload = {
    kind: "pod",
    v: 1,
    event: "Merged Futures 8",
    talkId,
    talkTitle,
    talkTime,
    talkRoom,
    speakers,
    holder: holderAddress.toLowerCase(),
    issuedAt: Date.now(),
    nonce: crypto.randomUUID(),
  };

  const issuerSig = await wallet.signMessage(JSON.stringify(payload));

  const pod: PodDocument = {
    ...payload,
    issuer: wallet.address.toLowerCase(),
    issuerSig,
  };

  const podRef = await uploadToBytes(JSON.stringify(pod));

  // Append to the holder's collection feed, replacing any existing POD for this talkId
  const topic = topicUserCollection(holderAddress);
  const existing = await readFeedPage(topic);
  const refs = existing ? decode4096(existing) : [];

  // Remove any old PODs for this talk (prevents duplicates on re-reserve)
  const cleanRefs = await filterOutTalkRefs(refs, talkId);

  cleanRefs.unshift(podRef);
  await writeFeedPage(topic, pack4096(cleanRefs.slice(0, 128)));

  return podRef;
}

/** Remove all POD refs for a given talkId from the holder's collection feed. */
export async function removePodForTalk(
  talkId: string,
  holderAddress: string,
): Promise<void> {
  const topic = topicUserCollection(holderAddress);
  const existing = await readFeedPage(topic);
  if (!existing) return;

  const refs = decode4096(existing);
  if (refs.length === 0) return;

  const cleanRefs = await filterOutTalkRefs(refs, talkId);
  if (cleanRefs.length === refs.length) return; // nothing removed

  await writeFeedPage(topic, pack4096(cleanRefs));
}

/** Download each ref, parse the POD JSON, and keep only those NOT matching talkId. */
async function filterOutTalkRefs(refs: string[], talkId: string): Promise<string[]> {
  const results = await Promise.all(
    refs.map(async (ref) => {
      try {
        const text = await downloadFromBytes(ref);
        const doc = JSON.parse(text) as PodDocument;
        return doc.talkId === talkId ? null : ref;
      } catch {
        // Can't read it — keep it so we don't accidentally delete unrelated data
        return ref;
      }
    }),
  );
  return results.filter((r): r is string => r !== null);
}

export async function getUserCollection(holderAddress: string): Promise<string[]> {
  const topic = topicUserCollection(holderAddress);
  const page = await readFeedPage(topic);
  if (!page) return [];
  return decode4096(page);
}
