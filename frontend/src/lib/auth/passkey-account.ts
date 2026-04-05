/// <reference path="./webauthn-prf.d.ts" />

import { keccak256, Wallet } from 'ethers'
import { StorageKeys, PASSKEY_PRF_SALT_INPUT } from '../shared/constants'
import { getKV, putKV, delKV } from './storage/indexeddb'

interface PasskeyCredentialMeta {
  credentialId: string
  rpId: string
}

function getPasskeyRpId(): string {
  const hostname = window.location.hostname
  // On mf8.eth.limo or subdomains, use shared RP ID
  if (hostname === 'mf8.eth.limo' || hostname.endsWith('.mf8.eth.limo')) {
    return 'mf8.eth.limo'
  }
  return hostname
}

async function getPrfSalt(): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(PASSKEY_PRF_SALT_INPUT))
  return new Uint8Array(hash)
}

function toBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function deriveKey(prfOutput: ArrayBuffer): { address: string; privateKey: string } {
  const prfBytes = new Uint8Array(prfOutput)
  const privateKey = keccak256(prfBytes)
  const wallet = new Wallet(privateKey)
  return { address: wallet.address.toLowerCase(), privateKey }
}

function extractPrfResult(extensions: AuthenticationExtensionsClientOutputs): ArrayBuffer {
  const prf = extensions.prf
  if (!prf?.results?.first) {
    throw new Error('PRF extension did not return a result. Your browser or passkey may not support PRF.')
  }
  return prf.results.first
}

export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  )
}

export async function authenticatePasskey(): Promise<{
  address: string
  privateKey: string
}> {
  const salt = await getPrfSalt()
  const rpId = getPasskeyRpId()

  try {
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId,
        userVerification: 'required',
        extensions: {
          prf: { eval: { first: salt } },
        },
      },
    })) as PublicKeyCredential | null

    if (credential) {
      const prfOutput = extractPrfResult(credential.getClientExtensionResults())
      const meta: PasskeyCredentialMeta = {
        credentialId: toBase64url(credential.rawId),
        rpId,
      }
      await putKV(StorageKeys.PASSKEY_CREDENTIAL, meta)
      return deriveKey(prfOutput)
    }
    throw new Error('Passkey authentication was cancelled.')
  } catch (e) {
    const isNoCredentials =
      e instanceof DOMException && e.name === 'NotAllowedError'
    if (!isNoCredentials) throw e
  }

  return createPasskeyAccount()
}

export async function createPasskeyAccount(): Promise<{
  address: string
  privateKey: string
}> {
  const salt = await getPrfSalt()
  const rpId = getPasskeyRpId()

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Merged Futures 8', id: rpId },
      user: {
        id: crypto.getRandomValues(new Uint8Array(32)),
        name: 'MF8 Account',
        displayName: 'MF8 Account',
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      extensions: {
        prf: { eval: { first: salt } },
      },
    },
  })) as PublicKeyCredential | null

  if (!credential) throw new Error('Passkey creation was cancelled.')

  const extensions = credential.getClientExtensionResults()

  let prfOutput: ArrayBuffer
  if (extensions.prf?.results?.first) {
    prfOutput = extensions.prf.results.first
  } else if (extensions.prf?.enabled) {
    const credentialId = new Uint8Array(credential.rawId)
    const getResult = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId,
        allowCredentials: [{ id: credentialId, type: 'public-key' }],
        userVerification: 'required',
        extensions: {
          prf: { eval: { first: salt } },
        },
      },
    })) as PublicKeyCredential | null

    if (!getResult) throw new Error('Passkey authentication was cancelled.')
    prfOutput = extractPrfResult(getResult.getClientExtensionResults())
  } else {
    throw new Error(
      'Your passkey does not support the PRF extension. ' +
      'Try a different authenticator (e.g. iCloud Keychain, Google Password Manager, or 1Password).',
    )
  }

  const meta: PasskeyCredentialMeta = {
    credentialId: toBase64url(credential.rawId),
    rpId,
  }
  await putKV(StorageKeys.PASSKEY_CREDENTIAL, meta)
  return deriveKey(prfOutput)
}

export async function restorePasskeyAccount(): Promise<{
  address: string
  privateKey: string
}> {
  const meta = await getKV<PasskeyCredentialMeta>(StorageKeys.PASSKEY_CREDENTIAL)
  if (!meta) return authenticatePasskey()

  const salt = await getPrfSalt()
  const credentialId = fromBase64url(meta.credentialId)

  try {
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: meta.rpId,
        allowCredentials: [{ id: credentialId, type: 'public-key' }],
        userVerification: 'required',
        extensions: {
          prf: { eval: { first: salt } },
        },
      },
    })) as PublicKeyCredential | null

    if (!credential) throw new Error('Passkey authentication was cancelled.')
    const prfOutput = extractPrfResult(credential.getClientExtensionResults())
    return deriveKey(prfOutput)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotAllowedError') {
      await delKV(StorageKeys.PASSKEY_CREDENTIAL)
      return authenticatePasskey()
    }
    throw e
  }
}

export async function hasStoredPasskeyCredential(): Promise<boolean> {
  const meta = await getKV<PasskeyCredentialMeta>(StorageKeys.PASSKEY_CREDENTIAL)
  return meta !== null
}

export async function clearPasskeyCredential(): Promise<void> {
  await delKV(StorageKeys.PASSKEY_CREDENTIAL)
}
