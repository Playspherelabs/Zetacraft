import React, { useState, useEffect } from "react";
import { Node } from "reactflow";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectWallet } from "components/Button/ConnectWallet";
import LoadingIndicator from "components/LoadingIndicator";
import { InformationCircleIcon } from '@heroicons/react/20/solid';

interface FooterDefineProps {
  nodeA: Node | undefined;
  nodeB: Node | undefined;
  footerInput: { label: string; emoji: string };
  setFooterInput: React.Dispatch<React.SetStateAction<{ label: string; emoji: string }>>;
  updateNodeFromFooter: () => void;
  isLoading: boolean;
}

const FooterDefine: React.FC<FooterDefineProps> = ({
  nodeA,
  nodeB,
  footerInput,
  setFooterInput,
  updateNodeFromFooter,
  isLoading,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingNameAndEmoji, setIsGeneratingNameAndEmoji] = useState(false);

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


  if (!nodeA || !nodeB) return null;

  return (
    <>
      <div className="flex items-left">
        <p className="ml-4 font-bold text-gray-400">
          Good recipe creator will be rewarded!
        </p>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative"
        >
          <InformationCircleIcon className="h-auto w-6 text-gray-400 ml-2" />
          {isHovered && (
            <div className="absolute z-30 left-full -top-48 p-4 bg-white shadow-lg rounded-lg text-sm w-[720px]">
              <p className="font-bold mb-2">Here's how you can earn points through recipe creation:</p>
              <ul className="list-disc list-inside">
                <li>Creating a Recipe: You'll earn <strong className="text-blue">200 points</strong> when you define a new recipe.</li>
                <li>Recipe Minting: Each time someone mints your recipe, you'll receive <strong className="text-blue">100 points</strong>, with no limit on the number of mints.</li>
                <li>Recipe Assistance: If your recipe is used in the creation of another recipe, and that recipe gets minted, you'll earn <strong className="text-blue">50 points</strong>.</li>
              </ul>
              <p className="mt-2">This system encourages the creation of practical and valuable recipes. Points will not be awarded for random or nonsensical recipes.</p>
            </div>
          )}
        </div>
      </div>
      <div className="left-12 bottom-0 bg-white shadow-md p-4 flex justify-between items-center z-10">
        <div className="relative flex items-center justify-center space-x-4">
          <div className="flex items-center border border-gray-100 bg-gray-100 rounded-md">
            {nodeA.data.label ? (
              <div className="p-2">
                <span className="font-bold">{`${nodeA.data.emoji}${nodeA.data.label}`}</span>
              </div>
            ) : null}
          </div>
          <span className="flex items-center">+</span>
          <div className="flex items-center border border-gray-100 bg-gray-100 rounded-md">
            {nodeB.data.label ? (
              <div className="p-2">
                <span className="font-bold">{`${nodeB.data.emoji}${nodeB.data.label}`}</span>
              </div>
            ) : null}
          </div>
        </div>
        <span className="flex items-center mx-2">=</span>

        <button className="flex items-center justify-between border border-gray-300 text-gray-400  py-2 px-2 rounded min-w-40">
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

        {showEmojiPicker && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setShowEmojiPicker(false)}
            ></div>
            <div className="fixed left-12 bottom-0 bg-white shadow-md p-4 flex justify-between items-center z-100">
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

        <input
          type="text"
          name="label"
          placeholder="Label"
          value={footerInput.label}
          onChange={(e) =>
            setFooterInput((prev) => ({ ...prev, label: e.target.value }))
          }
          onMouseDown={(e) => e.stopPropagation()}
          className="border border-gray-300 rounded-md p-2 m-1 flex-1"
        />
      {isConnected ? (
        <>
          <button
            onClick={generateAINameAndEmoji}
            disabled={isGeneratingNameAndEmoji}
            className={`${
              isGeneratingNameAndEmoji
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            } text-white font-bold py-2 px-4 rounded m-1`}
          >
            {isGeneratingNameAndEmoji ? <LoadingIndicator /> : "Generate AI Name & Emoji"}
          </button>
          <button
            onClick={updateNodeFromFooter}
            disabled={isButtonDisabled}
            className={`${
              isButtonDisabled
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : "bg-blue hover:bg-blueHover"
            } text-white font-bold py-2 px-4 rounded m-1`}
          >
            {isLoading ? <LoadingIndicator /> : "Define"}
          </button>
        </>
      ) : (
        <ConnectWallet />
      )}
      </div>
    </>
  );
};

export default FooterDefine;