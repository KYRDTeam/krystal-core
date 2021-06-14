// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./BaseSwap.sol";
import "../libraries/BytesLib.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/// General swap for uniswap and its clones
contract UniSwap is BaseSwap {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;
    using BytesLib for bytes;

    EnumerableSet.AddressSet private uniRouters;

    event UpdatedUniRouters(IUniswapV2Router02[] routers, bool isSupported);

    constructor(address _admin, IUniswapV2Router02[] memory routers) BaseSwap(_admin) {
        for (uint256 i = 0; i < routers.length; i++) {
            uniRouters.add(address(routers[i]));
        }
    }

    function getAllUniRouters() external view returns (address[] memory addresses) {
        uint256 length = uniRouters.length();
        addresses = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = uniRouters.at(i);
        }
    }

    function updateUniRouters(IUniswapV2Router02[] calldata routers, bool isSupported)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < routers.length; i++) {
            if (isSupported) {
                uniRouters.add(address(routers[i]));
            } else {
                uniRouters.remove(address(routers[i]));
            }
        }
        emit UpdatedUniRouters(routers, isSupported);
    }

    /// @dev get expected return and conversion rate if using a Uni router
    function getExpectedReturn(
        uint256 srcAmount,
        address[] calldata tradePath,
        bytes calldata extraArgs
    ) external view override onlyProxyContract returns (uint256 destAmount) {
        IUniswapV2Router02 router = parseExtraArgs(extraArgs);

        // in case pair is not supported
        try router.getAmountsOut(srcAmount, tradePath) returns (uint256[] memory amounts) {
            destAmount = amounts[tradePath.length - 1];
        } catch {
            destAmount = 0;
        }
    }

    /// @dev swap token via a supported UniSwap router
    /// @notice for some tokens that are paying fee, for example: DGX
    /// contract will trade with received src token amount (after minus fee)
    /// for UniSwap, fee will be taken in src token
    function swap(
        uint256 srcAmount,
        uint256 minDestAmount,
        address[] calldata tradePath,
        address recipient,
        bytes calldata extraArgs
    ) external payable override nonReentrant onlyProxyContract returns (uint256 destAmount) {
        require(tradePath.length >= 2, "invalid tradePath");

        IUniswapV2Router02 router = parseExtraArgs(extraArgs);

        safeApproveAllowance(address(router), IERC20Ext(tradePath[0]));

        uint256 tradeLen = tradePath.length;
        IERC20Ext actualSrc = IERC20Ext(tradePath[0]);
        IERC20Ext actualDest = IERC20Ext(tradePath[tradeLen - 1]);

        // convert eth/bnb -> weth/wbnb address to trade on Uni
        address[] memory convertedTradePath = tradePath;
        if (convertedTradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            convertedTradePath[0] = router.WETH();
        }
        if (convertedTradePath[tradeLen - 1] == address(ETH_TOKEN_ADDRESS)) {
            convertedTradePath[tradeLen - 1] = router.WETH();
        }

        uint256 destBalanceBefore = getBalance(actualDest, recipient);

        if (actualSrc == ETH_TOKEN_ADDRESS) {
            // swap eth/bnb -> token
            router.swapExactETHForTokensSupportingFeeOnTransferTokens{value: srcAmount}(
                minDestAmount,
                convertedTradePath,
                recipient,
                MAX_AMOUNT
            );
        } else {
            if (actualDest == ETH_TOKEN_ADDRESS) {
                // swap token -> eth/bnb
                router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    srcAmount,
                    minDestAmount,
                    convertedTradePath,
                    recipient,
                    MAX_AMOUNT
                );
            } else {
                // swap token -> token
                router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    srcAmount,
                    minDestAmount,
                    convertedTradePath,
                    recipient,
                    MAX_AMOUNT
                );
            }
        }

        destAmount = getBalance(actualDest, recipient).sub(destBalanceBefore);
    }

    /// @param extraArgs expecting <[20B] address router>
    function parseExtraArgs(bytes calldata extraArgs)
        internal
        view
        returns (IUniswapV2Router02 router)
    {
        require(extraArgs.length == 20, "invalid args");
        router = IUniswapV2Router02(extraArgs.toAddress(0));
        require(router != IUniswapV2Router02(0), "invalid address");
        require(uniRouters.contains(address(router)), "unsupported router");
    }
}
