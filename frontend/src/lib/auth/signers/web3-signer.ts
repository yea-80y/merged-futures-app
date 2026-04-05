import { BrowserProvider } from 'ethers'
import type { EIP712Signer } from '../../shared/types'
import type { EthereumProvider } from '../../wallet/types'

export function createWeb3Signer(
  provider: EthereumProvider,
): { getAddress: () => Promise<string>; signer: EIP712Signer } {
  const bp = new BrowserProvider(provider as unknown as import('ethers').Eip1193Provider)

  const getAddress = async (): Promise<string> => {
    const signer = await bp.getSigner()
    return signer.getAddress()
  }

  const signer: EIP712Signer = async (domain, types, value) => {
    const jsonRpcSigner = await bp.getSigner()
    return jsonRpcSigner.signTypedData(domain, types, value)
  }

  return { getAddress, signer }
}
