import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";


const MIN_DELAY = 3600;

const deployTimelock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("Deploying Timelock...");
    const timelock = await deploy("TimeLock", {
        from: deployer,
        // min delay, proposers, executors
        args: [MIN_DELAY, [], []],
        log: true,
        // auto-verify:
        // waitConfirmations:
    });
    log(`Deployed timelock to address: ${timelock.address}`)

}

export default deployTimelock;
deployTimelock.tags = ["all", "governor"];
