import {bnbAddress, bnbDecimals, BPS, evm_revert, evm_snapshot} from './helper';
import {getInitialSetup, IInitialSetup} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IBEP20} from '../typechain';
import {ethers} from 'hardhat';

describe('swap test', async () => {
  let setup: IInitialSetup;
  let platformFee = 8;
  let eps = 10e-2;
  let tokenAddresses: string[] = [];

  before(async () => {
    setup = await getInitialSetup();
    tokenAddresses = [setup.network.usdtAddress, setup.network.usdcAddress];
  });

  beforeEach(async () => {
    await evm_revert(setup.postSetupSnapshotId);
  });

  describe('should swap on Pancake', async () => {
    const testGetExpectedRate = async (
      srcAmount: BigNumber,
      tradePath: string[],
      feeInSrc: boolean = true
    ): Promise<BigNumber> => {
      const data = await setup.swapProxyInstance.getExpectedReturnPancake(
        setup.network.pancake.routers[0],
        srcAmount,
        tradePath,
        platformFee,
        feeInSrc
      );
      assert(!data.destAmount.isZero(), 'non-zero destAmount');
      assert(!data.expectedRate.isZero(), 'non-zero expectedRate');

      const pancakeData = await setup.pancakeRouter.getAmountsOut(srcAmount, tradePath);
      const pancakeDest = pancakeData[pancakeData.length - 1];
      const amountDiff = pancakeDest.sub(data.destAmount);
      const actualFee = amountDiff.mul(BPS).mul(1000).div(pancakeDest).toNumber() / 1000;
      assert(
        Math.abs(actualFee - platformFee) < eps,
        `fee should be around ${platformFee} bps. actual fee = ${actualFee}, expected = ${platformFee}`
      );

      return data.destAmount;
    };

    it('get expected rate correctly', async () => {
      let bnbAmount = BigNumber.from(10).pow(BigNumber.from(bnbDecimals)); // one bnb
      let tradePath = [setup.network.wbnb, tokenAddresses[0]]; // get rate needs to use wbnb
      await testGetExpectedRate(bnbAmount, tradePath, false);
      await testGetExpectedRate(bnbAmount, tradePath, true);
    });

    it('swap from bnb to token', async () => {
      let bnbAmount = BigNumber.from(10).pow(BigNumber.from(bnbDecimals)); // one bnb

      for (let i = 0; i < tokenAddresses.length; i++) {
        let token = tokenAddresses[i];
        let tradePath = [setup.network.wbnb, token]; // get rate needs to use wbnb

        // Get rate
        const destAmount = await testGetExpectedRate(bnbAmount, tradePath);

        let minDestAmount = destAmount.mul(97).div(100);
        tradePath[0] = bnbAddress; // trade needs to use bnb address

        // Send txn
        await expect(
          await setup.swapProxyInstance.swapPancake(
            setup.network.pancake.routers[0],
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
            setup.network.pancake.routers[0],
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

    it('swap from token to bnb/other tokens', async () => {
      for (let i = 0; i < tokenAddresses.length; i++) {
        let token = (await ethers.getContractAt('IBEP20', tokenAddresses[i])) as IBEP20;
        let tokenAmount = BigNumber.from(10).pow(await token.decimals()); // 1 token unit

        for (let targetToken of [...tokenAddresses.slice(i + 1), bnbAddress]) {
          // Approve first
          await token.approve(setup.swapProxyInstance.address, tokenAmount);

          // Get rate
          const destAmount = await testGetExpectedRate(tokenAmount, [
            tokenAddresses[i],
            targetToken === bnbAddress ? setup.network.wbnb : targetToken,
          ]);

          let minDestAmount = destAmount.mul(97).div(100);

          // Send txn
          await expect(() => {
            setup.swapProxyInstance.swapPancake(
              setup.network.pancake.routers[0],
              tokenAmount,
              minDestAmount,
              [tokenAddresses[i], targetToken],
              setup.user.address,
              platformFee,
              setup.network.supportedWallets[0],
              true,
              {
                from: setup.user.address,
              }
            );
          }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(tokenAmount));

          // Extra value not needed
          await expect(
            setup.swapProxyInstance.swapPancake(
              setup.network.pancake.routers[0],
              tokenAmount,
              minDestAmount,
              [tokenAddresses[i], targetToken],
              setup.user.address,
              platformFee,
              setup.network.supportedWallets[0],
              true,
              {
                from: setup.user.address,
                value: BigNumber.from(1),
              }
            )
          ).to.be.revertedWith('bad msg value');
        }
      }
    });
  });
});
