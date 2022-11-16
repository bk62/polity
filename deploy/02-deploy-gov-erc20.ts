import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { delegate } from "../utils";
import { GovernanceToken } from "../typechain-types";

const deployGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("Deploying Governance Token...");
    const governanceToken = await deploy("GovernanceToken", {
        from: deployer,
        // TODO deployer != gov
        args: ["PolityGovernanceTokens", "GUV", 10, deployer],
        log: true,
        // auto-verify:s
        // waitConfirmations:
    });
    log(`Deployed governance token to address: ${governanceToken.address}`)

    const tokenContract = await ethers.getContractAt("GovernanceToken", governanceToken.address);

    log("Delegating to self..");
    log(`Voting power before: ${await tokenContract.getVotes(deployer)}`)
    await delegate(tokenContract as GovernanceToken, deployer);
    log("Delegated!");
    console.log(`Checkpoints after: ${await tokenContract.numCheckpoints(deployer)}`)
    log(`Voting power after: ${await tokenContract.getVotes(deployer)}`)


}

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "votes", "governor"];
