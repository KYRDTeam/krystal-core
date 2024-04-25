import {commonPlatformWallets, IConfig} from './config_utils';

export const KlaytnConfig: Record<string, IConfig> = {
  klaytn_mainnet: {
    disabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0xe4f05A66Ec68B54A58B17c22107b02e0232cC817',

    uniswap: {
      routers: {
        claimswap: {
          address: '0xEf71750C100f7918d6Ded239Ff1CF09E81dEA92D',
        },
      },
      customSelectors: {
        // claimswap
        '0xEf71750C100f7918d6Ded239Ff1CF09E81dEA92D': {
          swapFromEth: 'swapExactKLAYForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)',
          swapToEth: 'swapExactTokensForKLAYSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
        },
      },
    },
    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
  klaytn_testnet: {
    disabledFetchAaveDataWrapper: true,
    autoVerifyContract: true,

    tokens: {},

    wNative: '0x9330dd6713c8328a8d82b14e3f60a0f0b4cc7bfb',

    uniswap: {
      routers: {
        claimswap: {
          address: '0xB1C4C22FeE13DA89E8D983227d9dc6314E29894a',
        },
      },
      customSelectors: {
        // claimswap
        '0xB1C4C22FeE13DA89E8D983227d9dc6314E29894a': {
          swapFromEth: 'swapExactKLAYForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)',
          swapToEth: 'swapExactTokensForKLAYSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
        },
      },
    },
    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 1,
  },
};
