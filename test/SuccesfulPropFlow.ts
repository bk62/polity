import { HouseGovernor, SenateGovernor, TimeLock, AchievementsToken } from "../typechain-types";
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { assert, expect } from "chai";
import {
    FUNC, PROPOSAL_DESCRIPTION, ARGS,
    MIN_DELAY, VOTING_DELAY, VOTING_PERIOD
} from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";


describe("Succesful Proposal Flow", async () => {
    let house: HouseGovernor;
    let senate: SenateGovernor;
    let presidentAddr: string;
    let timeLock: TimeLock;
    let achievements: AchievementsToken;
    const voteWay = 1; // for
    const reason = "Pass";

    beforeEach(async () => {
        await deployments.fixture(["all"]);

        house = await ethers.getContract("HouseGovernor");
        senate = await ethers.getContract("SenateGovernor");
        timeLock = await ethers.getContract("TimeLock");
        achievements = await ethers.getContract("AchievementsToken");

        const { deployer } = await getNamedAccounts();
        presidentAddr = deployer;


    });

    it("achievements only changeable through governance", async () => {
        await expect(achievements.addAchievementType("Test", "testuri")).to.be.reverted;
    });

    it("goes through both houses, then queues and executes", async () => {
        // A. HOUSE:
        // ========

        // A.1. Propose:

        console.log("House: Creating Proposal");
        const encodedFunc = achievements.interface.encodeFunctionData(
            "addAchievementType",
            ["Test", "test_uri"]
        );
        const propTx = await house.propose(
            [achievements.address],
            [0],
            [encodedFunc],
            "Test Prop"
        );

        const propRcpt = await propTx.wait(1);
        const propId = propRcpt.events![0].args!.proposalId;
        let propState = await house.state(propId);
        console.log(`Current proposal state (0 = Pending): ${propState}`);
        expect(propState).to.be.equal(0); // Pending

        console.log("Moving blocks by Voting delay: ", VOTING_DELAY + 1);
        await moveBlocks(VOTING_DELAY + 1);

        // A.2 Vote:
        console.log("House: Voting Yes");
        const voteTx = await house.castVoteWithReason(propId, voteWay, reason);
        await voteTx.wait();

        propState = await house.state(propId);
        console.log(`Current proposal state (1 = Active): ${propState}`)
        expect(propState).to.be.equal(1);

        console.log("Moving blocks by voting period", VOTING_PERIOD + 1);
        await moveBlocks(VOTING_PERIOD + 1);

        propState = await house.state(propId);
        console.log(`Current proposal state (4 = Succesfull): ${propState}`)
        expect(propState).to.be.equal(4);

        // A.3 Queue i.e. Forward to Senate
        console.log("House: Queuing Proposal i.e. Forwarding to Senate");
        const qTx = await house.queue(
            [achievements.address],
            [0],
            [encodedFunc],
            "Test Prop"
        );
        await qTx.wait(1);

        propState = await house.state(propId);
        console.log(`Current proposal state in house (0 = Pending): ${propState}`)
        // TODO
        console.log("Although proposal passed through the house, it is returning senate's proposal state now. TODO");
        expect(propState).to.be.equal(0);

        propState = await senate.state(propId);
        console.log(`Current proposal state in senate (0 = Pending): ${propState}`)
        expect(propState).to.be.equal(0);


        console.log("Moving time and blocks by min delay and voting delay", MIN_DELAY + 1, VOTING_DELAY + 1);
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(VOTING_DELAY + 1);

        propState = await house.state(propId);
        console.log(`Current proposal state in house (1 = Pending): ${propState}`)
        expect(propState).to.be.equal(1);

        propState = await senate.state(propId);
        console.log(`Current proposal state in senate (1 = Active): ${propState}`)
        expect(propState).to.be.equal(1);

        // B. Senate
        // =========

        // B.1 Vote
        console.log("Senate: Voting Yes");
        const vTx = await senate.castVoteWithReason(propId, voteWay, reason);
        await vTx.wait();

        propState = await senate.state(propId);
        console.log(`Current proposal state (1 = Active): ${propState}`)
        expect(propState).to.be.equal(1);

        console.log("Moving blocks by voting period", VOTING_PERIOD + 1);
        await moveBlocks(VOTING_PERIOD + 1);

        propState = await senate.state(propId);
        console.log(`Current proposal state in senate (4 = Succesfull): ${propState}`)
        expect(propState).to.be.equal(4);

        // B.2 Queue and Execute
        console.log("Senate: Queuing on Timelock");
        const descHash = ethers.utils.id("Test Prop");
        const qTx2 = await senate.queue(
            [achievements.address],
            [0],
            [encodedFunc],
            descHash
        );
        await qTx2.wait(1);

        propState = await senate.state(propId);
        console.log(`Current proposal state in senate (5 = Queued): ${propState}`)
        expect(propState).to.be.equal(5);

        console.log("Moving time and blocks by min delay and 1", MIN_DELAY + 1);
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);

        console.log("Senate: Executing Proposal");

        const eTx = await senate.execute(
            [achievements.address],
            [0],
            [encodedFunc],
            descHash
        );
        await eTx.wait(1);

        propState = await senate.state(propId);
        console.log(`Current proposal state in senate (7 = Executed): ${propState}`)
        // TODO
        console.log("Note: If vetoed, state would be  = Canceled TODO");
        expect(propState).to.be.equal(7);

        console.log("Getting new achievement type created by governance");
        const achType = await achievements.getAchievementType("Test");
        console.log("Got name, uri: ", achType.name, achType.uri);

        expect(achType.name).to.be.equal("Test");
        expect(achType.uri).to.be.equal("test_uri");

    })
});