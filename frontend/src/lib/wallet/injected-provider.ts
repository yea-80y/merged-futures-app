import { setProvider, clearProvider } from './provider'
import type { EthereumProvider } from './types'

export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

export async function connectInjectedWallet(): Promise<{
  provider: EthereumProvider
  accounts: string[]
}> {
  if (!window.ethereum) {
    throw new Error('No injected wallet found. Install MetaMask or another browser extension wallet.')
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[]

  if (!accounts.length) throw new Error('No accounts returned from wallet')

  setProvider(window.ethereum)
  return { provider: window.ethereum, accounts }
}

export function disconnectInjectedWallet(): void {
  clearProvider()
}
