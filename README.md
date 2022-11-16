# Polity

Tiered DAO

Experimenting with Democracy "like" DAO structures using OpenZeppelin governance contracts.


## Quickstart

```shell
npx hardhat test
npx hardhat node &
npx hardhat deploy --network localhost
```

## Introduction

Combining ERC-721 (NFT) based and ERC-20 based voting as well as the possibility of a veto by a single account (or multisig).


There are two governance layers and a "President" layer:

### House
ERC-721 NFT Citizenship passport

"One vote per person" (kind of, not really)

"Democracy layer"

All proposals have to start here

### Senate

ERC-20 - Governance tokens

Weighted stakeholder voting

"Plutocracy layer"

### President

"Republic" or "tyranny" layer for fun/experimentation.

Temporary: not optional currently.

Can veto succesful proposals before being queued and executed by the Timelock


Implemented as a OpenZeppelin AccessControl module role and the `_cancel` methods on `Governor` contracts.


## API

Key methods:

`HouseGovernor`: `propose`, `castVote` etc, `queue`
`SenateGovernor`: `castVote` etc, `queue`, `execute`, `veto`



## Example Flow

Please refer to the tests for example flows.

Manually tunning scripts in order:

### Proposal passes through

In order:
1. Propose method call on governed ERC-1155 in the house
2. Vote yes in house with NFT voting
3. Forward passed proposal to the senate
4. Vote yes in senate with ERC-20 voting
5. Queue and execute proposal via Timelocks 

```shell
npx hardhat node &
npx hardhat run scripts/propose-house.ts --network localhost
npx hardhat run scripts/vote-house.ts --network localhost
npx hardhat run scripts/queue-house.ts --network localhost
npx hardhat run scripts/vote-senate.ts --network localhost
npx hardhat run scripts/queue-execute-senate.ts --network localhost
```

### Proposal passes through both houses, but is vetoed

Same as above, but is vetoed i.e. cancelled by "President" account aka the deployer

```shell
npx hardhat node &
npx hardhat run scripts/propose-house.ts --network localhost
npx hardhat run scripts/vote-house.ts --network localhost
npx hardhat run scripts/queue-house.ts --network localhost
npx hardhat run scripts/vote-senate.ts --network localhost
npx hardhat run scripts/veto-prez.ts --network localhost
```


## TODO

[] Governance tokens access control
[] Governor contracts check access control
[] Test veto flow
[] Update scripts to handle args
[] Optional layering, esp veto
[] Governance ERC-20 tokens could use more extensions

## References

https://github.com/PatrickAlphaC/dao-template

## Inspirations

Optimism Governance [https://community.optimism.io/docs/governance/](https://community.optimism.io/docs/governance/)

Kusama Tiered DAO - [https://medium.com/deep-dao/kusamas-multi-tier-governance-listed-on-deepdao-4e4b68b86fb3](https://medium.com/deep-dao/kusamas-multi-tier-governance-listed-on-deepdao-4e4b68b86fb3)

Jur Citizenship NFT - [https://jur.io/citizenshipNFT](https://jur.io/citizenshipNFT)


The networked state a la Balaji Srinivasan