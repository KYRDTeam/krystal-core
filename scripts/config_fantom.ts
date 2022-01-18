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

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 3,
  },
};
