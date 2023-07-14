import {commonPlatformWallets, IConfig} from './config_utils';

export const LineaConfig: Record<string, IConfig> = {
  linea_goerli: {
    autoVerifyContract: true,
    tokens: {},
    //remember to check if this compatible w/ weth that dex used
    wNative: '0x62c70f9379ac0470da3149d0e1c90d07f313e3dc',

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
