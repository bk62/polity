// @ts-ignore
import { ethers, network } from "hardhat";
import { DEVELOPMENT_CHAINS, PROPOSALS_FILE, VOTING_DELAY, ARGS, FUNC, PROPOSAL_DESCRIPTION } from "../helper-hardhat-config"
import { moveBlocks } from "../utils/move-blocks";
import fs = require("fs");


export async function propose(args: any[], functionToCall: string, proposalDescription: string) {
    const governor = await ethers.getContract("HouseGovernor");
    const achievements = await ethers.getContract("AchievementsToken");

    const encodedFunctionCall = achievements.interface.encodeFunctionData(
        functionToCall,
        args
    );
    console.log(`Proposing ${functionToCall} on ${achievements.address} with ${args}`);
    console.log(`Proposal Description: \n ${proposalDescription}`);

    const proposeTx = await governor.propose(
        [achievements.address], // targets
        [0], // values
        [encodedFunctionCall], // encoded function calls
        proposalDescription // desc
    )
    // need proposal id from event
    const proposeReceipt = await proposeTx.wait(1);
    const proposalId = proposeReceipt.events[0].args.proposalId;
    // TODO - see deadline/checkpoint -- on Patrick's github

    // speed things up if on dev chains
    if (DEVELOPMENT_CHAINS.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
    }

    let proposals = JSON.parse(fs.readFileSync(PROPOSALS_FILE, "utf-8"))
    let chainId = network.config.chainId!.toString();
    if (!(chainId in proposals)) {
        proposals[chainId] = [];
    }
    proposals[chainId].push(proposalId.toString());
    fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals));

    console.log(`Proposal submitted, ID: ${proposalId}`)
}

propose(ARGS, FUNC, PROPOSAL_DESCRIPTION)
    .then(() => process.exit(0))
    .catch(err => {
        console.log(err);
        process.exit(1);
    });