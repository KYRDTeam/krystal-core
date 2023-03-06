import {commonPlatformWallets, IConfig} from './config_utils';

export const AuroraConfig: Record<string, IConfig> = {
  aurora_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',

    kyberSwapV2: {
      router: '0xdf1a1b60f2d438842916c0adc43748768353ec25',
      aggregationExecutor: '0xd12bcdfb9a39be79da3bdf02557efdcd5ca59e77',
    },

    kyberSwapV3: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
  aurora_testnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0x219bF573A543B8246BdA9c2606AFCB6BcbAcC7da',
    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
};
