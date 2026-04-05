import { writable, get } from 'svelte/store'
import type { AuthKind, SessionDelegation, EIP712Signer } from '../shared/types'
import { StorageKeys } from '../shared/constants'
import { getKV, putKV, delKV } from './storage/indexeddb'
import {
  authenticatePasskey,
  restorePasskeyAccount,
  clearPasskeyCredential,
  isPasskeySupported,
} from './passkey-account'
import { createPasskeySigner, type ConfirmSigningFn } from './signers/passkey-signer'
import { createWeb3Signer } from './signers/web3-signer'
import {
  requestSessionDelegation,
  restoreSession,
  clearSession,
} from './session-delegation'
import { initWalletConnect, disconnectWalletConnect } from '../wallet/wc-provider'
import { connectInjectedWallet, disconnectInjectedWallet } from '../wallet/injected-provider'
import { setProvider, clearProvider } from '../wallet/provider'
import type { EthereumProvider } from '../wallet/types'

export interface AuthState {
  status: 'loading' | 'unauthenticated' | 'authenticated'
  kind: AuthKind
  parentAddress: string | null
  sessionAddress: string | null
  delegation: SessionDelegation | null
}

const initial: AuthState = {
  status: 'loading',
  kind: 'none',
  parentAddress: null,
  sessionAddress: null,
  delegation: null,
}

export const auth = writable<AuthState>(initial)

let confirmSigningFn: ConfirmSigningFn = async () => true

export function setConfirmSigning(fn: ConfirmSigningFn): void {
  confirmSigningFn = fn
}

export async function tryRestore(): Promise<void> {
  const kind = await getKV<AuthKind>(StorageKeys.AUTH_KIND)
  if (!kind || kind === 'none') {
    auth.set({ ...initial, status: 'unauthenticated' })
    return
  }

  try {
    if (kind === 'passkey') {
      // Restore the session from encrypted IndexedDB — no passkey popup needed.
      // The passkey is only required when creating a new session delegation.
      const session = await restoreSession()
      if (!session) {
        // Session expired or missing — user must sign in again explicitly.
        auth.set({ ...initial, status: 'unauthenticated' })
        return
      }
      const parentAddress = await getKV<string>(StorageKeys.PARENT_ADDRESS)
      auth.set({
        status: 'authenticated',
        kind: 'passkey',
        parentAddress: parentAddress ?? session.delegation.message.parent,
        sessionAddress: session.sessionWallet.address,
        delegation: session.delegation,
      })
      return
    }

    // web3 — WalletConnect session restoration not automatic on page load
    // User needs to re-connect wallet
    auth.set({ ...initial, status: 'unauthenticated' })
  } catch {
    auth.set({ ...initial, status: 'unauthenticated' })
  }
}

export async function loginWithPasskey(): Promise<void> {
  auth.update(s => ({ ...s, status: 'loading' }))
  try {
    const { address, privateKey } = await authenticatePasskey()
    const { signer } = createPasskeySigner(privateKey, confirmSigningFn)
    const { sessionAddress, delegation } = await requestSessionDelegation(address, signer)

    await putKV(StorageKeys.AUTH_KIND, 'passkey' as AuthKind)
    await putKV(StorageKeys.PARENT_ADDRESS, address.toLowerCase())

    auth.set({
      status: 'authenticated',
      kind: 'passkey',
      parentAddress: address.toLowerCase(),
      sessionAddress,
      delegation,
    })
  } catch (e) {
    auth.set({ ...initial, status: 'unauthenticated' })
    throw e
  }
}

export async function loginWithInjectedWallet(): Promise<void> {
  auth.update(s => ({ ...s, status: 'loading' }))
  try {
    const { provider, accounts } = await connectInjectedWallet()
    const address = accounts[0]
    const { signer } = createWeb3Signer(provider)
    const { sessionAddress, delegation } = await requestSessionDelegation(address, signer)

    await putKV(StorageKeys.AUTH_KIND, 'web3' as AuthKind)
    await putKV(StorageKeys.PARENT_ADDRESS, address.toLowerCase())

    auth.set({
      status: 'authenticated',
      kind: 'web3',
      parentAddress: address.toLowerCase(),
      sessionAddress,
      delegation,
    })
  } catch (e) {
    auth.set({ ...initial, status: 'unauthenticated' })
    throw e
  }
}

export async function loginWithWalletConnect(): Promise<void> {
  auth.update(s => ({ ...s, status: 'loading' }))
  try {
    const { provider, accounts } = await initWalletConnect()
    const address = accounts[0]
    const { signer } = createWeb3Signer(provider)
    const { sessionAddress, delegation } = await requestSessionDelegation(address, signer)

    await putKV(StorageKeys.AUTH_KIND, 'web3' as AuthKind)
    await putKV(StorageKeys.PARENT_ADDRESS, address.toLowerCase())

    auth.set({
      status: 'authenticated',
      kind: 'web3',
      parentAddress: address.toLowerCase(),
      sessionAddress,
      delegation,
    })
  } catch (e) {
    auth.set({ ...initial, status: 'unauthenticated' })
    throw e
  }
}

export async function logout(): Promise<void> {
  const state = get(auth)

  if (state.kind === 'web3') {
    // Try WalletConnect disconnect first; injected wallets just need provider cleared
    try { await disconnectWalletConnect() } catch { /* not a WC session */ }
    disconnectInjectedWallet()
  }

  await clearSession()
  await clearPasskeyCredential()
  await delKV(StorageKeys.AUTH_KIND)
  await delKV(StorageKeys.PARENT_ADDRESS)
  clearProvider()

  auth.set({ ...initial, status: 'unauthenticated' })
}

export { isPasskeySupported }
