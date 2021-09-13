// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCollectiblesStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract KrystalCollectiblesImpl is KrystalCollectiblesStorage {
    using Strings for uint256;

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _uri
    ) public initializer {
        super.initialize(_uri);
        name = _name;
        symbol = _symbol;
        tokenUriPrefix = _uri;
    }

    // Overriding original ERC-1155 format
    function uri(uint256 tokenId) external view override returns (string memory) {
        return string(abi.encodePacked(tokenUriPrefix, tokenId.toString()));
    }

    // ERC-721 Compatible
    function tokenUri(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(tokenUriPrefix, tokenId.toString()));
    }

    function setURI(string memory newuri) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "setURI: admin required");
        super._setURI(newuri);
        tokenUriPrefix = newuri;
    }
}
