import {commonPlatformWallets, IConfig} from './config_utils';

export const BlastConfig: Record<string, IConfig> = {
  blast_mainnet: {
    autoVerifyContract: true,
    tokens: {},
    //remember to check if this compatible w/ weth that dex used
    wNative: '0x4300000000000000000000000000000000000004',

    uniswap: {
      routers: {
        thrusterV21: {
          address: '0x98994a9A7a2570367554589189dC9772241650f6',
        },
        thrusterV22: {
          address: '0x44889b52b71E60De6ed7dE82E2939fcc52fB2B4E',
        },
      },
    },

    uniswapV3: {
      routers: [
        '0x337827814155ECBf24D20231fCA4444F530C0555', // univ3
      ],
      // testingTokens: ['dai', 'usdt', 'usdc'],
    },

    kyberSwapV3: {
      router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    },

    okx: {
      router: '0x2E86f54943faFD2cB62958c3deed36C879e3E944',
      okxTokenApprove: '0x5fD2Dc91FF1dE7FF4AEB1CACeF8E9911bAAECa68',
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 3128,

    disabledFetchAaveDataWrapper: true,
  },
};
