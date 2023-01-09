// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;

library Verifier {
    function verifyMessage(bytes32 message, bytes memory signature, address verifier) internal view {
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