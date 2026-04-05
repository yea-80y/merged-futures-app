import { readFeedPage, writeFeedPage } from "../swarm/feeds.js";
import { topicReservations } from "../swarm/topics.js";

// Ethereum addresses are 20 bytes. We store them in 32-byte slots by padding
// with 12 leading zero bytes. Max 128 addresses per 4096-byte page.

function packAddresses(addresses: string[]): Uint8Array {
  const page = new Uint8Array(4096);
  const count = Math.min(addresses.length, 128);
  for (let i = 0; i < count; i++) {
    const addr = addresses[i].toLowerCase().replace(/^0x/, "");
    // pad to 32 bytes: 12 zero bytes + 20-byte address
    const slot = new Uint8Array(32);
    for (let j = 0; j < 20; j++) {
      slot[12 + j] = parseInt(addr.slice(j * 2, j * 2 + 2), 16);
    }
    page.set(slot, i * 32);
  }
  return page;
}

function decodeAddresses(page: Uint8Array): string[] {
  const addresses: string[] = [];
  for (let i = 0; i < 128; i++) {
    const off = i * 32;
    // Check if slot is all zeros (end of list)
    let allZero = true;
    for (let j = 0; j < 32; j++) {
      if (page[off + j] !== 0) { allZero = false; break; }
    }
    if (allZero) break;
    // Extract 20-byte address from bytes 12–31
    let hex = "0x";
    for (let j = 12; j < 32; j++) hex += page[off + j].toString(16).padStart(2, "0");
    addresses.push(hex);
  }
  return addresses;
}

export async function getReservations(talkId: string): Promise<string[]> {
  const page = await readFeedPage(topicReservations(talkId));
  if (!page) return [];
  return decodeAddresses(page);
}

export async function toggleReservation(
  talkId: string,
  address: string,
): Promise<{ reserved: boolean; attendees: string[] }> {
  const current = await getReservations(talkId);
  const normalised = address.toLowerCase();
  const idx = current.findIndex(a => a.toLowerCase() === normalised);
  let next: string[];

  if (idx === -1) {
    next = [...current, normalised];
  } else {
    next = current.filter((_, i) => i !== idx);
  }

  await writeFeedPage(topicReservations(talkId), packAddresses(next));
  return { reserved: idx === -1, attendees: next };
}
