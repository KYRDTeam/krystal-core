import {commonPlatformWallets, IConfig} from './config_utils';

export const FantomConfig: Record<string, IConfig> = {
  fantom_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    uniswap: {
      routers: {
        spookyswap: {
          address: '0xF491e7B69E4244ad4002BC14e878a34207E38c29',
          testingTokens: ['usdc', 'dai', 'fusdt', 'boo'],
        },
      },
    },

    tokens: {
      usdc: {symbol: 'usdc', address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75', usdRate: 1},
      dai: {symbol: 'dai', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', usdRate: 1},
      fusdt: {symbol: 'fusdt', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', usdRate: 1},
      boo: {symbol: 'boo', address: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe', usdRate: 2},
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

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 3,
  },
};
