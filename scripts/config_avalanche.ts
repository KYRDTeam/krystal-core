import {commonPlatformWallets, IConfig} from './config_utils';

export const AvalancheConfig: Record<string, IConfig> = {
  avalanche_mainnet: {
    autoVerifyContract: true,
    tokens: [
      {symbol: 'usdt', address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', usdRate: 1},
      {symbol: 'dai', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', usdRate: 1},
    ],
    wNative: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',

    // uniswap v2 clones
    uniswap: {
      routers: [
        '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106', // pangolin
      ],
      customSelectors: {
        // pangolin
        '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106': {
          swapFromEth: 'swapExactAVAXForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)',
          swapToEth: 'swapExactTokensForAVAXSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
        },
      },
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 60,
  },

  avalanche_fuji: {
    autoVerifyContract: true,
    tokens: [
      {symbol: 'busd', address: '0xD3cF37889Dc026216A9cde1E8d7796caceCc35CD', usdRate: 1},
      {symbol: 'dai', address: '0xFe34D80f720386327c7754f85225D7aA18E8dCFF', usdRate: 1},
    ],
    wNative: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 60,
  },
};
