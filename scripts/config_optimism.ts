import {commonNftConfig, commonPlatformWallets, IConfig} from './config_utils';

export const OptimismConfig: Record<string, IConfig> = {
  optimism_mainnet: {
    autoVerifyContract: true,

    tokens: {
      usdc: {symbol: 'usdc', address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', usdRate: 1},
    },

    wNative: '0x4200000000000000000000000000000000000006',

    kyberSwapV3: {
      router: '0x617Dee16B86534a5d792A4d7A62FB491B544111E',
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 0.9,
  },
};
