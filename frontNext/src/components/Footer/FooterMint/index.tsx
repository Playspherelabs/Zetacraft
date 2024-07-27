import React, { useState, useEffect } from "react";
import { Node } from "reactflow";
import { useToast } from "@/components/ui/use-toast";
import LoadingIndicator from "components/LoadingIndicator";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectWallet } from "components/Button/ConnectWallet";
import { ZetaTokenAbi } from "constants/ZetatokenAbi";
import { addresses } from "constants/addresses";

interface FooterMintProps {
  node: Node | undefined;
  nodeA: Node | undefined;
  nodeB: Node | undefined;
}

const FooterMint: React.FC<FooterMintProps> = ({ node, nodeA, nodeB }) => {
  const { address, isConnected } = useAccount();
  const { data: hash, isPending, error, writeContract } = useWriteContract();
  const [sum, setSum] = useState(0);
  const [minted, setMinted] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const { toast } = useToast();

  const ZetaTokenContract = {
    address: addresses.ZetaToken as `0x${string}`,
    abi: ZetaTokenAbi,
  } as const;

  const results = useReadContracts({
    contracts: [
      {
        ...ZetaTokenContract,
        functionName: "balanceOf",
        args: [address as `0x${string}`, BigInt(node?.data.craft_id || 0)],
      },
      {
        ...ZetaTokenContract,
        functionName: "totalSupply",
        args: [BigInt(node?.data.craft_id || 0)],
      },
    ],
  });

  const { data: recipeExists } = useReadContract({
    ...ZetaTokenContract,
    functionName: "getRecipeIdByIngredients",
    args: [BigInt(nodeA?.data.craft_id || 0), BigInt(nodeB?.data.craft_id || 0)],
  });

  const { data: tokenURI, refetch: refetchTokenURI } = useReadContract({
    ...ZetaTokenContract,
    functionName: "tokenURI",
    args: [BigInt(node?.data.craft_id || 0)],
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (results.isSuccess) {
      const resultBalance = results.data[0].result;
      const resultTotalSupply = results.data[1].result;
      const sum =
        resultTotalSupply != null ? Number(resultTotalSupply.toString()) : 0;
      setSum(sum);
    }
  }, [results]);

  useEffect(() => {
    if (recipeExists !== undefined) {
      setMinted(BigInt(recipeExists?.toString() || "0") !== BigInt(0));
    }
  }, [recipeExists]);

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Recipe created",
        description: `Transaction hash: ${hash}`,
      });
      setMinted(true);
      refetchTokenURI();
    }
  }, [isConfirmed, hash, toast, refetchTokenURI]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error creating recipe",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (tokenURI) {
      fetchMetadata(tokenURI as string);
    } else if (minted) {
      setMetadataError("Metadata not available for this NFT");
    }
  }, [tokenURI, minted]);

  const writeMint = async () => {
    if (!node || !nodeA || !nodeB) return;

    writeContract({
      address: addresses.ZetaToken as `0x${string}`,
      abi: ZetaTokenAbi,
      functionName: "createRecipe",
      args: [
        BigInt(nodeA.data.craft_id),
        BigInt(nodeB.data.craft_id),
        node.data.label,
        node.data.emoji as string,
      ],
    });
  };

  const fetchMetadata = async (uri: string) => {
    try {
      if (uri.startsWith("data:application/json;base64,")) {
        // Handle base64 encoded data
        const base64Data = uri.replace("data:application/json;base64,", "");
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        setMetadata(metadata);
        setMetadataError(null);
      } else {
        // Handle URL-based metadata
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }
        const metadata = await response.json();
        setMetadata(metadata);
        setMetadataError(null);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      setMetadataError("Failed to fetch or parse metadata");
      setMetadata(null);
    }
  };

  if (!node) return null;

  return (
    <div className="left-12 inset-x-0 bottom-0 bg-white p-4 flex items-center justify-center z-10 mx-auto">
      <p className="mx-2 font-bold">{`${sum} minted`}</p>
      <div className="mx-2 items-center border border-gray-100 bg-gray-100 rounded-md">
        {node.data.label ? (
          <div className="p-2">
            <span className="font-bold">{`${node.data.emoji}${node.data.label}`}</span>
          </div>
        ) : null}
      </div>
      <p className="mx-2">{" -> "}</p>
      {isConnected ? (
        <button
          disabled={minted || isPending || isConfirming}
          className={`${
            !minted
              ? "bg-blue hover:bg-blueHover"
              : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
          } mx-2 text-white font-bold py-2 px-4 rounded m-1`}
          onClick={writeMint}
        >
          {isPending || isConfirming ? (
            <LoadingIndicator />
          ) : minted ? (
            "Recipe already exists"
          ) : (
            "Create Recipe"
          )}
        </button>
      ) : (
        <ConnectWallet buttonText="Connect to create recipe" />
      )}
      {metadataError ? (
        <p className="text-red-500">{metadataError}</p>
      ) : metadata ? (
        <div className="mx-2 p-2 bg-gray-100 rounded">
          <h3 className="font-bold">{metadata.name}</h3>
          <p>{metadata.description}</p>
          <p>Image: {metadata.image}</p>
        </div>
      ) : null}
    </div>
  );
};

export default FooterMint;