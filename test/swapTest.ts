import {bnbAddress, bnbDecimals, evm_revert, evm_snapshot} from './helper';
import {getInitialSetup, IInitialSetup} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';

describe('swap test', async () => {
  let setup: IInitialSetup;
  let platformFee = 8;

  before(async () => {
    setup = await getInitialSetup();
  });

  beforeEach(async () => {
    await evm_revert(setup.postSetupSnapshotId);
  });

  describe('should swap on Pancake', async () => {
    it('swap from bnb to token', async () => {
      let tokenAddresses = [setup.network.usdtAddress, setup.network.usdcAddress];
      let bnbAmount = BigNumber.from(10).pow(BigNumber.from(bnbDecimals)); // one bnb

      for (let i = 0; i < tokenAddresses.length; i++) {
        let token = tokenAddresses[i];
        let tradePath = [setup.network.wbnb, token]; // get rate needs to use wbnb

        // Get rate
        let data = await setup.swapProxyInstance.getExpectedReturnPancake(
          setup.network.pancake.router,
          bnbAmount,
          tradePath,
          platformFee
        );
        assert(!data.destAmount.isZero(), 'non-zero destAmount');
        assert(!data.expectedRate.isZero(), 'non-zero expectedRate');

        let minDestAmount = data.destAmount.mul(97).div(100);
        tradePath[0] = bnbAddress; // trade needs to use bnb address

        // Send txn
        await expect(
          await setup.swapProxyInstance.swapPancake(
            setup.network.pancake.router,
            bnbAmount,
            minDestAmount,
            tradePath,
            setup.user.address,
            platformFee,
            setup.network.supportedWallets[0],
            true,
            {
              from: setup.user.address,
              value: bnbAmount,
            }
          )
        ).to.changeEtherBalance(setup.user, BigNumber.from(0).sub(bnbAmount));

        // Missing value
        await expect(
          setup.swapProxyInstance.swapPancake(
            setup.network.pancake.router,
            bnbAmount,
            minDestAmount,
            tradePath,
            setup.user.address,
            platformFee,
            setup.network.supportedWallets[0],
            true,
            {
              from: setup.user.address,
              value: 0,
            }
          )
        ).to.be.revertedWith('wrong msg value');
      }
    });

    // it('swap from token to bnb', async () => {
    //   let tokenNames = ['USDT', 'USDC'];
    //   let tokenAddresses = [usdtAddress, usdcAddress];
    //   let routers = [uniswapRouter, sushj8i8i8i8hfetrhtutsgrhrgruihrhrgregygrjytwugiswapRouter];
    //   let routerNames = ['Uniswap', 'Sushiswap'];
    //   for (let i = 0; i < routers.length; i++) {
    //     for (let j = 0; j < tokenAddresses.length; j++) {
    //       let token = await IERC20Ext.at(tokenAddresses[j]);
    //       let tokenAmount = (await token.balanceOf(user)).div(new BN(5));
    //       let tradePath = [tokenAddresses[j], wethAddress]; // get rate needs to use weth
    //       let data = await swapProxy.getExpectedReturnUniswap(routers[i], tokenAmount, tradePath, 8);
    //       let minDestAmount = data.destAmount.mul(new BN(97)).div(new BN(100));
    //       tradePath[1] = ethAddress; // trade needs to use eth address
    //       let tx = await swapProxy.swapUniswap(
    //         routers[i],
    //         tokenAmount,
    //         minDestAmount,
    //         tradePath,
    //         user,
    //         8,
    //         user,
    //         true,
    //         false,
    //         {from: user}
    //       );
    //       let tokenBalanceAfter = await token.balanceOf(swapProxy.address);
    //       console.log(
    //         `[${routerNames[i]}] Transaction gas used ${tokenNames[j]} -> ETH without gas token: ${tx.receipt.gasUsed}`
    //       );
    //       tx = await swapProxy.swapUniswap(
    //         routers[i],
    //         tokenAmount,
    //         minDestAmount,
    //         tradePath,
    //         user,
    //         8,
    //         user,
    //         true,
    //         true,
    //         {from: user}
    //       );
    //       tokenBalanceAfter = await token.balanceOf(swapProxy.address);
    //       console.log(
    //         `[${routerNames[i]}] Transaction gas used ${tokenNames[j]} -> ETH with gas token: ${tx.receipt.gasUsed}`
    //       );
    //     }
    //   }
    // });
  });
});
