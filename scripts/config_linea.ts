import {commonPlatformWallets, IConfig} from './config_utils';

export const LineaConfig: Record<string, IConfig> = {
  linea_goerli: {
    autoVerifyContract: true,
    tokens: {},
    wNative: '0x2C1b868d6596a18e32E61B901E4060C872647b6C',

    openOcean: {
      router: '0x6352a56caadc4f1e25cd6c75970fa768a3304e64',
    },

    kyberSwapV3: {
      router: '0xcd9478E0533F6108A036389A4C24E11f191B54D8',
    },

    // Uniswap & clones
    uniswap: {
      routers: {
        univ2: {
          address: '0x0913482dccc4ccf7219897e0976d3a2727f4316c',
        },
      },
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 70,

    diabledFetchAaveDataWrapper: true,
  },
};
