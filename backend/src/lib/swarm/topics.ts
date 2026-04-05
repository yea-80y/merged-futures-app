import { Topic } from "@ethersphere/bee-js";

/**
 * Feed topic helpers for MF8.
 * IMPORTANT: These strings are stable — changing them changes the feed address.
 */

const PROFILE_NS = "mf8/profile";
const FORUM_NS = "mf8/forum";
const POD_NS = "mf8/pod";

// ── Profiles ──

export const topicProfileData = (ethAddress: string) =>
  Topic.fromString(`${PROFILE_NS}/data/${ethAddress.toLowerCase()}`);

export const topicProfileAvatar = (ethAddress: string) =>
  Topic.fromString(`${PROFILE_NS}/avatar/${ethAddress.toLowerCase()}`);

// ── Forum ──

export const topicBoard = (boardId: string) =>
  Topic.fromString(`${FORUM_NS}/board/${boardId}`);

export const topicThread = (boardId: string, threadRef: string) =>
  Topic.fromString(`${FORUM_NS}/thread/${boardId}/${threadRef}`);

// ── Reservations ──

const RESERVATIONS_NS = "mf8/reservations";

export const topicReservations = (talkId: string) =>
  Topic.fromString(`${RESERVATIONS_NS}/${talkId}`);

// ── POD Tickets ──

export const topicEditions = (seriesId: string, page = 0) =>
  Topic.fromString(
    page === 0
      ? `${POD_NS}/editions/${seriesId}`
      : `${POD_NS}/editions/${seriesId}/p${page}`,
  );

export const topicClaims = (seriesId: string, page = 0) =>
  Topic.fromString(
    page === 0
      ? `${POD_NS}/claims/${seriesId}`
      : `${POD_NS}/claims/${seriesId}/p${page}`,
  );

export const topicUserCollection = (ethAddress: string) =>
  Topic.fromString(`${POD_NS}/collection/${ethAddress.toLowerCase()}`);
