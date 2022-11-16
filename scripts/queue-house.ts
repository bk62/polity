// @ts-ignore
import { ethers, network } from "hardhat";
import { DEVELOPMENT_CHAINS, PROPOSALS_FILE, VOTING_DELAY, MIN_DELAY, VOTING_PERIOD, ARGS, FUNC, PROPOSAL_DESCRIPTION } from "../helper-hardhat-config"
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";
import fs = require("fs");

export async function queue(args: any[], functionToCall: string, proposalDescription: string, proposalIx: number) {
    const proposals = JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf-8"));
    const proposalId = proposals[network.config.chainId!][proposalIx];
    console.log("prop id", proposalId);

    const governor = await ethers.getContract("HouseGovernor");
    const achievements = await ethers.getContract("AchievementsToken");

    const encodedFunctionCall = achievements.interface.encodeFunctionData(
        functionToCall,
        args
    );
    console.log(`Queuing ${functionToCall} on ${achievements.address} with ${args}`);
    console.log(`Proposal Description: \n ${proposalDescription}`);

    const tx = await governor.queue(
        [achievements.address], // targets
        [0], // values
        [encodedFunctionCall], // encoded function calls
        // ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription)) // desc hash
        proposalDescription
    )
    await tx.wait()

    if (DEVELOPMENT_CHAINS.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        // await moveBlocks(VOTING_PERIOD + 1);
        await moveBlocks(VOTING_DELAY + 1);
    }

    const senate = await ethers.getContract("SenateGovernor");

    console.log("Queued")

    console.log("House state", await governor.state(proposalId));
    console.log("Senate state", await senate.state(proposalId));

}

queue(ARGS, FUNC, PROPOSAL_DESCRIPTION, 0)
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });