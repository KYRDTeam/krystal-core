// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

import "./KrystalCharacterStorage.sol";
import "./IKrystalCharacter.sol";
import "./KrystalCharacterImpl.sol";
import "./utils/Verifier.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract KrystalCharacterMinter is IKrystalCharacter, AccessControlUpgradeable {
    using Strings for uint256;

    // Backend signer for verifying
    address public verifier;
    mapping(uint256 => bool) public minted;
    address public characterContract;

    function initialize(address _admin, address _verifier, address _character) public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        verifier = _verifier;
        characterContract = _character;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "unauthorized: admin required");
        _;
    }

    function setCharacterContract(address _character) external onlyAdmin {
        characterContract = _character;
        emit SetCharacterContract(_character);
    }

    function setVerifier(address _verifier) external onlyAdmin {
        verifier = _verifier;
        emit SetVerifier(_verifier);
    }

    function mint(
        address buyer,
        uint256[] calldata bodyPartIds,
        bytes memory signature
    ) external payable {
        {
            bytes memory prefix = "\x19Ethereum Signed Message:\n32";
            bytes32 message = keccak256(
                abi.encodePacked(
                    prefix,
                    keccak256(
                        abi.encodePacked(
                            buyer,
                            bodyPartIds[0],
                            bodyPartIds[1],
                            bodyPartIds[2],
                            bodyPartIds[3],
                            bodyPartIds[4]
                        )
                    )
                )
            );
            Verifier.verifyMessage(message, signature, verifier);
        }

        // verify bodyParts
        for (uint256 i = 0; i < bodyPartIds.length; i += 1) {
            require(minted[bodyPartIds[i]] != true, "mint: part minted");
            minted[bodyPartIds[i]] = true;
        }

        KrystalCharacterImpl(characterContract).mintCharacter(buyer);
    }
}
