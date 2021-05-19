pragma solidity 0.7.6;

import "../interfaces/IPancakeRouter02.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";

interface ISmartWalletSwapImplementation {
    event PancakeTrade(
        address indexed trader,
        address indexed router,
        address[] tradePath,
        uint256 srcAmount,
        uint256 destAmount,
        address recipient,
        uint256 platformFeeBps,
        address platformWallet,
        bool feeInSrc
    );

    function getExpectedReturnPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        address[] calldata tradePath,
        uint256 platformFeeBps,
        bool feeInSrc
    ) external view returns (uint256 destAmount, uint256 expectedRate);

    function swapPancake(
        IPancakeRouter02 router,
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address payable recipient,
        uint256 platformFeeBps,
        address payable platformWallet,
        bool feeInSrc
    ) external payable returns (uint256 destAmount);

    function claimPlatformFees(address[] calldata platformWallets, IBEP20[] calldata tokens)
        external;
}
