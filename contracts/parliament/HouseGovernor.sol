// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

import "./SenateGovernor.sol";

contract HouseGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    SenateGovernor private senateGovernor;
    mapping(uint256 => bool) private forwardedProposalIds;

    constructor(
        IVotes _token,
        SenateGovernor _senateGovernor,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    )
        Governor("GovernorContract")
        GovernorSettings(
            _votingDelay, /* 1 block */
            _votingPeriod, /* 1 week ~= 50400 blocks */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage) /* 4% */
    {
        senateGovernor = _senateGovernor;
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    // function state(uint256 proposalId)
    //     public
    //     view
    //     override(Governor)
    //     returns (ProposalState)
    // {
    //     return super.state(proposalId);
    // }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // function _execute(
    //     uint256 proposalId,
    //     address[] memory targets,
    //     uint256[] memory values,
    //     bytes[] memory calldatas,
    //     bytes32 descriptionHash
    // ) internal override(Governor) {
    //     super._execute(proposalId, targets, values, calldatas, descriptionHash);
    // }

    // function _cancel(
    //     address[] memory targets,
    //     uint256[] memory values,
    //     bytes[] memory calldatas,
    //     bytes32 descriptionHash
    // ) internal override(Governor) returns (uint256) {
    //     return super._cancel(targets, values, calldatas, descriptionHash);
    // }

    // function _executor() internal view override(Governor) returns (address) {
    //     return super._executor();
    // }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Somewhat based on GovernorTimelockControl:

    /**
     * @dev Emitted when a proposal is forwarded to the senate
     */
    event ProposalForwardedToSenate(uint256 indexed proposalId);

    /**
     * @dev Overridden version of {Governor-state} function with added support for the
     * `InSenate` and `Queued` status.
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        override(Governor)
        returns (ProposalState)
    {
        ProposalState status = super.state(proposalId);

        // if queued, was successful and then passed from house to senate
        bool queued = forwardedProposalIds[proposalId];
        if (queued) {
            // get and return state from senate
            return senateGovernor.state(proposalId);
        }

        return status;
    }

    /**
     * @dev Public accessor to check the address of the senate
     */
    function senate() public view virtual returns (address) {
        return address(senateGovernor);
    }

    /**
     * @dev Function to queue a proposal to the senate.
     * Modification from GovernorTImelockControl:
     * bytes32 descriptionHash => string memory description
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual returns (uint256) {
        bytes32 descriptionHash = keccak256(bytes(description));

        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        ProposalState status = state(proposalId);
        require(
            status != ProposalState.Queued,
            "house-governor:already-queued"
        );

        // has to have succeeded in house
        require(
            status == ProposalState.Succeeded,
            "house-governor:proposal-has-not-succeeded"
        );

        senateGovernor.propose(targets, values, calldatas, description);
        forwardedProposalIds[proposalId] = true;

        emit ProposalForwardedToSenate(proposalId);

        return proposalId;
    }

    /**
     * @dev Overridden execute function that runs proposals that have been queued from the senate.
     * Preferable to call the execute method on the senate directly!
     */
    function _execute(
        uint256, /* proposalId */
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override {
        senateGovernor.execute(
            // proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    /**
     * @dev Overridden version of the {Governor-_cancel} function to cancel proposals
     * -- that doesn't do anything. Proposals only cancellable from senate.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override returns (uint256) {
        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        return proposalId;
    }

    /**
     * @dev Address through which the governor executes action, i.e. the senate governor.
     */
    function _executor() internal view virtual override returns (address) {
        return address(senateGovernor);
    }
}
