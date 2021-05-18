pragma solidity 0.7.6;

import "@kyber.network/utils-sc/contracts/Withdrawable.sol";
import "@kyber.network/utils-sc/contracts/IBEP20.sol";
import "@kyber.network/utils-sc/contracts/Utils.sol";

contract FetchTokenBalances is Utils, Withdrawable {
    constructor (address _admin) Withdrawable(_admin) {}

    function getBalances(address account, IBEP20[] calldata tokens)
        external view
        returns(uint256[] memory balances)
    {
        balances = new uint[](tokens.length);
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