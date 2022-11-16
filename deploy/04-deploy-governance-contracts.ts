import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// @ts-ignore
import { ethers } from "hardhat";

const VOTING_DELAY = 1;
const VOTING_PERIOD = 5;
const QUORUM_PERCENTAGE = 4;

const deployGovernorContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const citizenshipNFT = await get("CitizenshipNFT");
    const governanceToken = await get("GovernanceToken");
    const timelock = await get("TimeLock");

    log("Deploying Governors...");

    // calc senate addr beforehand
    let nonce: number = await ethers.provider.getTransactionCount(deployer);
    const houseAddr = ethers.utils.getContractAddress({
        from: deployer,
        nonce: nonce
    });
    // log("Predicted house addr: ", houseAddr);
    const senateAddr = ethers.utils.getContractAddress({
        from: deployer,
        nonce: nonce + 1
    });
    // log("Predicted senate addr: ", senateAddr);

    const houseContract = await deploy("HouseGovernor", {
        from: deployer,
        // token, senate address, delay, period, quorum
        args: [citizenshipNFT.address, senateAddr, VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE],
        log: true,
        // auto-verify:
        // waitConfirmations:
    });

    const senateContract = await deploy("SenateGovernor", {
        from: deployer,
        // token, timelock, delay, period, quorum
        args: [governanceToken.address, timelock.address, VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE, houseAddr, deployer, true],
        log: true,
        // auto-verify:
        // waitConfirmations:
    });
    log(`Deployed senate and house governors to addresses: ${senateContract.address}, ${houseContract.address} `)

}

export default deployGovernorContracts;
deployGovernorContracts.tags = ["all", "governor"];
