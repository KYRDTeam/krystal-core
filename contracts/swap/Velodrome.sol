// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "./BaseSwap.sol";
import "../libraries/BytesLib.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@kyber.network/utils-sc/contracts/IERC20Ext.sol";
import "../interfaces/IVelodromeRouter.sol";

/// General swap for Velodrome and its clones
contract Velodrome is BaseSwap {
    using SafeERC20 for IERC20Ext;
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;
    using BytesLib for bytes;

    EnumerableSet.AddressSet private velodromeRouters;
    EnumerableSet.AddressSet private velodromeStablecoins;
    address public wEth;
    mapping(address => bytes4) public customSwapFromEth;
    mapping(address => bytes4) public customSwapToEth;

    event UpdatedVelodromeRouters(IVelodromeRouter[] routers, bool isSupported);
    event UpdatedVelodromeStablecoins(address[] stablecoins, bool isSupported);

    constructor(
        address _admin,
        IVelodromeRouter[] memory routers,
        address[] memory stablecoins,
        address _weth
    ) BaseSwap(_admin) {
        {
            for (uint256 i = 0; i < routers.length; i++) {
                velodromeRouters.add(address(routers[i]));
            }
            for (uint256 i = 0; i < stablecoins.length; i++) {
                velodromeStablecoins.add(address(stablecoins[i]));
            }
            wEth = _weth;
        }
    }

    function getAllVelodromeRouters() external view returns (address[] memory addresses) {
        uint256 length = velodromeRouters.length();
        addresses = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = velodromeRouters.at(i);
        }
    }

    function updateCustomSwapSelector(
        address _router,
        bytes4 _swapFromEth,
        bytes4 _swapToEth
    ) external onlyAdmin {
        customSwapFromEth[_router] = _swapFromEth;
        customSwapToEth[_router] = _swapToEth;
    }

    function updateVelodromeRouters(IVelodromeRouter[] calldata routers, bool isSupported)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < routers.length; i++) {
            if (isSupported) {
                velodromeRouters.add(address(routers[i]));
            } else {
                velodromeRouters.remove(address(routers[i]));
            }
        }
        emit UpdatedVelodromeRouters(routers, isSupported);
    }

    function getAllVelodromeStablecoins() external view returns (address[] memory addresses) {
        uint256 length = velodromeStablecoins.length();
        addresses = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = velodromeStablecoins.at(i);
        }
    }

    function updateVelodromeStablecoins(address[] calldata stablecoins, bool isSupported)
        external
        onlyAdmin
    {
        for (uint256 i = 0; i < stablecoins.length; i++) {
            if (isSupported) {
                velodromeRouters.add(address(stablecoins[i]));
            } else {
                velodromeRouters.remove(address(stablecoins[i]));
            }
        }
        emit UpdatedVelodromeStablecoins(stablecoins, isSupported);
    }

    /// @dev get expected return and conversion rate if using a Velodrome router
    function getExpectedReturn(GetExpectedReturnParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 destAmount)
    {
        address router = parseExtraArgs(params.extraArgs);
        Route[] memory routes = convertFromTradePathToRoutes(params.tradePath);
        uint256[] memory amounts = IVelodromeRouter(router).getAmountsOut(
            params.srcAmount,
            routes
        );
        destAmount = amounts[params.tradePath.length - 1];
    }

    /// @dev get expected return and conversion rate if using a Velodrome router
    function getExpectedReturnWithImpact(GetExpectedReturnParams calldata params)
        external
        view
        override
        onlyProxyContract
        returns (uint256 destAmount, uint256 priceImpact)
    {
        address router = parseExtraArgs(params.extraArgs);
        Route[] memory routes = convertFromTradePathToRoutes(params.tradePath);
        uint256[] memory amounts = IVelodromeRouter(router).getAmountsOut(
            params.srcAmount,
            routes
        );
        destAmount = amounts[params.tradePath.length - 1];
        priceImpact = getPriceImpact(router, params.srcAmount, destAmount, params.tradePath);
    }

    function getPriceImpact(
        address router,
        uint256 srcAmount,
        uint256 destAmount,
        address[] memory path
    ) private view returns (uint256 priceImpact) {
        uint256 tradeLen = path.length;
        require(tradeLen > 1, "trade path must be greater than 1");
        Route[] memory routes = new Route[](tradeLen - 1);
        if (path[0] == address(ETH_TOKEN_ADDRESS)) {
            path[0] = wEth;
        }
        if (path[tradeLen - 1] == address(ETH_TOKEN_ADDRESS)) {
            path[tradeLen - 1] = wEth;
        }
        uint256 quote = srcAmount;
        for (uint256 i; i < tradeLen - 1; i++) {
            bool stable = isStablePair(path[i], path[i + 1]);
            (uint256 reserveIn, uint256 reserveOut) = IVelodromeRouter(router).getReserves(
                path[i],
                path[i + 1],
                stable
            );
            quote = quoteLiquidity(
                // Current hardcode 0.05% (MAX_FEE of Velodrome pools) for simplicity
                quote.mul(9995).div(10000),
                reserveIn,
                reserveOut
            );
        }

        if (quote <= destAmount) {
            priceImpact = 0;
        } else {
            priceImpact = quote.sub(destAmount).mul(BPS).div(quote);
        }
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
        require(false, "getExpectedInWithImpact_notSupported");
    }

    /// @dev swap token via a supported Velodrome router
    /// @notice for some tokens that are paying fee, for example: DGX
    /// contract will trade with received src token amount (after minus fee)
    /// for Velodrome, fee will be taken in src token
    function swap(SwapParams calldata params)
        external
        payable
        override
        onlyProxyContract
        returns (uint256 destAmount)
    {
        require(params.tradePath.length >= 2, "invalid tradePath");
        address router = parseExtraArgs(params.extraArgs);
        safeApproveAllowance(router, IERC20Ext(params.tradePath[0]));
        uint256 tradeLen = params.tradePath.length;
        IERC20Ext actualSrc = IERC20Ext(params.tradePath[0]);
        IERC20Ext actualDest = IERC20Ext(params.tradePath[tradeLen - 1]);
        // convert eth -> weth address to trade on Velodrome
        address[] memory convertedTradePath = params.tradePath;
        if (convertedTradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            convertedTradePath[0] = wEth;
        }
        if (convertedTradePath[tradeLen - 1] == address(ETH_TOKEN_ADDRESS)) {
            convertedTradePath[tradeLen - 1] = wEth;
        }

        Route[] memory routes = convertFromTradePathToRoutes(convertedTradePath);

        uint256 destBalanceBefore = getBalance(actualDest, params.recipient);
        if (actualSrc == ETH_TOKEN_ADDRESS) {
            // swap eth -> token
            if (customSwapFromEth[address(router)] != "") {
                (bool success, ) = router.call{value: params.srcAmount}(
                    abi.encodeWithSelector(
                        customSwapFromEth[address(router)],
                        params.minDestAmount,
                        routes,
                        params.recipient,
                        MAX_AMOUNT
                    )
                );
                require(success, "swapFromEth: failed");
            } else {
                IVelodromeRouter(router).swapExactETHForTokens{value: params.srcAmount}(
                    params.minDestAmount,
                    routes,
                    params.recipient,
                    MAX_AMOUNT
                );
            }
        } else {
            if (actualDest == ETH_TOKEN_ADDRESS) {
                // swap token -> eth
                if (customSwapToEth[address(router)] != "") {
                    (bool success, ) = router.call(
                        abi.encodeWithSelector(
                            customSwapToEth[address(router)],
                            params.srcAmount,
                            params.minDestAmount,
                            routes,
                            params.recipient,
                            MAX_AMOUNT
                        )
                    );
                    require(success, "swapToEth: failed");
                } else {
                    IVelodromeRouter(router).swapExactTokensForETH(
                        params.srcAmount,
                        params.minDestAmount,
                        routes,
                        params.recipient,
                        MAX_AMOUNT
                    );
                }
            } else {
                // swap token -> token
                IVelodromeRouter(router).swapExactTokensForTokens(
                    params.srcAmount,
                    params.minDestAmount,
                    routes,
                    params.recipient,
                    MAX_AMOUNT
                );
            }
        }
        destAmount = getBalance(actualDest, params.recipient).sub(destBalanceBefore);
    }

    /// @param extraArgs expecting <[20B] address router>
    function parseExtraArgs(bytes calldata extraArgs) internal view returns (address router) {
        require(extraArgs.length == 20, "invalid args");
        router = extraArgs.toAddress(0);
        require(router != address(0), "invalid address");
        require(velodromeRouters.contains(router), "unsupported router");
    }

    function quoteLiquidity(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountB) {
        require(amountA > 0, "Router: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "Router: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function convertFromTradePathToRoutes(address[] memory tradePath)
        private
        view
        returns (Route[] memory routes)
    {
        uint256 tradeLen = tradePath.length;
        require(tradeLen > 1, "trade path must be greater than 1");
        Route[] memory routes = new Route[](tradeLen - 1);
        if (tradePath[0] == address(ETH_TOKEN_ADDRESS)) {
            tradePath[0] = wEth;
        }
        if (tradePath[tradeLen - 1] == address(ETH_TOKEN_ADDRESS)) {
            tradePath[tradeLen - 1] = wEth;
        }
        for (uint256 i = 0; i < tradeLen - 1; i++) {
            bool stable = isStablePair(tradePath[i], tradePath[i + 1]);
            routes[i] = Route({from: tradePath[i], to: tradePath[i + 1], stable: stable});
        }
        return routes;
    }

    function isStablePair(address tokenA, address tokenB) private view returns (bool) {
        if (velodromeStablecoins.contains(tokenA) && velodromeStablecoins.contains(tokenB)) {
            return true;
        } else return false;
    }
}
