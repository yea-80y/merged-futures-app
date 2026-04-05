/** IndexedDB database name */
export const IDB_NAME = "mf8-auth";

/** IndexedDB object store name */
export const IDB_STORE = "kv";

/** Storage keys for IndexedDB */
export const StorageKeys = {
  DEVICE_KEY: "mf8:device-key",
  AUTH_KIND: "mf8:auth:kind",
  PARENT_ADDRESS: "mf8:auth:parent",
  SESSION_KEY: "mf8:auth:session-key",
  SESSION_DELEGATION: "mf8:auth:session-delegation",
  POD_SEED: "mf8:auth:pod-seed",
  PASSKEY_CREDENTIAL: "mf8:auth:passkey-credential",
} as const;

/** Fixed salt input for passkey PRF → secp256k1 key derivation */
export const PASSKEY_PRF_SALT_INPUT = "mf8-passkey-secp256k1-v1";

/** Fixed nonce for deterministic POD identity derivation */
export const POD_IDENTITY_NONCE = "MF8-POD-IDENTITY-V1";

/** Session delegation expiry duration (1 year in ms) */
export const SESSION_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

/** Session delegation purpose string */
export const SESSION_PURPOSE = "session";
