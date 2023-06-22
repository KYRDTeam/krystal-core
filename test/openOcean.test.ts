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
import {IERC20Ext} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexConcat, hexlify} from 'ethers/lib/utils';
import axios from 'axios';
import {apiMock} from './api_helper';

describe('swap test', async () => {
  let platformFee = 0;
  let setup: IInitialSetup;

  // 10$ worth of native
  let nativeAmount10 = BigNumber.from(10)
    .pow(BigNumber.from(nativeTokenDecimals))
    .div(networkSetting.nativeUsdRate)
    .mul(10);

  function executeSwapTest({
    name,
    getSwapContract,
    router,
    generateArgsFunc,
    platformFee,
    getActualRate,
    maxDiffAllowed = 0,
    getExpectedInSupported = false,
    testingTokens = [],
    expectedPriceImpactFn,
  }: {
    name: string;
    getSwapContract: () => Promise<string>;
    router: string;
    generateArgsFunc: (tradePath: string[], srcAmount: BigNumber, feeMode: FeeMode) => Promise<string>;
    platformFee: number;
    getActualRate: (sourceAmount: BigNumber, tradePath: string[], feeMode: FeeMode) => Promise<BigNumber>;
    maxDiffAllowed: number;
    getExpectedInSupported: boolean;
    testingTokens: string[];
    expectedPriceImpactFn: ((srcAmount: BigNumber, tradePath: string[]) => Promise<BigNumber>) | null | undefined;
  }) {
    for (let t of testingTokens) {
      let {address, symbol, usdRate} = networkSetting.tokens[t];

      describe(`testing swap funtionalities on ${name} with ${symbol} token and router ${router}`, async () => {
        beforeEach(async () => {
          await evm_revert(setup.postSetupSnapshotId);
          setup.postSetupSnapshotId = await evm_snapshot();
        });

        it(`swap from native to ${name}`, async () => {
          let swapContract = await getSwapContract();
          let tradePath = [nativeTokenAddress, address]; // from native => token
          const destAmount = await getActualRate(nativeAmount10, tradePath, FeeMode.FROM_SOURCE);
          const minDestAmount = destAmount.mul(97).div(100); //  slippage 3%

          tradePath[0] = nativeTokenAddress; // trade needs to use bnb address
          const extraArgs = await generateArgsFunc(tradePath, nativeAmount10, FeeMode.FROM_SOURCE);
          if (extraArgs == '') {
            return;
          }

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
                extraArgs: extraArgs,
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
          let fundAmount = nativeAmount10.mul(100);
          let beforeFunded = await token.balanceOf(setup.user.address);
          let tradePath = [nativeTokenAddress, token.address];
          let extraArgs = await generateArgsFunc(tradePath, fundAmount, FeeMode.FROM_SOURCE);
          if (extraArgs === '') {
            return;
          }
          await setup.proxyInstance.swap(
            {
              swapContract,
              srcAmount: fundAmount,
              minDestAmount: BigNumber.from(1),
              tradePath,
              feeMode: FeeMode.FROM_SOURCE,
              feeBps: platformFee,
              platformWallet: setup.network.supportedWallets[0],
              extraArgs: extraArgs,
            },
            {
              value: fundAmount,
            }
          );
          let afterFunded = await token.balanceOf(setup.user.address);
          console.log(`---- funded ${symbol}`, fromWei(afterFunded.sub(beforeFunded), tokenDec));

          // Let's swap 5$ of token each time
          let tokenAmount = tokenUnit.div(usdRate).mul(5);

          // Only swap to usdt & native token, as they most-likely have the pools
          for (let targetToken of [
            ...testingTokens.map((t) => networkSetting.tokens[t].address),
            nativeTokenAddress,
          ]) {
            if (address === targetToken) {
              continue;
            }

            console.log(`swapping from ${token} -> ${targetToken}`);

            // Approve first
            await token.approve(setup.proxyInstance.address, tokenAmount);
            const tradePath = [token.address, targetToken];

            // Get rate
            const destAmount = await getActualRate(tokenAmount, tradePath, FeeMode.FROM_SOURCE);

            let minDestAmount = destAmount.mul(97).div(100);
            const extraArgs = await generateArgsFunc(tradePath, tokenAmount, FeeMode.FROM_SOURCE);
            if (extraArgs === '') {
              return;
            }

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
                  extraArgs: extraArgs,
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
                  extraArgs: extraArgs,
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

  if (networkSetting.openOcean) {
    executeSwapTest({
      name: 'openOcean',
      getSwapContract: async () => {
        return setup.krystalContracts.swapContracts!.openOcean!.address;
      },
      router: networkSetting.openOcean!.router,
      generateArgsFunc: async (tradePath: string[], srcAmount?: BigNumber, feeMode?: FeeMode) => {
        const chainIdHex = await getChain();
        const chainId = BigNumber.from(chainIdHex).toString();
        let amount = srcAmount;
        if (feeMode === FeeMode.FROM_SOURCE) {
          amount = srcAmount?.mul(BPS.sub(platformFee)).div(BPS);
        }
        const url = `https://ethapi.openocean.finance/v2/${chainId}/swap?account=${
          setup.user.address
        }&amount=${amount?.toString()}&gasPrice=100000000&inTokenAddress=${tradePath[0]}&outTokenAddress=${
          tradePath[1]
        }&referrer=0xf351Dd5EC89e5ac6c9125262853c74E714C1d56a&slippage=20`;

        const resp = (await axios.get(url)) as any;
        const data = resp.data;
        console.log(data);

        return data.data as string;
      },
      platformFee,
      getActualRate: async (srcAmount: BigNumber, tradePath: string[], feeMode: FeeMode) => {
        const chainIdHex = await getChain();
        const chainId = BigNumber.from(chainIdHex).toString();
        let amount = srcAmount;
        if (feeMode === FeeMode.FROM_SOURCE) {
          amount = srcAmount?.mul(BPS.sub(platformFee)).div(BPS);
        }

        const url = `https://ethapi.openocean.finance/v2/${chainId}/swap?account=${
          setup.user.address
        }&amount=${amount?.toString()}&gasPrice=100000000&inTokenAddress=${tradePath[0]}&outTokenAddress=${
          tradePath[1]
        }&referrer=0xf351Dd5EC89e5ac6c9125262853c74E714C1d56a&slippage=20`;

        const resp = (await axios.get(url)) as any;
        const data = resp.data;

        return BigNumber.from(data.outAmount);
      },
      maxDiffAllowed: 0,
      getExpectedInSupported: false,
      testingTokens: networkSetting.openOcean.testingTokens ?? Object.keys(networkSetting.tokens),
      expectedPriceImpactFn: null,
    });
  }
});
