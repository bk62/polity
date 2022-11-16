import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { delegate } from "../utils";
import { CitizenshipNFT } from "../typechain-types";

const deployCitizenshipNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("Deployer a/c: ", deployer);

    log("Deploying Governance Citizenship NFT...");
    const citizenshipNFT = await deploy("CitizenshipNFT", {
        from: deployer,
        // TODO deployer != govs
        args: ["PolityCitizenshipNFT", "CITIZEN", deployer],
        log: true,
        // auto-verify:
        // waitConfirmations:
    });
    log(`Deployed governance citizenship NFT to address: ${citizenshipNFT.address}`)

    const nftContract = await ethers.getContractAt("CitizenshipNFT", citizenshipNFT.address);

    log("issuing to self");
    const tx = await nftContract.issue(deployer, "ipfs://test-uri");
    await tx.wait(1);

    log("Delegating to self..");
    log(`Voting power before: ${await nftContract.getVotes(deployer)}`)
    await delegate(nftContract as CitizenshipNFT, deployer);
    log("Delegated!");
    log(`Voting power after: ${await nftContract.getVotes(deployer)}`)


}

export default deployCitizenshipNFT;
deployCitizenshipNFT.tags = ["all", "votes", "governor"];