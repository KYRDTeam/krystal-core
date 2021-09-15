// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma abicoder v2;

import "./KrystalClaimStorage.sol";
import "./IKrystalClaim.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract KrystalClaimImpl is KrystalClaimStorage, IKrystalClaim {
    using SafeERC20 for IERC20;

    function initialize(address _admin, address _verifier) public initializer {
        __Context_init_unchained();
        __Pausable_init_unchained();
        __AccessControl_init_unchained();

        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        verifier = _verifier;
        assembly {
            sstore(chainId.slot, chainid())
        }
    }

    receive() external payable {}

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "unauthorized: admin required");
        _;
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function setVerifier(address _verifier) external onlyAdmin {
        verifier = _verifier;
        emit SetVerifier(_verifier);
    }

    function setClaimCap(address token, uint256 newCap) external onlyAdmin {
        claimCap[token] = newCap;
        emit SetClaimCap(token, newCap);
    }

    function claim(
        address recipient,
        uint256 claimId,
        address token,
        uint256 claimAmount,
        bytes memory signature
    ) external override whenNotPaused {
        claimInternal(recipient, claimId, token, claimAmount, signature);
    }

    function claimAll(
        address recipient,
        uint256[] memory claimIds,
        address[] memory tokens,
        uint256[] memory claimAmounts,
        bytes[] memory signatures
    ) external override whenNotPaused {
        uint256 claims = claimIds.length;
        require(claims == tokens.length, "claimAll: wrong tokens");
        require(claims == claimAmounts.length, "claimAll: wrong amounts");
        require(claims == signatures.length, "claimAll: wrong signatures");

        for (uint256 i = 0; i < claims; i += 1) {
            claimInternal(recipient, claimIds[i], tokens[i], claimAmounts[i], signatures[i]);
        }
    }

    function claimInternal(
        address recipient,
        uint256 claimId,
        address token,
        uint256 claimAmount,
        bytes memory signature
    ) private {
        // Mostly for replay attack
        require(!claimed[claimId], "claim: claimed");
        require(claimAmount <= claimCap[token], "claim: amount too big");

        // Re-build message to sign and verify
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 message = keccak256(
            abi.encodePacked(
                prefix,
                keccak256(abi.encodePacked(chainId, recipient, claimId, token, claimAmount))
            )
        );
        verifyMessage(message, signature);

        // Verified, trigger the claim
        claimed[claimId] = true;
        if (token == NATIVE_TOKEN) {
            (bool success, ) = recipient.call{value: claimAmount}("");
            require(success, "transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, claimAmount);
        }
        emit Claim(recipient, claimId, token, claimAmount);
    }

    function verifyMessage(bytes32 message, bytes memory signature) private view {
        require(signature.length == 65, "verify: wrong signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // First 32 bytes is for the length
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := and(mload(add(signature, 65)), 255)
        }
        // Arbitrary EVM magic .i.e 27 and 28 for the version
        if (v < 27) v += 27;

        require(ecrecover(message, v, r, s) == verifier, "verify: failed");
    }
}
