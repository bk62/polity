
import { ethers } from "hardhat";
import type { CitizenshipNFT, GovernanceToken } from "../typechain-types";

export const delegate = async (tokenContract: CitizenshipNFT | GovernanceToken, delegatedAccount: string) => {
    const tx = await tokenContract.delegate(delegatedAccount);
    await tx.wait(1);
}