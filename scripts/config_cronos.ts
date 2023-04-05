import {commonPlatformWallets, IConfig} from './config_utils';

export const CronosConfig: Record<string, IConfig> = {
  cronos_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',

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

    // VVSFinance
    uniswap: {
      routers: {
        vvsfinance: {
          address: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
        },
      },
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
};
