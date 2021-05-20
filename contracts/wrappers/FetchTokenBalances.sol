pragma solidity 0.7.6;

import "@kyber.network/utils-sc/contracts/Withdrawable.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";

contract FetchTokenBalances is Withdrawable {
    constructor(address _admin) Withdrawable(_admin) {}

    IBEP20 internal constant BNB_TOKEN_ADDRESS = IBEP20(
        0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB
    );

    function getBalances(address account, IBEP20[] calldata tokens)
        external
        view
        returns (uint256[] memory balances)
    {
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == BNB_TOKEN_ADDRESS) {
                balances[i] = account.balance;
            } else {
                try tokens[i].balanceOf(account) returns (uint256 bal) {
                    balances[i] = bal;
                } catch {}
            }
        }
    }
}
