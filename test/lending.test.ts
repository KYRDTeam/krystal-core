import {nativeTokenDecimals, BPS, evm_revert, FeeMode, nativeTokenAddress} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IERC20Ext, ILending, IUniswapV2Router02} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexlify, zeroPad} from 'ethers/lib/utils';

describe('lending test', async () => {
  let platformFee = 8;
  let setup: IInitialSetup;

  function executeLendingTest(
    name: string,
    getSwapContract: () => Promise<string>,
    getLendingContract: () => Promise<string>,
    router: string,
    generateArgsFunc: () => string,
    platformFee: number,
    getActualRate: (sourceAmount: BigNumber, tradePath: string[]) => Promise<BigNumber>
  ) {
    const testGetExpectedRate = async (
      swapContract: string,
      srcAmount: BigNumber,
      tradePath: string[],
      feeMode: FeeMode
    ): Promise<BigNumber> => {
      const data = await setup.proxyInstance.getExpectedReturn(
        swapContract,
        srcAmount,
        tradePath,
        BPS.mul(feeMode).add(platformFee),
        generateArgsFunc()
      );
      assert(!data.destAmount.isZero(), 'non-zero destAmount');
      assert(!data.expectedRate.isZero(), 'non-zero expectedRate');

      if (feeMode === FeeMode.BY_PROTOCOL) {
        const actualDest = await getActualRate(srcAmount, tradePath);
        assert(actualDest.eq(data.destAmount), `expected: ${actualDest}, received: ${data.destAmount}`);
      } else if (feeMode == FeeMode.FROM_SOURCE) {
        const actualDest = await getActualRate(srcAmount.mul(BPS.sub(platformFee)).div(BPS), tradePath);
        assert(actualDest.eq(data.destAmount), `expected: ${actualDest}, received: ${data.destAmount}`);
      } else if (feeMode == FeeMode.FROM_DEST) {
        const actualDest = (await getActualRate(srcAmount, tradePath)).mul(BPS.sub(platformFee)).div(BPS);
        assert(actualDest.eq(data.destAmount), `expected: ${actualDest}, received: ${data.destAmount}`);
      }

      return data.destAmount;
    };

    describe(`testing swap and deposit on ${name} with router ${router}`, async () => {
      it('swap and deposit', async () => {
        let swapContract = await getSwapContract();
        let lendingContract = await getLendingContract();
        const lendingContractInstance = (await ethers.getContractAt('ILending', lendingContract)) as ILending;

        for (let {address} of setup.network.tokens) {
          let token = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
          let tokenAmount = BigNumber.from(10)
            .pow(await token.decimals())
            .mul(10); // 10 token unit
          let nativeAmount = BigNumber.from(10).pow(BigNumber.from(nativeTokenDecimals)); // one native token .i.e eth/bnb

          let lendingTokenAddress = await lendingContractInstance.getLendingToken(address);
          let lendingToken = (await ethers.getContractAt('IERC20Ext', lendingTokenAddress)) as IERC20Ext;

          // approve first
          await token.approve(setup.proxyInstance.address, tokenAmount);

          const destAmount = await testGetExpectedRate(
            swapContract,
            nativeAmount,
            [setup.network.wNative, token.address],
            FeeMode.FROM_SOURCE
          );

          let minDestAmount = destAmount.mul(97).div(100);

          // Empty tradePath
          await expect(
            setup.proxyInstance.swapAndDeposit(
              swapContract,
              lendingContract,
              nativeAmount,
              minDestAmount,
              [],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: nativeAmount,
              }
            )
          ).to.be.revertedWith('invalid tradePath');

          // wrong msg value
          await expect(
            setup.proxyInstance.swapAndDeposit(
              swapContract,
              lendingContract,
              nativeAmount,
              minDestAmount,
              [nativeTokenAddress, token.address],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: 0,
              }
            )
          ).to.be.revertedWith('wrong msg value');

          // Case deposit directly
          let beforeCToken = await lendingToken.balanceOf(setup.user.address);
          await expect(() => {
            setup.proxyInstance.swapAndDeposit(
              swapContract,
              lendingContract,
              tokenAmount,
              tokenAmount,
              [token.address],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: 0,
              }
            );
          }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(tokenAmount));
          let afterCToken = await lendingToken.balanceOf(setup.user.address);
          assert(
            afterCToken.gt(beforeCToken),
            `user should receive some cToken for directly swap: after ${afterCToken} vs before ${beforeCToken}`
          );

          // Case swapping then deposit
          beforeCToken = await lendingToken.balanceOf(setup.user.address);
          await expect(
            await setup.proxyInstance.swapAndDeposit(
              swapContract,
              lendingContract,
              nativeAmount,
              minDestAmount,
              [nativeTokenAddress, token.address],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: nativeAmount,
              }
            )
          ).to.changeEtherBalance(setup.user, BigNumber.from(0).sub(nativeAmount));
          afterCToken = await lendingToken.balanceOf(setup.user.address);
          assert(
            afterCToken.gt(beforeCToken),
            `user should receive some cToken for swapAndDeposit: after ${afterCToken} vs before ${beforeCToken}`
          );
        }
      });
    });
  }

  before(async () => {
    setup = await getInitialSetup();
  });

  beforeEach(async () => {
    await evm_revert(setup.postSetupSnapshotId);
  });

  // Need at least 1 test to be recognized as the test suite
  it('lending test should be initialized', async () => {});

  describe('should swap and do lending on univ2/clones and compound', async () => {
    if (networkSetting.uniswap && networkSetting.compound) {
      for (let router of networkSetting.uniswap.routers) {
        const routerContract = (await ethers.getContractAt('IUniswapV2Router02', router)) as IUniswapV2Router02;

        executeLendingTest(
          'univ2/clones + compound',
          async () => {
            return setup.krystalContracts.swapContracts.uniSwap!.address;
          },
          async () => {
            return setup.krystalContracts.lendingContracts.compoundLending!.address;
          },
          router,
          () => hexlify(zeroPad(arrayify(router), 32)),
          platformFee,
          async (sourceAmount: BigNumber, tradePath: string[]) => {
            const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
            return amounts[amounts.length - 1];
          }
        );
      }
    }
  });
});
