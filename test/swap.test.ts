import {
  nativeTokenAddress,
  nativeTokenDecimals,
  BPS,
  evm_revert,
  FeeMode,
  evm_snapshot,
  fromWei,
  getChain,
} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IDMMFactory, IDMMRouter, IERC20Ext, IUniswapV2Router02} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexConcat, hexlify} from 'ethers/lib/utils';
import axios from 'axios';

describe('swap test', async () => {
  let platformFee = 8;
  let setup: IInitialSetup;

  // 10$ worth of native amount
  let nativeAmount10 = BigNumber.from(10)
    .pow(BigNumber.from(nativeTokenDecimals))
    .div(networkSetting.nativeUsdRate)
    .mul(10);

  function executeSwapTest(
    name: string,
    getSwapContract: () => Promise<string>,
    router: string,
    generateArgsFunc: (tradePath: string[], srcAmount: BigNumber, feeMode: FeeMode) => Promise<string>,
    platformFee: number,
    getActualRate: (sourceAmount: BigNumber, tradePath: string[]) => Promise<BigNumber>,
    maxDiffAllowed: number = 0,
    getExpectedInSupported: boolean = false
  ) {
    const testGetExpectedRate = async (
      swapContract: string,
      srcAmount: BigNumber,
      tradePath: string[],
      feeMode: FeeMode
    ): Promise<BigNumber> => {
      if (name == '1inch') {
        return BigNumber.from(100);
      }
      const data = await setup.proxyInstance.getExpectedReturn({
        swapContract,
        srcAmount,
        tradePath,
        feeMode,
        feeBps: platformFee,
        extraArgs: await generateArgsFunc(tradePath, srcAmount, feeMode),
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

      if (getExpectedInSupported) {
        // okay, to safe time, let's just test the getExpectedIn using the above data
        const expectedInData = await setup.proxyInstance.getExpectedIn({
          swapContract,
          destAmount: data.destAmount,
          tradePath,
          feeMode,
          feeBps: platformFee,
          extraArgs: await generateArgsFunc(tradePath, srcAmount, feeMode),
        });

        const diff = expectedInData.srcAmount.sub(srcAmount).abs();
        assert(
          // should be less than 1bps diff due to rounding
          diff.mul(BPS).lte(srcAmount.mul(1)),
          `wrong getExpectedIn: originSrc=${srcAmount.toString()}, estimatedDest=${data.destAmount.toString()}, estimatedSource=${expectedInData.srcAmount.toString()}`
        );
      } else {
        expect(
          setup.proxyInstance.getExpectedIn({
            swapContract,
            destAmount: data.destAmount,
            tradePath,
            feeMode,
            feeBps: platformFee,
            extraArgs: await generateArgsFunc(tradePath, srcAmount, feeMode),
          })
        ).to.be.revertedWith('getExpectedIn_notSupported');
      }

      return data.destAmount;
    };

    for (let {address, symbol, usdRate} of networkSetting.tokens) {
      describe(`testing swap funtionalities on ${name} with ${symbol} token and router ${router}`, async () => {
        beforeEach(async () => {
          await evm_revert(setup.postSetupSnapshotId);
          setup.postSetupSnapshotId = await evm_snapshot();
        });

        it('get expected rate correctly', async () => {
          if (name === '1inch') {
            return;
          }
          let swapContract = await getSwapContract();
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb
          await testGetExpectedRate(swapContract, nativeAmount10, tradePath, FeeMode.BY_PROTOCOL);
          await testGetExpectedRate(swapContract, nativeAmount10, tradePath, FeeMode.FROM_DEST);
          await testGetExpectedRate(swapContract, nativeAmount10, tradePath, FeeMode.FROM_SOURCE);
        });

        it('swap from native to token', async () => {
          let swapContract = await getSwapContract();
          let tradePath = [setup.network.wNative, address]; // get rate needs to use wbnb

          const destAmount = await testGetExpectedRate(swapContract, nativeAmount10, tradePath, FeeMode.FROM_SOURCE);
          const minDestAmount = destAmount.mul(97).div(100);

          tradePath[0] = nativeTokenAddress; // trade needs to use bnb address

          // Send txn
          await expect(
            await setup.proxyInstance.swap(
              {
                swapContract,
                srcAmount: nativeAmount10,
                minDestAmount,
                tradePath,
                feeMode: FeeMode.FROM_SOURCE,
                feeBps: platformFee,
                platformWallet: setup.network.supportedWallets[0],
                extraArgs: await generateArgsFunc(tradePath, nativeAmount10, FeeMode.FROM_SOURCE),
              },
              {
                from: setup.user.address,
                value: nativeAmount10,
              }
            )
          ).to.changeEtherBalance(setup.user, BigNumber.from(0).sub(nativeAmount10));

          // Missing value
          await expect(
            setup.proxyInstance.swap(
              {
                swapContract,
                srcAmount: nativeAmount10,
                minDestAmount,
                tradePath,
                feeMode: FeeMode.FROM_SOURCE,
                feeBps: platformFee,
                platformWallet: setup.network.supportedWallets[0],
                extraArgs: await generateArgsFunc(tradePath, nativeAmount10, FeeMode.FROM_SOURCE),
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
          let tokenDec = await token.decimals();
          let tokenUnit = BigNumber.from(10).pow(tokenDec);

          // Get some fund first .i.e 100$ worth of tokens
          let beforeFunded = await token.balanceOf(setup.user.address);
          let tradePath = [nativeTokenAddress, token.address];
          let extraArgs = await generateArgsFunc(tradePath, nativeAmount10.mul(10), FeeMode.FROM_SOURCE);
          setup.proxyInstance.swap(
            {
              swapContract,
              srcAmount: nativeAmount10.mul(10),
              minDestAmount: BigNumber.from(1),
              tradePath,
              feeMode: FeeMode.FROM_SOURCE,
              feeBps: platformFee,
              platformWallet: setup.network.supportedWallets[0],
              extraArgs: extraArgs,
            },
            {
              value: nativeAmount10.mul(10),
            }
          );
          let afterFunded = await token.balanceOf(setup.user.address);
          console.log(`---- funded ${symbol}`, fromWei(afterFunded.sub(beforeFunded), tokenDec));

          // Let's swap 5$ of token each time
          let tokenAmount = tokenUnit.div(usdRate).mul(5);

          // Only swap to usdt & native token, as they most-likely have the pools
          for (let targetToken of [...setup.network.tokens.map((t) => t.address), nativeTokenAddress]) {
            if (address === targetToken) {
              continue;
            }

            console.log(`swapping from ${token.address} -> ${targetToken}`);

            // Approve first
            await token.approve(setup.proxyInstance.address, tokenAmount);

            // Trade to native token to ensure the liquidity pool
            const tradePath =
              // kyberProxy only take direct trade
              !['kyberProxy', '1inch'].includes(name) &&
              token.address != nativeTokenAddress &&
              targetToken != nativeTokenAddress
                ? [token.address, setup.network.wNative, targetToken]
                : [token.address, targetToken];

            // Get rate
            const destAmount = await testGetExpectedRate(
              swapContract,
              tokenAmount,
              tradePath.map((t) => (t === nativeTokenAddress ? setup.network.wNative : t)),
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
                  tradePath: tradePath,
                  feeMode: FeeMode.FROM_SOURCE,
                  feeBps: platformFee,
                  platformWallet: setup.network.supportedWallets[0],
                  extraArgs: await generateArgsFunc(tradePath, tokenAmount, FeeMode.FROM_SOURCE),
                },
                {
                  from: setup.user.address,
                }
              );
            }).to.changeTokenBalance(token, setup.user, BigNumber.from(0).sub(tokenAmount));
            console.log(`swapped from ${token.address} -> ${targetToken}`);

            // Extra value not needed
            await expect(
              setup.proxyInstance.swap(
                {
                  swapContract,
                  srcAmount: tokenAmount,
                  minDestAmount,
                  tradePath: tradePath,
                  feeMode: FeeMode.FROM_SOURCE,
                  feeBps: platformFee,
                  platformWallet: setup.network.supportedWallets[0],
                  extraArgs: await generateArgsFunc(tradePath, tokenAmount, FeeMode.FROM_SOURCE),
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

  /*
  if (networkSetting.uniswap) {
    for (let router of networkSetting.uniswap.routers) {
      const routerContract = (await ethers.getContractAt('IUniswapV2Router02', router)) as IUniswapV2Router02;

      executeSwapTest(
        'univ2/clones',
        async () => {
          return setup.krystalContracts.swapContracts!.uniSwap!.address;
        },
        router,
        async () => hexlify(arrayify(router)),
        platformFee,
        async (sourceAmount: BigNumber, tradePath: string[]) => {
          const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
          return amounts[amounts.length - 1];
        },
        0,
        true
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
          return setup.krystalContracts.swapContracts!.uniSwapV3!.address;
        },
        router,
        async (tradePath: string[]) => {
          let extraArgs = hexlify(arrayify(router));
          for (let i = 0; i < tradePath.length - 1; i++) {
            extraArgs = extraArgs + '0001F4'; // fee = 3000 bps
          }
          return extraArgs;
        },
        platformFee,
        async (sourceAmount: BigNumber, tradePath: string[]) => {
          const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
          return amounts[amounts.length - 1];
        },
        1,
        true
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
        return setup.krystalContracts.swapContracts!.kyberProxy!.address;
      },
      networkSetting.kyberProxy.proxy,
      async () => '0x', // empty hint
      platformFee,
      async (sourceAmount: BigNumber, tradePath: string[]) => {
        const amounts = await routerContract.getAmountsOut(sourceAmount, tradePath);
        return amounts[amounts.length - 1];
      },
      1,
      true
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
      'kyberDmm',
      async () => {
        return setup.krystalContracts.swapContracts!.kyberDmm!.address;
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
      0,
      true
    );
  }
  */

  if (networkSetting.oneInch) {
    executeSwapTest(
      '1inch',
      async () => {
        return setup.krystalContracts.swapContracts!.oneInch!.address;
      },
      networkSetting.oneInch!.router,
      async (tradePath: string[], srcAmount?: BigNumber, feeMode?: FeeMode) => {
        const chainId = await getChain();
        let amount = srcAmount;
        if (feeMode === FeeMode.FROM_SOURCE) {
          amount = srcAmount?.mul(BPS.sub(platformFee)).div(BPS);
        }
        const url = `https://api.1inch.exchange/v3.0/${chainId}/swap?fromTokenAddress=${tradePath[0]}&toTokenAddress=${
          tradePath[1]
        }&amount=${amount?.toString()}&fromAddress=${
          setup.user.address
        }&slippage=10&disableEstimate=true&fee=0&burnChi=false&allowPartialFill=false`;
        const resp = (await axios.get(url)) as any;
        return resp.data.tx.data as string;
      },
      platformFee,
      async (sourceAmount: BigNumber, tradePath: string[]) => {
        return BigNumber.from(0);
      },
      0,
      false
    );
  }
});
