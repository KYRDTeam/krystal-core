import {nativeTokenAddress, nativeTokenDecimals, BPS, evm_revert, FeeMode, EPS} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IERC20Ext, IUniswapV2Router02} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexlify, zeroPad} from 'ethers/lib/utils';

describe('swap test', async () => {
  // await getInitialSetup("4");
  let platformFee = 8;
  let setup: IInitialSetup;

  function executeSwapTest(
    name: string,
    getSwapContract: () => Promise<string>,
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

    describe(`testing swap contract ${name} with router ${router}`, async () => {
      it('get expected rate correctly', async () => {
        let swapContract = await getSwapContract();
        let nativeAmount = BigNumber.from(10).pow(BigNumber.from(nativeTokenDecimals)); // one bnb
        for (let {address} of setup.network.tokens) {
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.BY_PROTOCOL);
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_DEST);
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_SOURCE);
        }
      });

      it('swap from native to token', async () => {
        let swapContract = await getSwapContract();
        let nativeAmount = BigNumber.from(10).pow(BigNumber.from(nativeTokenDecimals)); // one native token .i.e eth/bnb

        for (let {address} of setup.network.tokens) {
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb

          // Get rate
          const destAmount = await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_SOURCE);

          let minDestAmount = destAmount.mul(97).div(100);
          tradePath[0] = nativeTokenAddress; // trade needs to use bnb address

          // Send txn
          await expect(
            await setup.proxyInstance.swap(
              swapContract,
              nativeAmount,
              minDestAmount,
              tradePath,
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: nativeAmount,
              }
            )
          ).to.changeEtherBalance(setup.user, BigNumber.from(0).sub(nativeAmount));

          // Missing value
          await expect(
            setup.proxyInstance.swap(
              swapContract,
              nativeAmount,
              minDestAmount,
              tradePath,
              BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
              setup.network.supportedWallets[0],
              generateArgsFunc(),
              {
                from: setup.user.address,
                value: 0,
              }
            )
          ).to.be.revertedWith('wrong msg value');
        }
      });

      it('swap from token to native/other tokens', async () => {
        let swapContract = await getSwapContract();
        for (let {address} of setup.network.tokens) {
          let token = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
          let tokenAmount = BigNumber.from(10).pow(await token.decimals()); // 1 token unit

          for (let targetToken of [...setup.network.tokens.map((t) => t.address), nativeTokenAddress]) {
            if (address === targetToken) {
              continue;
            }
            // Approve first
            await token.approve(setup.proxyInstance.address, tokenAmount);

            // Get rate
            const destAmount = await testGetExpectedRate(
              swapContract,
              tokenAmount,
              [token.address, targetToken === nativeTokenAddress ? setup.network.wNative : targetToken],
              FeeMode.FROM_SOURCE
            );

            let minDestAmount = destAmount.mul(97).div(100);

            // Send txn
            await expect(() => {
              setup.proxyInstance.swap(
                swapContract,
                tokenAmount,
                minDestAmount,
                [token.address, targetToken],
                BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
                setup.network.supportedWallets[0],
                generateArgsFunc(),
                {
                  from: setup.user.address,
                }
              );
            }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(tokenAmount));

            // Extra value not needed
            await expect(
              setup.proxyInstance.swap(
                swapContract,
                tokenAmount,
                minDestAmount,
                [token.address, targetToken],
                BPS.mul(FeeMode.FROM_SOURCE).add(platformFee),
                setup.network.supportedWallets[0],
                generateArgsFunc(),
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
  }

  before(async () => {
    setup = await getInitialSetup();
  });

  beforeEach(async () => {
    // let setup: IInitialSetup = await getInitialSetup("5");
    await evm_revert(setup.postSetupSnapshotId);
  });

  // Need at least 1 test to be recognized as the test suite
  it('swap test should be initialized', async () => {});

  describe('should swap on univ2/clones', async () => {
    if (networkSetting.uniswap) {
      for (let router of networkSetting.uniswap.routers) {
        const routerContract = (await ethers.getContractAt('IUniswapV2Router02', router)) as IUniswapV2Router02;

        executeSwapTest(
          'univ2/clones',
          async () => {
            return setup.krystalContracts.swapContracts.uniSwap!.address;
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
