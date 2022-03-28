import {commonPlatformWallets, IConfig} from './config_utils';

export const AuroraConfig: Record<string, IConfig> = {
  aurora_mainnet: {
    diabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',
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
