import {commonPlatformWallets, IConfig} from './config_utils';

export const AvalancheConfig: Record<string, IConfig> = {
  avalanche_mainnet: {
    autoVerifyContract: true,
    tokens: {
      usdt: {symbol: 'usdt', address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', usdRate: 1},
      dai: {symbol: 'dai', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', usdRate: 1},
      weth: {symbol: 'weth', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', usdRate: 3400},
    },
    wNative: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',

    // uniswap v2 clones
    uniswap: {
      routers: {
        pangolin: {
          address: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
        },
      },
      customSelectors: {
        // pangolin
        '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106': {
          swapFromEth: 'swapExactAVAXForTokensSupportingFeeOnTransferTokens(uint256,address[],address,uint256)',
          swapToEth: 'swapExactTokensForAVAXSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)',
        },
      },
    },

    kyberDmm: {
      router: '0x8Efa5A9AD6D594Cf76830267077B78cE0Bc5A5F8',
      testingTokens: ['weth'],
    },

    kyberDmmV2: {
      router: '0x1Fc3607fa67B58DedDB0fAf7a116F417a20C551c',
      aggregationExecutor: '0x276e31882AD6C784858CdE5770B21eE09d79b744',
      testingTokens: ['knc'],
    },

    kyberSwapV2: {
      router: '0xdf1a1b60f2d438842916c0adc43748768353ec25',
      aggregationExecutor: '0xd12bcdfb9a39be79da3bdf02557efdcd5ca59e77',
      testingTokens: ['knc'],
    },

    kyberSwapV3: {
      router: '0x617Dee16B86534a5d792A4d7A62FB491B544111E',
    },

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 70,

    diabledFetchAaveDataWrapper: true,
  },

  avalanche_fuji: {
    autoVerifyContract: true,
    tokens: {
      busd: {symbol: 'busd', address: '0xD3cF37889Dc026216A9cde1E8d7796caceCc35CD', usdRate: 1},
      dai: {symbol: 'dai', address: '0xFe34D80f720386327c7754f85225D7aA18E8dCFF', usdRate: 1},
    },
    wNative: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',

    supportedWallets: commonPlatformWallets,
    nativeUsdRate: 70,

    diabledFetchAaveDataWrapper: true,
  },
};
