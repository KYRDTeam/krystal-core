import {nativeTokenDecimals, BPS, evm_revert, FeeMode, nativeTokenAddress, zeroAddress} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IERC20Ext, ILending, IUniswapV2Router02, ICompErc20, IComptroller} from '../typechain';
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
    getActualRate: (sourceAmount: BigNumber, tradePath: string[]) => Promise<BigNumber>,
    borrowFunc: (token: string, amount: BigNumber) => Promise<any>
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
    for (let {address, symbol} of networkSetting.tokens) {
      describe(`testing lending funtionalities on ${name} with ${symbol} token and router ${router}`, async () => {
        beforeEach(async () => {
          await evm_revert(setup.postSetupSnapshotId);
        });

        it('swap and deposit', async () => {
          let swapContract = await getSwapContract();
          let lendingContract = await getLendingContract();
          const lendingContractInstance = (await ethers.getContractAt('ILending', lendingContract)) as ILending;
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
        });

        it('withdraw', async () => {
          let lendingContract = await getLendingContract();
          const lendingContractInstance = (await ethers.getContractAt('ILending', lendingContract)) as ILending;

          let token = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
          let tokenAmount = BigNumber.from(10)
            .pow(await token.decimals())
            .mul(10); // 10 token unit
          let lendingTokenAddress = await lendingContractInstance.getLendingToken(address);
          let lendingToken = (await ethers.getContractAt('IERC20Ext', lendingTokenAddress)) as IERC20Ext;

          // Deposit first
          await token.approve(setup.proxyInstance.address, tokenAmount);
          let beforeCToken = await lendingToken.balanceOf(setup.user.address);
          await expect(() => {
            setup.proxyInstance.swapAndDeposit(
              zeroAddress, // swap contract not needed
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
          let cTokenAmount = afterCToken.sub(beforeCToken);
          assert(
            afterCToken.gt(beforeCToken),
            `user should receive some cToken for directly deposit: after ${afterCToken} vs before ${beforeCToken}`
          );

          // withdraw
          await lendingToken.approve(setup.proxyInstance.address, cTokenAmount);
          let beforeUnderlyingToken = await token.balanceOf(setup.user.address);
          // Assume a maximum of 10 BPS withdraw fee
          let expectedReturned = tokenAmount.mul(BPS.sub(10)).div(BPS);
          await expect(() => {
            setup.proxyInstance.withdrawFromLendingPlatform(
              lendingContract,
              token.address,
              cTokenAmount,
              expectedReturned
            );
          }).to.changeTokenBalance(lendingToken, setup.user, BigNumber.from(0).sub(cTokenAmount));
          let afterUnderlyingToken = await token.balanceOf(setup.user.address);
          assert(
            afterUnderlyingToken.sub(beforeUnderlyingToken).gte(expectedReturned),
            `user should take back at least the token given. deposited ${tokenAmount.toString()}, expected return ${expectedReturned.toString()}, take back ${afterUnderlyingToken
              .sub(beforeUnderlyingToken)
              .toString()}`
          );
        });

        it('swap and repay', async () => {
          let lendingContract = await getLendingContract();
          const lendingContractInstance = (await ethers.getContractAt('ILending', lendingContract)) as ILending;

          let token = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
          let tokenUnit = BigNumber.from(10).pow(await token.decimals()); // 1 token unit
          let lendingTokenAddress = await lendingContractInstance.getLendingToken(token.address);

          // Deposit first to get some cToken
          let depositAmount = tokenUnit.mul(10);
          await token.approve(setup.proxyInstance.address, tokenUnit.mul(10));
          await expect(() => {
            setup.proxyInstance.swapAndDeposit(
              zeroAddress, // swap contract not needed
              lendingContract,
              depositAmount,
              depositAmount,
              [token.address],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: 0,
              }
            );
          }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(depositAmount));

          let borrowAmount = tokenUnit.mul(1);
          let beforeAmt = await token.balanceOf(setup.user.address);
          await borrowFunc(lendingTokenAddress, borrowAmount);
          let afterAmt = await token.balanceOf(setup.user.address);
          assert(
            afterAmt.sub(beforeAmt).eq(borrowAmount),
            `failed borrow, borrow ${borrowAmount.toString()} before ${beforeAmt.toString()} after ${afterAmt.toString()}`
          );

          // Repay 1 unit directly
          let payAmount = tokenUnit.mul(1);
          await token.approve(setup.proxyInstance.address, payAmount);
          await expect(() => {
            setup.proxyInstance.swapAndRepay(
              zeroAddress,
              lendingContract,
              payAmount,
              payAmount,
              [token.address],
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc()
            );
          }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(payAmount));
        });
      });
    }
  }

  before(async () => {
    setup = await getInitialSetup();
  });

  // Need at least 1 test to be recognized as the test suite
  it('lending test should be initialized', async () => {});

  if (networkSetting.uniswap && networkSetting.compound) {
    // Testing uni router v2 only to save time
    for (let router of [networkSetting.uniswap.routers[1]]) {
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
        () => hexlify(arrayify(router)),
        platformFee,
        // generate extraArgs
        async (sourceAmount: BigNumber, tradePath: string[]) => {
          const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
          return amounts[amounts.length - 1];
        },
        // borrow func
        async (token: string, amount: BigNumber) => {
          let tokenContract = (await ethers.getContractAt('ICompErc20', token)) as ICompErc20;
          let comptrollerContract = (await ethers.getContractAt(
            'IComptroller',
            networkSetting.compound!.compTroller
          )) as IComptroller;
          await comptrollerContract.enterMarkets([token]);
          await tokenContract.borrow(amount);
        }
      );
    }
  }
});
