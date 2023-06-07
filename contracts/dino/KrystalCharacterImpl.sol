// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCharacterStorage.sol";
import "./IKrystalCharacter.sol";
import "./utils/Verifier.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract KrystalCharacterImpl is KrystalCharacterStorage {
    using Strings for uint256;
    uint256 public maxLevel = 10;

    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _uri,
        address _verifier
    ) public initializer {
        super.initialize(_name, _symbol, _uri);

        tokenUriPrefix = _uri;
        verifier = _verifier;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "unauthorized: admin required");
        _;
    }

    modifier onlyCharacterOwner(uint256 characterId) {
        require(ownerOf(characterId) == msg.sender, "Character: not character owner");
        _;
    }

    // ERC-721 Compatible
    function tokenUri(uint256 tokenId) external view returns (string memory) {
        return string(abi.encodePacked(tokenUriPrefix, tokenId.toString()));
    }

    function setMinter(address _minter) external onlyAdmin {
        _setupRole(MINTER_ROLE, _minter);
        emit SetMinter(_minter);
    }

    function setURI(string memory newuri) external onlyAdmin {
        super._setBaseURI(newuri);
        tokenUriPrefix = newuri;
    }

    function mintCharacter(address _receiver) public {
        mint(_receiver);
        _characters.push(Character("", 1));
        uint characterId = _characters.length - 1;

        emit CreateCharacter(characterId);
    }

    function getCharacter(
        uint256 characterId
    ) external view returns (string memory name, uint level) {
        Character memory character = _characters[characterId];
        name = character.name;
        level = character.level;
    }

    function changeCharacterName(
        uint256 characterId,
        string memory newName,
        bytes memory signature
    ) external onlyCharacterOwner(characterId) {
        require(_validateStr(newName), "Character: invalid name");
        require(reservedName[newName] == false, "Character: name already existed");
        {
            bytes memory prefix = "\x19Ethereum Signed Message:\n32";
            bytes32 message = keccak256(
                abi.encodePacked(
                    prefix,
                    keccak256(abi.encodePacked(_msgSender(), characterId, newName))
                )
            );
            Verifier.verifyMessage(message, signature, verifier);
        }

        Character storage character = _characters[characterId];
        if (bytes(character.name).length > 0) {
            reservedName[character.name] = false;
        }

        character.name = newName;
        reservedName[newName] = true;

        emit NameChanged(characterId, newName);
    }

    function levelUp(
        uint256 characterId,
        uint256 newLevel,
        bytes memory signature
    ) external onlyCharacterOwner(characterId) {
        {
            bytes memory prefix = "\x19Ethereum Signed Message:\n32";
            bytes32 message = keccak256(
                abi.encodePacked(
                    prefix,
                    keccak256(abi.encodePacked(_msgSender(), characterId, newLevel))
                )
            );
            Verifier.verifyMessage(message, signature, verifier);
        }

        Character storage character = _characters[characterId];
        require(newLevel > character.level, "Character: invalid level");
        require(newLevel <= maxLevel, "Character: max level reached");
        character.level = newLevel;

        emit CharacterLeveledUp(characterId, newLevel);
    }

    /**
     * @dev Check if the name string is valid (Alphanumeric and spaces without leading or trailing space)
     */
    function _validateStr(string memory str) internal pure returns (bool) {
        bytes memory b = bytes(str);
        if (b.length < 1) return false;
        if (b.length > 20) return false;

        // Leading space
        if (b[0] == 0x20) return false;

        // Trailing space
        if (b[b.length - 1] == 0x20) return false;

        bytes1 lastChar = b[0];

        for (uint i; i < b.length; i++) {
            bytes1 char = b[i];

            // Cannot contain continuous spaces
            if (char == 0x20 && lastChar == 0x20) return false;

            if (
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) && //a-z
                !(char == 0x20) //space
            ) {
                return false;
            }

            lastChar = char;
        }

        return true;
    }
}
