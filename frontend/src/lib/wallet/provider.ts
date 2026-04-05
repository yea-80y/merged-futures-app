import { BrowserProvider, type JsonRpcSigner } from 'ethers'
import type { EthereumProvider } from './types'

let currentProvider: EthereumProvider | null = null

export function setProvider(provider: EthereumProvider): void {
  currentProvider = provider
}

export function getProvider(): EthereumProvider | null {
  return currentProvider
}

export function clearProvider(): void {
  currentProvider = null
}

export async function getEthersProvider(): Promise<BrowserProvider> {
  const provider = currentProvider
  if (!provider) throw new Error('No wallet provider set')
  return new BrowserProvider(provider as unknown as import('ethers').Eip1193Provider)
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const bp = await getEthersProvider()
  return bp.getSigner()
}
