import {commonPlatformWallets, IConfig} from './config_utils';

export const FantomConfig: Record<string, IConfig> = {
  fantom_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {
      dai: {symbol: 'dai', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', usdRate: 1},
      usdc: {symbol: 'usdc', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', usdRate: 1},
      fusdt: {symbol: 'fusdt', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', usdRate: 1},
    },

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
      router: '0x617Dee16B86534a5d792A4d7A62FB491B544111E',
    },

    openOcean: {
      router: '0x6352a56caadC4F1E25CD6c75970Fa768A3304e64',
      testingTokens: ['dai', 'usdc', 'fusdt'],
    },

    okx: {
      router: '0xf332761c673b59B21fF6dfa8adA44d78c12dEF09',
      okxTokenApprove: '0x70cBb871E8f30Fc8Ce23609E9E0Ea87B6b222F58',
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 3,
  },
};
