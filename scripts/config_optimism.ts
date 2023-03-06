import {commonNftConfig, commonPlatformWallets, IConfig} from './config_utils';

export const OptimismConfig: Record<string, IConfig> = {
  optimism_mainnet: {
    autoVerifyContract: true,

    tokens: {
      usdc: {symbol: 'usdc', address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', usdRate: 1},
    },

    wNative: '0x4200000000000000000000000000000000000006',

    kyberSwapV3: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    },

    // Forked from UniV2
    uniswap: {
      routers: {
        velodrome: {
          address: '0x9c12939390052919aF3155f41Bf4160Fd3666A6f',
        },
      },
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 0.9,
  },
};
