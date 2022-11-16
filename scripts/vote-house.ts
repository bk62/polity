import { DEVELOPMENT_CHAINS, PROPOSALS_FILE, VOTING_PERIOD } from "../helper-hardhat-config";
import fs = require("fs");
import { ethers, network } from "hardhat";
import { moveBlocks } from "../utils/move-blocks";

const ix = 0;

async function vote(proposalIx: number) {
    const proposals = JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf-8"));
    const proposalId = proposals[network.config.chainId!][proposalIx];
    // 0 - against, 1 - for, 2 - abstain
    const vote = 1;
    const reason = "y not";

    const governor = await ethers.getContract("HouseGovernor");
    const voteTxResponse = await governor.castVoteWithReason(
        proposalId,
        vote,
        reason
    );
    await voteTxResponse.wait(1);

    if (DEVELOPMENT_CHAINS.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }

    console.log("Voted!");

    const proposalState = await governor.state(proposalId);
    console.log(`Proposal state (ACTIVE = 1, SUCCEEDED = 4): ${proposalState}`);
}

vote(ix)
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });