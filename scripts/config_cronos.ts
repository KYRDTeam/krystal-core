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

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
};
