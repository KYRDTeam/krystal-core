import {commonPlatformWallets, IConfig} from './config_utils';

export const FantomConfig: Record<string, IConfig> = {
  fantom_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',

    kyberDmmV2: {
      router: '0x1Fc3607fa67B58DedDB0fAf7a116F417a20C551c',
      aggregationExecutor: '0x276e31882AD6C784858CdE5770B21eE09d79b744',
    },

    kyberSwapV2: {
      router: '0xdf1a1b60f2d438842916c0adc43748768353ec25',
      aggregationExecutor: '0xd12bcdfb9a39be79da3bdf02557efdcd5ca59e77',
    },

    kyberSwapV3: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    },

    // Spooky swap
    uniswap: {
      routers: {
        spookyswap: {
          address: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
        },
      },
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 3,
  },
};
