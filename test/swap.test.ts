import {nativeTokenAddress, nativeTokenDecimals, BPS, evm_revert, FeeMode, EPS} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IDMMFactory, IDMMRouter, IERC20Ext, IUniswapV2Router02} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexConcat, hexlify, zeroPad} from 'ethers/lib/utils';

describe('swap test', async () => {
  let platformFee = 8;
  let setup: IInitialSetup;
  let nativeAmount = BigNumber.from(10).pow(BigNumber.from(nativeTokenDecimals)).div(20); // 0.05 native amount .i.e eth/bnb

  function executeSwapTest(
    name: string,
    getSwapContract: () => Promise<string>,
    router: string,
    generateArgsFunc: (tradePath: string[]) => Promise<string>,
    platformFee: number,
    getActualRate: (sourceAmount: BigNumber, tradePath: string[]) => Promise<BigNumber>,
    maxDiffAllowed: number = 0
  ) {
    const testGetExpectedRate = async (
      swapContract: string,
      srcAmount: BigNumber,
      tradePath: string[],
      feeMode: FeeMode
    ): Promise<BigNumber> => {
      const data = await setup.proxyInstance.getExpectedReturn({
        swapContract,
        srcAmount,
        tradePath,
        feeMode,
        feeBps: platformFee,
        extraArgs: await generateArgsFunc(tradePath),
      });

      assert(!data.destAmount.isZero(), 'zero destAmount');
      assert(!data.expectedRate.isZero(), 'zero expectedRate');

      if (feeMode === FeeMode.BY_PROTOCOL) {
        const actualDest = await getActualRate(srcAmount, tradePath);
        const diff = data.destAmount.sub(actualDest).abs();
        assert(
          diff.mul(100).lte(actualDest.mul(maxDiffAllowed)),
          `expected: ${actualDest}, received: ${data.destAmount}, srcAmt: ${srcAmount}, maxDiff: ${maxDiffAllowed}`
        );
      } else if (feeMode == FeeMode.FROM_SOURCE) {
        const actualDest = await getActualRate(srcAmount.mul(BPS.sub(platformFee)).div(BPS), tradePath);
        const diff = data.destAmount.sub(actualDest).abs();
        assert(
          diff.mul(100).lte(actualDest.mul(maxDiffAllowed)),
          `expected: ${actualDest}, received: ${data.destAmount}, srcAmt: ${srcAmount}, maxDiff: ${maxDiffAllowed}`
        );
      } else if (feeMode == FeeMode.FROM_DEST) {
        const actualDest = (await getActualRate(srcAmount, tradePath)).mul(BPS.sub(platformFee)).div(BPS);
        const diff = data.destAmount.sub(actualDest).abs();
        assert(
          diff.mul(100).lte(actualDest.mul(maxDiffAllowed)),
          `expected: ${actualDest}, received: ${data.destAmount}, srcAmt: ${srcAmount}, maxDiff: ${maxDiffAllowed}`
        );
      }

      return data.destAmount;
    };

    for (let {address, symbol} of networkSetting.tokens) {
      describe(`testing swap funtionalities on ${name} with ${symbol} token and router ${router}`, async () => {
        beforeEach(async () => {
          await evm_revert(setup.postSetupSnapshotId);
        });

        it('get expected rate correctly', async () => {
          let swapContract = await getSwapContract();
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.BY_PROTOCOL);
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_DEST);
          await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_SOURCE);
        });

        it('swap from native to token', async () => {
          let swapContract = await getSwapContract();
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb

          // Get rate
          const destAmount = await testGetExpectedRate(swapContract, nativeAmount, tradePath, FeeMode.FROM_SOURCE);

          let minDestAmount = destAmount.mul(97).div(100);
          tradePath[0] = nativeTokenAddress; // trade needs to use bnb address

          // Send txn
          await expect(
            await setup.proxyInstance.swap(
              {
                swapContract,
                srcAmount: nativeAmount,
                minDestAmount,
                tradePath,
                feeMode: FeeMode.FROM_SOURCE,
                feeBps: platformFee,
                platformWallet: setup.network.supportedWallets[0],
                extraArgs: await generateArgsFunc(tradePath),
              },
              {
                from: setup.user.address,
                value: nativeAmount,
              }
            )
          ).to.changeEtherBalance(setup.user, BigNumber.from(0).sub(nativeAmount));

          // Missing value
          await expect(
            setup.proxyInstance.swap(
              {
                swapContract,
                srcAmount: nativeAmount,
                minDestAmount,
                tradePath,
                feeMode: FeeMode.FROM_SOURCE,
                feeBps: platformFee,
                platformWallet: setup.network.supportedWallets[0],
                extraArgs: await generateArgsFunc(tradePath),
              },
              {
                from: setup.user.address,
                value: 0,
              }
            )
          ).to.be.revertedWith('wrong msg value');
        });

        it('swap from token to native/other tokens', async () => {
          let swapContract = await getSwapContract();
          let token = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
          let tokenAmount = BigNumber.from(10).pow(await token.decimals()); // 1 token unit

          // Only swap to usdt & native token, as they most-likely have the pools
          for (let targetToken of [...setup.network.tokens.map((t) => t.address), nativeTokenAddress]) {
            if (address === targetToken) {
              continue;
            }
            // console.log(`testing ${token.address} -> ${targetToken}`);

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
            await expect(async () => {
              setup.proxyInstance.swap(
                {
                  swapContract,
                  srcAmount: tokenAmount,
                  minDestAmount,
                  tradePath: [token.address, targetToken],
                  feeMode: FeeMode.FROM_SOURCE,
                  feeBps: platformFee,
                  platformWallet: setup.network.supportedWallets[0],
                  extraArgs: await generateArgsFunc([token.address, targetToken]),
                },
                {
                  from: setup.user.address,
                }
              );
            }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(tokenAmount));

            // Extra value not needed
            await expect(
              setup.proxyInstance.swap(
                {
                  swapContract,
                  srcAmount: tokenAmount,
                  minDestAmount,
                  tradePath: [token.address, targetToken],
                  feeMode: FeeMode.FROM_SOURCE,
                  feeBps: platformFee,
                  platformWallet: setup.network.supportedWallets[0],
                  extraArgs: await generateArgsFunc([token.address, targetToken]),
                },
                {
                  from: setup.user.address,
                  value: BigNumber.from(1),
                }
              )
            ).to.be.revertedWith('bad msg value');
          }
        });
      });
    }
  }

  before(async () => {
    setup = await getInitialSetup();
  });

  // Need at least 1 test to be recognized as the test suite
  it('swap test should be initialized', async () => {});

  if (networkSetting.uniswap) {
    for (let router of networkSetting.uniswap.routers) {
      const routerContract = (await ethers.getContractAt('IUniswapV2Router02', router)) as IUniswapV2Router02;

      executeSwapTest(
        'univ2/clones',
        async () => {
          return setup.krystalContracts.swapContracts.uniSwap!.address;
        },
        router,
        async () => hexlify(arrayify(router)),
        platformFee,
        async (sourceAmount: BigNumber, tradePath: string[]) => {
          const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
          return amounts[amounts.length - 1];
        }
      );
    }
  }

  if (networkSetting.uniswapV3) {
    for (let router of networkSetting.uniswapV3.routers) {
      // Using v2 router as a price estimate for testing
      const routerContract = (await ethers.getContractAt(
        'IUniswapV2Router02',
        networkSetting.uniswap!.routers[0]
      )) as IUniswapV2Router02;

      executeSwapTest(
        'uniV3',
        async () => {
          return setup.krystalContracts.swapContracts.uniSwapV3!.address;
        },
        router,
        async () => hexlify(arrayify(router)) + '0001F4', // fee = 3000 bps
        platformFee,
        async (sourceAmount: BigNumber, tradePath: string[]) => {
          const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
          return amounts[amounts.length - 1];
        },
        2
      );
    }
  }

  if (networkSetting.kyberProxy) {
    // Using v2 router as a price estimate for testing
    const routerContract = (await ethers.getContractAt(
      'IUniswapV2Router02',
      networkSetting.uniswap!.routers[0]
    )) as IUniswapV2Router02;

    executeSwapTest(
      'kyberProxy',
      async () => {
        return setup.krystalContracts.swapContracts.kyberProxy!.address;
      },
      networkSetting.kyberProxy.proxy,
      async () => '0x', // empty hint
      platformFee,
      async (sourceAmount: BigNumber, tradePath: string[]) => {
        const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
        return amounts[amounts.length - 1];
      },
      2
    );
  }

  if (networkSetting.kyberDmm) {
    const generatePools = async (dmmRouter: IDMMRouter, tradePath: string[]): Promise<string[]> => {
      const dmmFactoryAddresss = await dmmRouter.factory();
      const dmmFactory = (await ethers.getContractAt('IDMMFactory', dmmFactoryAddresss)) as IDMMFactory;

      const convertedTradePath = tradePath.map((tk) =>
        tk.toLowerCase() === nativeTokenAddress.toLowerCase() ? networkSetting.wNative : tk
      );
      const pools = [];
      for (let i = 0; i < convertedTradePath.length - 1; i += 1) {
        let availablePools = await dmmFactory.getPools(convertedTradePath[i], convertedTradePath[i + 1]);
        if (availablePools.length == 0) {
          console.log(`Pool not exist: ${tradePath[i]} - ${tradePath[i + 1]}`);
          process.exit(1);
        }
        pools.push(availablePools[0]);
      }
      return pools;
    };

    executeSwapTest(
      'kyberProxy',
      async () => {
        return setup.krystalContracts.swapContracts.kyberDmm!.address;
      },
      networkSetting.kyberDmm.router,
      async (tradePath: string[]) => {
        // Generate pools extraArgs for kyberDmm
        const dmmRouter = (await ethers.getContractAt('IDMMRouter', networkSetting.kyberDmm!.router)) as IDMMRouter;
        let pools = await generatePools(dmmRouter, tradePath);
        return hexConcat(pools);
      },
      platformFee,
      async (sourceAmount: BigNumber, tradePath: string[]) => {
        const dmmRouter = (await ethers.getContractAt('IDMMRouter', networkSetting.kyberDmm!.router)) as IDMMRouter;
        let pools = await generatePools(dmmRouter, tradePath);
        const amounts = await dmmRouter.getAmountsOut(sourceAmount, pools, tradePath);
        return amounts[amounts.length - 1];
      },
      0
    );
  }
});
