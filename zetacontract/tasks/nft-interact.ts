import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { prepareData, ZetaChainClient } from "@zetachain/toolkit/client";
import { utils, ethers, BigNumber } from "ethers";

task("nft-interact-custom", "Interact with the NFT contract")
  .addParam("contract", "The address of the NFT contract on ZetaChain")
  .addParam("action", "Action to perform: mint, burn, or createrecipe")
  .addOptionalParam("recipient", "Recipient address for minting or burning")
  .addOptionalParam("amount", "Amount of tokens to send for minting")
  .addOptionalParam("chainid", "Chain ID for minting")
  .addOptionalParam("tokenid", "Token ID for burning")
  .addOptionalParam("id", "ID for creating recipe (number)")
  .addOptionalParam("name", "Name for creating recipe")
  .addOptionalParam("imagetext", "Image text for creating recipe")
  .addOptionalParam("ida", "ID A for creating recipe (number)")
  .addOptionalParam("idb", "ID B for creating recipe (number)")
  .addFlag("json", "Output in JSON")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const client = new ZetaChainClient({ network: "testnet", signer });

    const nftContract = await hre.ethers.getContractAt("NFT", taskArgs.contract);

    let tx;

    if (taskArgs.action === "mint") {
      const data = prepareData(
        taskArgs.contract,
        ["address", "uint256", "uint256"],
        [taskArgs.recipient, BigNumber.from(taskArgs.chainid), parseUnits(taskArgs.amount, 18)]
      );

      const tssAddress = getAddress("tss", hre.network.name as any);
      tx = await signer.sendTransaction({
        to: tssAddress,
        value: parseUnits(taskArgs.amount, 18),
        data
      });
    } else if (taskArgs.action === "burn") {
      tx = await nftContract.burnNFT(BigNumber.from(taskArgs.tokenid), ethers.utils.toUtf8Bytes(taskArgs.recipient));
    } else if (taskArgs.action === "createrecipe") {
      tx = await nftContract.setRecipe(
        BigNumber.from(taskArgs.id),
        taskArgs.name,
        taskArgs.imagetext,
        BigNumber.from(taskArgs.ida),
        BigNumber.from(taskArgs.idb)
      );
    } else {
      throw new Error("Invalid action. Use 'mint', 'burn', or 'createrecipe'.");
    }

    await tx.wait();

    if (taskArgs.json) {
      console.log(JSON.stringify(tx, null, 2));
    } else {
      console.log(`🔑 Using account: ${signer.address}\n`);
      console.log(`🚀 Successfully executed ${taskArgs.action} action on ${hre.network.name} network.
📝 Transaction hash: ${tx.hash}
      `);
    }
  });