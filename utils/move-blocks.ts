import { network } from "hardhat"

export async function moveBlocks(amount: number) {
    console.log("Moving blocks...");
    for (let ix = 0; ix < amount; ix++) {
        // mine local chain
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
    }
}