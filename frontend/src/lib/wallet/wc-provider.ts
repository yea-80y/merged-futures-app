import EthereumProviderLib from '@walletconnect/ethereum-provider'
import { setProvider, clearProvider } from './provider'
import type { EthereumProvider } from './types'

const WC_PROJECT_ID = '6fef63322c22adc1e92e3b84836e256d'

let wcProvider: InstanceType<typeof EthereumProviderLib> | null = null

export async function initWalletConnect(): Promise<{
  provider: EthereumProvider
  accounts: string[]
}> {
  const provider = await EthereumProviderLib.init({
    projectId: WC_PROJECT_ID,
    chains: [1],
    showQrModal: true,
    metadata: {
      name: 'Merged Futures 8',
      description: 'Digital Northants Innovation Showcase',
      url: 'https://mf8.eth.limo',
      icons: ['https://mf8.eth.limo/icons/icon-192.png'],
    },
  })

  await provider.connect()

  const accounts = provider.accounts
  if (!accounts.length) throw new Error('No accounts returned from WalletConnect')

  wcProvider = provider
  setProvider(provider as unknown as EthereumProvider)

  return { provider: provider as unknown as EthereumProvider, accounts }
}

export async function restoreWalletConnect(): Promise<{
  provider: EthereumProvider
  accounts: string[]
} | null> {
  if (!wcProvider) return null

  const accounts = wcProvider.accounts
  if (!accounts.length) return null

  setProvider(wcProvider as unknown as EthereumProvider)
  return { provider: wcProvider as unknown as EthereumProvider, accounts }
}

export async function disconnectWalletConnect(): Promise<void> {
  if (wcProvider) {
    try {
      await wcProvider.disconnect()
    } catch {
      // ignore disconnect errors
    }
    wcProvider = null
  }
  clearProvider()
}
