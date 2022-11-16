// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./HouseGovernor.sol";

contract SenateGovernor is
    AccessControl,
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // can set settings - set to governance i.e. timelock
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    // can "veto" i.e. cancel
    bytes32 public constant PRESIDENT_ROLE = keccak256("PRESIDENT_ROLE");
    // can forward proposals to senate i.e. call propose
    bytes32 public constant HOUSE_ROLE = keccak256("HOUSE_ROLE");

    address public president;
    HouseGovernor public house;

    event ProposalVetoed(
        uint256 indexed proposalId,
        string reason,
        address president
    );

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage,
        HouseGovernor _house,
        address _president,
        bool presidentDeposable
    )
        Governor("GovernorContract")
        GovernorSettings(
            _votingDelay, /* 1 block */
            _votingPeriod, /* 1 week ~= 50400 blocks */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage) /* 4% */
        GovernorTimelockControl(_timelock)
    {
        _setupRole(HOUSE_ROLE, address(_house));
        house = _house;

        _setupRole(PRESIDENT_ROLE, _president);
        president = _president;

        if (presidentDeposable) {
            _setRoleAdmin(PRESIDENT_ROLE, GOVERNANCE_ROLE);
        }
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

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        override(Governor, IGovernor)
        returns (
            // onlyRole(HOUSE_ROLE)
            uint256
        )
    {
        require(
            hasRole(HOUSE_ROLE, _msgSender()),
            "parliament:only-house-can-propose-to-senate"
        );
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

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Custom
    function getPresident() public view returns (address) {
        return president;
    }

    function setPresident(address newPresident)
        public
        // onlyRole(GOVERNANCE_ROLE)
        onlyGovernance
    {
        // president deposable by governance?
        require(
            getRoleAdmin(PRESIDENT_ROLE) == GOVERNANCE_ROLE,
            "Tyranny:President-not-deposable"
        );

        revokeRole(PRESIDENT_ROLE, president);
        grantRole(PRESIDENT_ROLE, newPresident);

        president = newPresident;
    }

    function veto(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash,
        string memory reason // onlyRole(PRESIDENT_ROLE)
    ) public {
        require(
            hasRole(PRESIDENT_ROLE, _msgSender()),
            "parliament:only-president-can-veto"
        );

        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        require(
            state(proposalId) == ProposalState.Succeeded,
            "Only-successful-proposals-vetoable"
        );

        _cancel(targets, values, calldatas, descriptionHash);

        emit ProposalVetoed(proposalId, reason, president);
    }
}
