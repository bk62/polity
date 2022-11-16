import { ethers, network } from "hardhat";
import { DEVELOPMENT_CHAINS, PROPOSALS_FILE, ARGS, FUNC, PROPOSAL_DESCRIPTION, MIN_DELAY, VOTING_PERIOD, VOTING_DELAY } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";
import fs = require("fs");

export async function queueAndExecute(args: any[], functionToCall: string, proposalDescription: string, proposalIx: number) {
    const proposals = JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf-8"));
    const proposalId = proposals[network.config.chainId!][proposalIx];


    const governor = await ethers.getContract("SenateGovernor");
    const achievements = await ethers.getContract("AchievementsToken");

    let proposalState = await governor.state(proposalId);
    console.log(`Proposal state (ACTIVE = 1, SUCCEEDED = 4): ${proposalState}`);

    const encodedFunctionCall = achievements.interface.encodeFunctionData(
        functionToCall,
        args
    );

    console.log("Queuing...");
    const queueTx = await governor.queue(
        [achievements.address],
        [0],
        [encodedFunctionCall],
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription)), // desc hash
    );
    await queueTx.wait(1);

    console.log("Queued");

    if (DEVELOPMENT_CHAINS.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(VOTING_PERIOD + 1);
    }

    console.log("Executing...");
    const executeTx = await governor.execute(
        [achievements.address],
        [0],
        [encodedFunctionCall],
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription)), // desc hash
    );
    await executeTx.wait(1);

    console.log("Executed");

    proposalState = await governor.state(proposalId);
    console.log(`Proposal state (ACTIVE = 1, SUCCEEDED = 4): ${proposalState}`);


}

queueAndExecute(ARGS, FUNC, PROPOSAL_DESCRIPTION, 0)
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1)
    });