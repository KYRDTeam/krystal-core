pragma solidity 0.7.6;

library BytesLib {
    function toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address temp) {
        require(_start + 20 >= _start, "toAddress_overflow");
        require(_bytes.length >= _start + 20, "toAddress_outOfBounds");
        assembly {
            temp := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }
    }

    function toUint24(bytes memory _bytes, uint256 _start) internal pure returns (uint24 temp) {
        require(_start + 3 >= _start, "toUint24_overflow");
        require(_bytes.length >= _start + 3, "toUint24_outOfBounds");
        assembly {
            temp := mload(add(add(_bytes, 0x3), _start))
        }
    }
}
