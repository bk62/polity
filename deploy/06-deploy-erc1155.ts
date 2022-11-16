import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { delegate } from "../utils";
import { GovernanceToken } from "../typechain-types";

const deployAchievementsToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const governance = await ethers.getContract("TimeLock", deployer);

    log("Deploying Governance Token...");
    const achievementsToken = await deploy("AchievementsToken", {
        from: deployer,
        // owner
        args: [governance.address],
        log: true,
        // auto-verify:
        // waitConfirmations:
    });
    log(`Deployed achievements contract to address: ${achievementsToken.address}`)



}

export default deployAchievementsToken;
deployAchievementsToken.tags = ["all", "governed"];
