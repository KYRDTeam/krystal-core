pragma solidity 0.7.6;

import "./interfaces/IPancakeRouter02.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";
import "@kyber.network/utils-sc/contracts/Utils.sol";
import "@kyber.network/utils-sc/contracts/Withdrawable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SmartWalletSwapStorage is Utils, Withdrawable, ReentrancyGuard {
    uint256 internal constant MAX_AMOUNT = uint256(-1);

    mapping(address => mapping(IBEP20 => uint256)) public platformWalletFees;

    // Proxy and routers will be set only once in constructor
    // Pancake / its clones routers
    mapping(IPancakeRouter02 => bool) public pancakeRouters;

    mapping(address => bool) public supportedPlatformWallets;

    struct TradeInput {
        uint256 srcAmount;
        uint256 minData; // min rate if Kyber, min return if Uni-pools
        address payable recipient;
        uint256 platformFeeBps;
        address payable platformWallet;
        bytes hint;
    }

    // [EIP-1967] bytes32(uint256(keccak256("SmartWalletSwapImplementation")) - 1)
    bytes32 internal constant IMPLEMENTATION =
        0x6a7efb0627ddb0e69b773958c7c9c3c9c3dc049819cdf56a8ee84c3074b2a5d7;

    constructor(address _admin) Withdrawable(_admin) {}
}