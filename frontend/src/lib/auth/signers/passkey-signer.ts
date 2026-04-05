import { Wallet } from 'ethers'
import type { EIP712Signer, SigningRequestInfo } from '../../shared/types'

export type ConfirmSigningFn = (info: SigningRequestInfo) => Promise<boolean>

export function createPasskeySigner(
  privateKey: string,
  confirmSigning: ConfirmSigningFn,
): { address: string; signer: EIP712Signer } {
  const wallet = new Wallet(privateKey)

  const signer: EIP712Signer = async (domain, types, value) => {
    const info: SigningRequestInfo = {
      action: 'Sign typed data',
      domainName: (domain.name as string) || 'Unknown',
      fields: Object.entries(value).map(([label, v]) => ({
        label,
        value: String(v),
      })),
    }

    const confirmed = await confirmSigning(info)
    if (!confirmed) throw new Error('Signing rejected by user')

    return wallet.signTypedData(domain, types, value)
  }

  return { address: wallet.address, signer }
}
