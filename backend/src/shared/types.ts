// ── Hex string types ──
export type Hex0x = `0x${string}`;
export type Hex64 = string; // 64-char hex (32 bytes), no 0x prefix

// ── Auth ──
export type AuthKind = "web3" | "passkey" | "none";

/** Callback that signs EIP-712 typed data */
export type EIP712Signer = (
  domain: Record<string, unknown>,
  types: Record<string, Array<{ name: string; type: string }>>,
  value: Record<string, unknown>,
) => Promise<string>;

/** Info shown to users before signing (passkey confirmation dialog) */
export interface SigningRequestInfo {
  action: string;
  domainName: string;
  fields: Array<{ label: string; value: string }>;
}

/** EIP-712 session delegation message (signed by primary wallet) */
export interface SessionDelegationMessage {
  host: string;
  parent: string;
  session: string;
  purpose: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  sessionProof: string;
  clientCodeHash: string;
  statement: string;
}

/** Session delegation bundle: message + parent's EIP-712 signature */
export interface SessionDelegation {
  message: SessionDelegationMessage;
  parentSig: string;
}

/** EIP-712 POD identity derivation message (deterministic, fixed nonce) */
export interface PodIdentityMessage {
  purpose: string;
  address: string;
  nonce: string;
}

/** Encrypted JSON blob (AES-GCM) */
export interface EncryptedBlob {
  iv: string;
  ct: string;
}

/** Result of verifying a session delegation on the backend */
export interface VerifyDelegationResult {
  valid: boolean;
  parentAddress?: string;
  sessionAddress?: string;
  error?: string;
}

// ── Profile ──
export interface UserProfile {
  v: 1;
  address: Hex0x;
  displayName?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  avatarRef?: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
}

export interface UploadAvatarRequest {
  /** Base64-encoded image data */
  image: string;
}

// ── Forum ──
export interface SignedPostPayload {
  subject: Hex0x;
  boardId: string;
  threadRef?: string;
  content: string;
  contentSha256: Hex0x;
  displayName?: string;
  avatarRef?: string;
  createdAt: number;
  nonce: string;
  version: 1;
}

export interface CanonicalPost {
  kind: "post";
  payload: SignedPostPayload;
  signature: Hex0x;
  signatureType: "eip191";
  server: {
    receivedAt: number;
    boardTopic: Hex0x;
    threadTopic: Hex0x;
  };
  v: 1;
}

// ── POD ──

/** Canonical payload signed by the platform issuer. */
export interface PodPayload {
  kind: "pod";
  v: 1;
  event: string;
  talkId: string;
  talkTitle: string;
  talkTime: string;
  talkRoom: string;
  speakers: string[];
  holder: string;   // lowercase 0x attendee address
  issuedAt: number; // unix ms
  nonce: string;
}

/** Full POD document stored on Swarm bytes. */
export interface PodDocument extends PodPayload {
  issuer: string;    // platform wallet address (lowercase 0x)
  issuerSig: string; // EIP-191 sig over JSON.stringify(PodPayload)
  ref?: string;      // Swarm bytes ref (added client-side after fetch)
}
