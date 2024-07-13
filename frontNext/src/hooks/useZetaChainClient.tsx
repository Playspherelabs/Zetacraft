import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useEthersSigner } from "./useEthersSigner"

const ZetaChainContext = createContext<any>(undefined!)

interface ZetaChainProviderProps {
  children: ReactNode
} 

export function ZetaChainProvider({ children }: ZetaChainProviderProps) {
  const signer = useEthersSigner()
  //Todo: Modify this client since it is hotfix for now
  const ZetaChainClient = require('@zetachain/toolkit/client');

  const createClient = useCallback((signer: any) => {
    return new ZetaChainClient({
      signer: signer,
      network: "testnet",
      chains: {
        zeta_testnet: {
          api: [
            {
              url: `https://zetachain-athens.g.allthatnode.com/archive/evm/${process.env.NEXT_PUBLIC_ATN_KEY}`,
              type: "evm",
            },
          ],
        },
      },
    })
  }, [])

  const [client, setClient] = useState(() => createClient(signer))

  useEffect(() => {
    if (signer) {
      setClient(createClient(signer))
    }
  }, [signer, createClient])

  return (
    <ZetaChainContext.Provider value={{ client }}>
      {children}
    </ZetaChainContext.Provider>
  )
}

export function useZetaChainClient(): any {
  const context = useContext(ZetaChainContext)
  if (context === undefined) {
    throw new Error("useZetaChain must be used within a ZetaChainProvider")
  }
  return context
}
