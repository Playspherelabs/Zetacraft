import React, { useState, useEffect } from "react";
import { Node } from "reactflow";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useAccount, useWriteContract, useReadContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi";
import { ConnectWallet } from "components/Button/ConnectWallet";
import LoadingIndicator from "components/LoadingIndicator";
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { ZetaTokenAbi } from "constants/ZetatokenAbi";
import { addresses } from "constants/addresses";

interface FooterDefineProps {
  nodeA: Node | undefined;
  nodeB: Node | undefined;
  footerInput: { label: string; emoji: string };
  setFooterInput: React.Dispatch<React.SetStateAction<{ label: string; emoji: string }>>;
  isLoading: boolean;
}

const FooterDefine: React.FC<FooterDefineProps> = ({
  nodeA,
  nodeB,
  footerInput,
  setFooterInput,
  isLoading,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);
  const [isGeneratingNameAndEmoji, setIsGeneratingNameAndEmoji] = useState(false);
  const [minted, setMinted] = useState(false);
  const [sum, setSum] = useState(0);

  const { data: hash, isPending, error, writeContract } = useWriteContract();

  const ZetaTokenContract = {
    address: addresses.ZetaToken as `0x${string}`,
    abi: ZetaTokenAbi,
  } as const;

  const results = useReadContracts({
    contracts: [
      {
        ...ZetaTokenContract,
        functionName: "balanceOf",
        args: [address as `0x${string}`, BigInt(nodeA?.data.craft_id || 0)],
      },
      {
        ...ZetaTokenContract,
        functionName: "totalSupply",
        args: [BigInt(nodeA?.data.craft_id || 0)],
      },
    ],
  });

  const { data: recipeExists } = useReadContract({
    ...ZetaTokenContract,
    functionName: "getRecipeIdByIngredients",
    args: [BigInt(nodeA?.data.craft_id || 0), BigInt(nodeB?.data.craft_id || 0)],
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (results.isSuccess) {
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
    }
  }, [isConfirmed, hash, toast]);

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
    let isDisabled = true;
    let message = "";

    if (footerInput.label.length === 0) {
      message = "";
    } else if (footerInput.label.length > 30) {
      message = "The label must be within 30 characters.";
    } else if (!/^[A-Z]/.test(footerInput.label)) {
      message = "The first character must be an uppercase letter.";
    } else if (!/^[A-Z][A-Za-z0-9 ]*$/.test(footerInput.label)) {
      message = "Use only alphanumeric characters and spaces.";
    } else {
      isDisabled = false;
      message = "";
    }

    if (message) {
      toast({
        title: "Input alert🚨",
        description: message,
      });
    }

    setIsButtonDisabled(isDisabled);
  }, [footerInput.label, toast]);

  const generateAINameAndEmoji = async () => {
    if (!nodeA || !nodeB) return;

    setIsGeneratingNameAndEmoji(true);
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredient1: nodeA.data.label,
          ingredient2: nodeB.data.label,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate name and emoji');
      }

      const data = await response.json();
      setFooterInput(prev => ({ 
        label: data.name.replace(/"/g, ''), // Remove any double quotes
        emoji: data.emoji
      }));
    } catch (error) {
      console.error('Error generating name and emoji:', error);
      toast({
        title: "Error generating name and emoji",
        description: "Failed to generate a name and emoji using AI.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNameAndEmoji(false);
    }
  };

  const createRecipe = async () => {
    if (!nodeA || !nodeB) return;

    writeContract({
      address: addresses.ZetaToken as `0x${string}`,
      abi: ZetaTokenAbi,
      functionName: "createRecipe",
      args: [
        BigInt(nodeA.data.craft_id),
        BigInt(nodeB.data.craft_id),
        footerInput.label,
        footerInput.emoji,
      ],
    });
  };

  if (!nodeA || !nodeB) return null;

  return (
    <div className="left-12 inset-x-0 bottom-0 bg-white p-4 flex items-center justify-center z-10 mx-auto">
      <p className="mx-2 font-bold">{`${sum} minted`}</p>
      <div className="mx-2 items-center border border-gray-100 bg-gray-100 rounded-md">
        {nodeA.data.label && nodeB.data.label ? (
          <div className="p-2">
            <span className="font-bold">{`${nodeA.data.emoji}${nodeA.data.label} + ${nodeB.data.emoji}${nodeB.data.label}`}</span>
          </div>
        ) : null}
      </div>
      <p className="mx-2">{" -> "}</p>
      <div className="flex items-center">
        <button className="flex items-center justify-between border border-gray-300 text-gray-400 py-2 px-2 rounded min-w-40 mr-2">
          <div>
            {footerInput.emoji.length > 0 ? footerInput.emoji : "Emoji"}
          </div>
          <div className="flex-shrink-0 flex items-center">
            <Image
              src="/svg/emoji-smile.svg"
              alt="Smile emoji"
              width="20"
              height="20"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="hover:fill-orange"
            />
            <Image
              src="/svg/trash.svg"
              alt="Delete emoji"
              width="20"
              height="20"
              onClick={(e) => {
                e.stopPropagation();
                setFooterInput((prev) => {
                  const emojis = prev.emoji.split(" ").filter(Boolean);
                  emojis.pop();
                  return { ...prev, emoji: emojis.join(" ") };
                });
              }}
              className="hover:fill-orange ml-2"
            />
          </div>
        </button>
        <input
          type="text"
          name="label"
          placeholder="Label"
          value={footerInput.label}
          onChange={(e) =>
            setFooterInput((prev) => ({ ...prev, label: e.target.value }))
          }
          onMouseDown={(e) => e.stopPropagation()}
          className="border border-gray-300 rounded-md p-2 mr-2 flex-1"
        />
      </div>
      {isConnected ? (
        <>
          <button
            onClick={generateAINameAndEmoji}
            disabled={isGeneratingNameAndEmoji}
            className={`${
              isGeneratingNameAndEmoji
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            } text-white font-bold py-2 px-4 rounded mr-2`}
          >
            {isGeneratingNameAndEmoji ? <LoadingIndicator /> : "Generate AI"}
          </button>
          <button
            onClick={createRecipe}
            disabled={minted || isPending || isConfirming || isButtonDisabled}
            className={`${
              !minted && !isButtonDisabled
                ? "bg-blue hover:bg-blueHover"
                : "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
            } text-white font-bold py-2 px-4 rounded`}
          >
            {isPending || isConfirming ? (
              <LoadingIndicator />
            ) : minted ? (
              "Recipe already exists"
            ) : (
              "Create Recipe"
            )}
          </button>
        </>
      ) : (
        <ConnectWallet buttonText="Connect to create recipe" />
      )}
      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setShowEmojiPicker(false)}
          ></div>
          <div className="fixed left-12 bottom-16 bg-white shadow-md p-4 flex justify-between items-center z-50">
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData, event: MouseEvent) => {
                setFooterInput((prev) => {
                  const emojiCount = prev.emoji
                    .split(" ")
                    .filter(Boolean).length;

                  if (emojiCount < 3) {
                    const newEmoji =
                      prev.emoji + (prev.emoji ? " " : "") + emojiData.emoji;
                    return { ...prev, emoji: newEmoji };
                  } else {
                    toast({
                      title: "Input alert🚨",
                      description: "Maximum of 3 emojis",
                    });
                    return prev;
                  }
                });
                setShowEmojiPicker(false);
              }}
              autoFocusSearch={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FooterDefine;