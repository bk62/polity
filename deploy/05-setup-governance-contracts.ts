import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { constants } from "ethers";

const setupContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const timelock = await ethers.getContract("TimeLock", deployer);
    const house = await ethers.getContract("HouseGovernor", deployer);
    const senate = await ethers.getContract("SenateGovernor", deployer);

    log("Setting up timelock roles...");
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

    const proposerTx = await timelock.grantRole(proposerRole, senate.address);
    await proposerTx.wait(1);
    const executorTx = await timelock.grantRole(executorRole, constants.AddressZero);
    await executorTx.wait(1);

    const revokeTx = await timelock.revokeRole(adminRole, deployer);
    await revokeTx.wait(1);
}

export default setupContracts;
setupContracts.tags = ["all", "governor"];
