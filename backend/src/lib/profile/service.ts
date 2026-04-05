import type { Hex0x, UserProfile, UpdateProfileRequest } from "../../shared/types.js";
import { uploadToBytes } from "../swarm/bytes.js";
import {
  readFeedPage,
  writeFeedPage,
  encodeJsonFeed,
  decodeJsonFeed,
} from "../swarm/feeds.js";
import { topicProfileData, topicProfileAvatar } from "../swarm/topics.js";

// ── Read profile ──

export async function getProfile(address: string): Promise<UserProfile | null> {
  const addr = address.toLowerCase() as Hex0x;

  const dataPage = await readFeedPage(topicProfileData(addr));
  let profile: UserProfile | null = null;
  if (dataPage) {
    profile = decodeJsonFeed<UserProfile>(dataPage);
  }

  const avatarPage = await readFeedPage(topicProfileAvatar(addr));
  if (avatarPage) {
    const avatarData = decodeJsonFeed<{ v: 1; avatarRef: string }>(avatarPage);
    if (avatarData?.avatarRef) {
      if (profile) {
        profile.avatarRef = avatarData.avatarRef;
      } else {
        profile = {
          v: 1,
          address: addr,
          avatarRef: avatarData.avatarRef,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  return profile;
}

// ── Update profile ──

export async function updateProfile(
  address: string,
  updates: UpdateProfileRequest,
): Promise<UserProfile> {
  const addr = address.toLowerCase() as Hex0x;

  let existing: UserProfile | null = null;
  const dataPage = await readFeedPage(topicProfileData(addr));
  if (dataPage) {
    existing = decodeJsonFeed<UserProfile>(dataPage);
  }

  const profile: UserProfile = {
    v: 1,
    address: addr,
    displayName: updates.displayName ?? existing?.displayName,
    bio: updates.bio ?? existing?.bio,
    website: updates.website ?? existing?.website,
    twitterHandle: updates.twitterHandle ?? existing?.twitterHandle,
    updatedAt: new Date().toISOString(),
  };

  await writeFeedPage(topicProfileData(addr), encodeJsonFeed(profile));

  if (existing?.avatarRef) {
    profile.avatarRef = existing.avatarRef;
  }

  return profile;
}

// ── Upload avatar ──

export async function uploadAvatar(
  address: string,
  imageData: Uint8Array,
): Promise<string> {
  const addr = address.toLowerCase();

  const avatarRef = await uploadToBytes(imageData);

  const avatarDoc = { v: 1, avatarRef };
  await writeFeedPage(topicProfileAvatar(addr), encodeJsonFeed(avatarDoc));

  return avatarRef;
}
