/**
 * Type augmentation for the WebAuthn PRF extension.
 */

interface AuthenticationExtensionsClientInputs {
  prf?: {
    eval?: {
      first: BufferSource;
      second?: BufferSource;
    };
    evalByCredential?: Record<
      string,
      { first: BufferSource; second?: BufferSource }
    >;
  };
}

interface AuthenticationExtensionsClientOutputs {
  prf?: {
    enabled?: boolean;
    results?: {
      first?: ArrayBuffer;
      second?: ArrayBuffer;
    };
  };
}
