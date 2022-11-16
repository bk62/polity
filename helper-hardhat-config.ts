export const DEVELOPMENT_CHAINS = ["hardhat", "localhost"]
export const PROPOSALS_FILE = "proposals.json"


// Governor values
export const QUORUM_PERCENTAGE = 4 // Need 4% of voters to pass
export const MIN_DELAY = 3600 // 1 hour - after a vote passes, you have 1 hour before you can enact
// export const VOTING_PERIOD = 45818 // 1 week - how long the vote lasts. This is pretty long even for local tests
export const VOTING_PERIOD = 5 // blocks
export const VOTING_DELAY = 1 // 1 Block - How many blocks till a proposal vote becomes active
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"


// type name, uri
export const ARGS = ["GOAT", "ipfs://metadata"]
export const FUNC = "addAchievementType"
export const PROPOSAL_DESCRIPTION = "Add an NFT GOAT achievement"