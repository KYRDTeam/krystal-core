// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./BaseSwap.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";
import "../interfaces/OneInchV5AggregationRouter.sol";

contract OneInch is BaseSwap {
    using SafeERC20 for IERC20Ext;
    using Address for address;

    OneInchV5AggregationRouter public router;

    event UpdatedAggregationRouter(OneInchV5AggregationRouter router);

    constructor(address _admin, OneInchV5AggregationRouter _router) BaseSwap(_admin) {
        router = _router;
    }

    function updateAggregationRouter(OneInchV5AggregationRouter _router) external onlyAdmin {
        router = _router;
        emit UpdatedAggregationRouter(router);
    }

    /// @dev get expected return and conversion rate if using a Uni router
    function getExpectedReturn(GetExpectedReturnParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 destAmount)
    {
        require(false, "getExpectedReturn_notSupported");
    }

    function getExpectedReturnWithImpact(GetExpectedReturnParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 destAmount, uint256 priceImpact)
    {
        require(false, "getExpectedReturn_notSupported");
    }

    function getExpectedIn(GetExpectedInParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 srcAmount)
    {
        require(false, "getExpectedIn_notSupported");
    }

    function getExpectedInWithImpact(GetExpectedInParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 srcAmount, uint256 priceImpact)
    {
        require(false, "getExpectedIn_notSupported");
    }

    /// @dev swap token
    /// @notice
    /// 1inch API will returns data neccessary to build tx
    /// tx's data will be passed by params.extraData
    function swap(SwapParams calldata params)
        external
        payable
        override
        onlyProxyContract
        returns (uint256 destAmount)
    {
        require(params.tradePath.length == 2, "oneInch_invalidTradepath");

        safeApproveAllowance(address(router), IERC20Ext(params.tradePath[0]));

        bytes4 methodId = params.extraArgs[0] |
            (bytes4(params.extraArgs[1]) >> 8) |
            (bytes4(params.extraArgs[2]) >> 16) |
            (bytes4(params.extraArgs[3]) >> 24);

        if (methodId == OneInchV5AggregationRouter.unoswap.selector) {
            return doUnoswap(params);
        }

        if (methodId == OneInchV5AggregationRouter.swap.selector) {
            return doSwap(params);
        }

        if (methodId == OneInchV5AggregationRouter.uniswapV3Swap.selector) {
            return doUniswapV3Swap(params);
        }

        require(false, "oneInch_invalidExtraArgs");
    }

    function doUnoswap(SwapParams calldata params) private returns (uint256 destAmount) {
        address srcToken;
        uint256 callValue;
        if (params.tradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            srcToken = address(0);
            callValue = params.srcAmount;
        } else {
            srcToken = params.tradePath[0];
            callValue = 0;
        }
        uint256[] memory data;
        (, , , data) = abi.decode(params.extraArgs[4:], (address, uint256, uint256, uint256[]));

        destAmount = router.unoswap{value: callValue}(
            srcToken,
            params.srcAmount,
            params.minDestAmount,
            data
        );

        if (params.tradePath[1] == address(ETH_TOKEN_ADDRESS)) {
            (bool success, ) = params.recipient.call{value: destAmount}("");
        } else {
            IERC20Ext(params.tradePath[1]).safeTransfer(params.recipient, destAmount);
        }
    }

    /// @dev called when 1inch API returns method AggregationRouter.swap
    /// @notice AggregationRouter.swap method used a custom calldata.
    /// Since we don't know what included in that calldata, backend must take into account fee
    /// when calling 1inch API
    function doSwap(SwapParams calldata params) private returns (uint256 destAmount) {
        uint256 callValue;
        if (params.tradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            callValue = params.srcAmount;
        } else {
            callValue = 0;
        }

        address aggregationExecutor;
        OneInchV5AggregationRouter.SwapDescription memory desc;
        bytes memory data;
        bytes memory permit;

        (aggregationExecutor, desc, permit, data) = abi.decode(
            params.extraArgs[4:],
            (address, OneInchV5AggregationRouter.SwapDescription, bytes, bytes)
        );

        (destAmount, ) = router.swap{value: callValue}(
            aggregationExecutor,
            OneInchV5AggregationRouter.SwapDescription({
                srcToken: params.tradePath[0],
                dstToken: params.tradePath[1],
                srcReceiver: desc.srcReceiver,
                dstReceiver: params.recipient,
                amount: params.srcAmount,
                minReturnAmount: params.minDestAmount,
                flags: desc.flags
            }),
            permit,
            data
        );
    }

    function doUniswapV3Swap(SwapParams calldata params) private returns (uint256 destAmount) {
        uint256 callValue;
        if (params.tradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            callValue = params.srcAmount;
        } else {
            callValue = 0;
        }

        uint256[] memory data;
        (, , data) = abi.decode(params.extraArgs[4:], (uint256, uint256, uint256[]));

        destAmount = router.uniswapV3Swap{value: callValue}(
            params.srcAmount,
            params.minDestAmount,
            data
        );

        if (params.tradePath[1] == address(ETH_TOKEN_ADDRESS)) {
            (bool success, ) = params.recipient.call{value: destAmount}("");
        } else {
            IERC20Ext(params.tradePath[1]).safeTransfer(params.recipient, destAmount);
        }
    }

    function doClipperSwap(SwapParams calldata params) private returns (uint256 destAmount) {
        uint256 callValue;
        if (params.tradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            callValue = params.srcAmount;
        } else {
            callValue = 0;
        }

        address clipperExchange;
        uint256 outputAmount;
        uint256 goodUntil;
        bytes32 r;
        bytes32 vs;
        (clipperExchange, , , , outputAmount, goodUntil, r, vs) = abi.decode(
            params.extraArgs[4:],
            (address, address, address, uint256, uint256, uint256, bytes32, bytes32)
        );

        destAmount = router.clipperSwap{value: callValue}(
            clipperExchange,
            params.tradePath[0],
            params.tradePath[1],
            params.srcAmount,
            outputAmount,
            goodUntil,
            r,
            vs
        );

        if (params.tradePath[1] == address(ETH_TOKEN_ADDRESS)) {
            (bool success, ) = params.recipient.call{value: destAmount}("");
        } else {
            IERC20Ext(params.tradePath[1]).safeTransfer(params.recipient, destAmount);
        }
    }
}
