// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AchievementsToken is ERC1155, Ownable, Pausable, ERC1155Supply {
    using Counters for Counters.Counter;

    struct AchievementType {
        uint256 tokenId;
        string name;
        string uri;
    }
    mapping(string => AchievementType) public achievementTypes;
    Counters.Counter private _tokenIds;

    constructor(address owner) ERC1155("") {
        _transferOwnership(owner);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    // Custom
    function addAchievementType(string memory name, string memory uri)
        public
        onlyOwner
    {
        require(
            achievementTypes[name].tokenId == 0,
            "achievement-type-already-exists"
        );

        uint256 newTokenId = _tokenIds.current();
        achievementTypes[name] = AchievementType(newTokenId, name, uri);
    }

    function _getAchievementType(string memory name)
        internal
        view
        returns (AchievementType memory)
    {
        require(
            bytes(achievementTypes[name].name).length > 0,
            "achievement-type-does-not-exist"
        );

        return achievementTypes[name];
    }

    function getAchievementType(string memory name)
        public
        view
        returns (AchievementType memory)
    {
        return _getAchievementType(name);
    }

    function getAchievementTypeTokenId(string memory name)
        internal
        view
        returns (uint256)
    {
        return _getAchievementType(name).tokenId;
    }

    function rewardAchievement(
        address account,
        string memory achievementType,
        uint256 amount
    ) public onlyOwner {
        uint256 tokenId = _getAchievementType(achievementType).tokenId;
        _mint(account, tokenId, amount, new bytes(0));
    }
}
