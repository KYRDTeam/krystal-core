import {commonPlatformWallets, IConfig} from './config_utils';

export const KlaytnConfig: Record<string, IConfig> = {
  klaytn_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0xfd844c2fca5e595004b17615f891620d1cb9bbb2',

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
  klaytn_testnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0x9330dd6713c8328a8d82b14e3f60a0f0b4cc7bfb',
    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
};
