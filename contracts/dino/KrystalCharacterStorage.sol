// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol";
import "./IKrystalCharacter.sol";

contract KrystalCharacterStorage is
    IKrystalCharacter,
    ERC721PresetMinterPauserAutoIdUpgradeable,
    ReentrancyGuard
{
    string public tokenUriPrefix;
    mapping(string => bool) public reservedName;
    Character[] internal _characters;

    // Backend signer for verifying
    address public verifier;
}
