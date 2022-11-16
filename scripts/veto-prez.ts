import { DEVELOPMENT_CHAINS, PROPOSALS_FILE, ARGS, FUNC, PROPOSAL_DESCRIPTION, VOTING_PERIOD } from "../helper-hardhat-config";
import fs = require("fs");
import { ethers, network } from "hardhat";
import { moveBlocks } from "../utils/move-blocks";

const ix = 0;

async function veto(args: any[], functionToCall: string, proposalDescription: string, proposalIx: number) {
    const proposals = JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf-8"));
    const proposalId = proposals[network.config.chainId!][proposalIx];
    console.log(proposalId);


    const governor = await ethers.getContract("SenateGovernor");
    const achievements = await ethers.getContract("AchievementsToken");

    console.log("Status is", await governor.state(proposalId));

    const encodedFunctionCall = achievements.interface.encodeFunctionData(
        functionToCall,
        args
    );

    const voteTxResponse = await governor.veto(
        [achievements.address], // targets
        [0], // values
        [encodedFunctionCall], // encoded function calls
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription)), // desc hash
        // proposalDescription,
        "offensive"
    );
    await voteTxResponse.wait(1);

    // if (DEVELOPMENT_CHAINS.includes(network.name)) {
    //     await moveBlocks(VOTING_PERIOD + 1);
    // }

    console.log("Vetoed!");

    const proposalState = await governor.state(proposalId);
    console.log(`Proposal state (ACTIVE = 1, SUCCEEDED = 4): ${proposalState}`);
}

veto(ARGS, FUNC, PROPOSAL_DESCRIPTION, 0)
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });