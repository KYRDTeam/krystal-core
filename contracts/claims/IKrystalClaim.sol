// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma abicoder v2;

interface IKrystalClaim {
    event Claim(
        address indexed recipient,
        uint256 indexed claimId,
        address token,
        uint256 claimAmount
    );

    event SetVerifier(address verifier);

    event SetClaimCap(address token, uint256 newCap);

    function claim(
        address recipient,
        uint256 claimId,
        address token,
        uint256 claimAmount,
        bytes memory signature
    ) external;

    function claimAll(
        address recipient,
        uint256[] memory claimIds,
        address[] memory tokens,
        uint256[] memory claimAmounts,
        bytes[] memory signatures
    ) external;
}
