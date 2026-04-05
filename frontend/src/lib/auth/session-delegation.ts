import { Wallet, ZeroHash, verifyTypedData, type TypedDataField } from 'ethers'
import {
  SESSION_DOMAIN,
  SESSION_TYPES,
} from '../shared/eip712'
import {
  SESSION_PURPOSE,
  SESSION_EXPIRY_MS,
  StorageKeys,
} from '../shared/constants'
import type {
  SessionDelegation,
  SessionDelegationMessage,
  EncryptedBlob,
  EIP712Signer,
} from '../shared/types'
import { ensureDeviceKey, encrypt, decrypt } from './storage/encryption'
import { getKV, putKV, delKV } from './storage/indexeddb'

function getHost(): string {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.host || 'localhost'
}

export async function requestSessionDelegation(
  parentAddress: string,
  signTypedData: EIP712Signer,
): Promise<{ sessionAddress: string; delegation: SessionDelegation }> {
  const sessionWallet = Wallet.createRandom()
  const sessionAddress = sessionWallet.address

  const host = getHost()
  const nonce = crypto.randomUUID()
  const issuedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS).toISOString()
  const sessionProof = await sessionWallet.signMessage(`${host}:${nonce}`)

  const message: SessionDelegationMessage = {
    host,
    parent: parentAddress,
    session: sessionAddress,
    purpose: SESSION_PURPOSE,
    nonce,
    issuedAt,
    expiresAt,
    sessionProof,
    clientCodeHash: ZeroHash,
    statement: `Authorize ${sessionAddress} as session key for ${host}`,
  }

  const parentSig = await signTypedData(
    { ...SESSION_DOMAIN },
    SESSION_TYPES as unknown as Record<string, Array<{ name: string; type: string }>>,
    message as unknown as Record<string, unknown>,
  )

  const recovered = verifyTypedData(
    SESSION_DOMAIN,
    SESSION_TYPES as unknown as Record<string, TypedDataField[]>,
    message,
    parentSig,
  )
  if (recovered.toLowerCase() !== parentAddress.toLowerCase()) {
    throw new Error('Session delegation signature verification failed')
  }

  const delegation: SessionDelegation = { message, parentSig }

  const deviceKey = await ensureDeviceKey()

  const encSessionKey = await encrypt(deviceKey, {
    privateKey: sessionWallet.privateKey,
    address: sessionAddress,
  })
  await putKV(StorageKeys.SESSION_KEY, encSessionKey)

  const encDelegation = await encrypt(deviceKey, delegation)
  await putKV(StorageKeys.SESSION_DELEGATION, encDelegation)

  return { sessionAddress, delegation }
}

export async function restoreSession(): Promise<{
  sessionWallet: Wallet
  delegation: SessionDelegation
} | null> {
  const encKey = await getKV<EncryptedBlob>(StorageKeys.SESSION_KEY)
  const encDel = await getKV<EncryptedBlob>(StorageKeys.SESSION_DELEGATION)
  if (!encKey || !encDel) return null

  const deviceKey = await ensureDeviceKey()

  const { privateKey, address } = await decrypt<{
    privateKey: string
    address: string
  }>(deviceKey, encKey)

  const delegation = await decrypt<SessionDelegation>(deviceKey, encDel)

  if (new Date(delegation.message.expiresAt).getTime() < Date.now()) {
    await clearSession()
    return null
  }

  if (delegation.message.host !== getHost()) {
    await clearSession()
    return null
  }

  const sessionWallet = new Wallet(privateKey)
  if (sessionWallet.address !== address) {
    await clearSession()
    return null
  }

  return { sessionWallet, delegation }
}

export async function signWithSession(
  payload: string | Uint8Array,
): Promise<{ signature: string; sessionAddress: string } | null> {
  const session = await restoreSession()
  if (!session) return null

  const message =
    typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
  const signature = await session.sessionWallet.signMessage(message)
  return { signature, sessionAddress: session.sessionWallet.address }
}

export async function getSessionDelegation(): Promise<SessionDelegation | null> {
  const encDel = await getKV<EncryptedBlob>(StorageKeys.SESSION_DELEGATION)
  if (!encDel) return null

  const deviceKey = await ensureDeviceKey()
  return decrypt<SessionDelegation>(deviceKey, encDel)
}

export async function clearSession(): Promise<void> {
  await delKV(StorageKeys.SESSION_KEY)
  await delKV(StorageKeys.SESSION_DELEGATION)
}
