import {commonPlatformWallets, IConfig} from './config_utils';

export const EthConfig: Record<string, IConfig> = {
  eth_mainnet: {
    autoVerifyContract: true,

    tokens: [
      {symbol: 'dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f'},
      {symbol: 'usdc', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'},
      {symbol: 'usdt', address: '0xdac17f958d2ee523a2206206994597c13d831ec7'},
    ],

    wNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',

    // Uniswap & clones
    uniswap: {
      routers: [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // univ2 router2
        '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // sushiswap
      ],
    },

    uniswapV3: {
      routers: [
        '0xe592427a0aece92de3edee1f18e0157c05861564', // univ3
      ],
    },

    kyberProxy: {
      proxy: '0x9aab3f75489902f3a48495025729a0af77d4b11e',
    },

    kyberDmm: {
      router: '0x1c87257f5e8609940bc751a07bb085bb7f8cdbe6',
    },

    // Compound
    compound: {
      compTroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
      cNative: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
      // empty array for the full market data
      cTokens: [
        '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e', // cBAT
        '0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4', // cCOMP
        '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
        '0x158079ee67fce2f58472a96584a73c7ab9ac95c1', // cREP
        '0xf5dce57282a584d2746faf1593d3121fcac444dc', // cSAI
        '0x35a18000230da775cac24873d00ff85bccded550', // cUNI
        '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
        '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9', // cUSDT
        '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4', // cWBTC
        '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407', // cZRX
      ],
    },

    aaveV1: {
      poolV1: '0x398ec7346dcd622edc5ae82352f02be94c62d119',
      poolCoreV1: '0x3dfd23a6c5e8bbcfc9581d2e864a68feb6a076d3',
      referralCode: 157,
      tokens: [
        '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // aave
        '0xba100000625a3754423978a60c9317c58a424e3d', // bal
        '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // bat
        '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // busd
        '0xD533a949740bb3306d119CC777fa900bA034cd52', // crv
        '0x6b175474e89094c44da98b954eedeac495271d0f', // dai
        '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c', // enj
        '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // gusd
        '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', // knc
        '0x514910771af9ca656af840dff83e8264ecf986ca', // link
        '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', // mana
        '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // mkr
        '0x408e41876cCCDC0F92210600ef50372656052a38', // ren
        '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // snx
        '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', // susd
        '0x0000000000085d4780B73119b644AE5ecd22b376', // tusd
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // uni
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // usdc
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // usdt
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // wbtc
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // weth
        '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', // yfi
        '0xE41d2489571d322189246DaFA5ebDe1F4699F498', // zrx
      ],
    },

    aaveV2: {
      poolV2: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
      provider: '0x057835ad21a177dbdd3090bb1cae03eacf78fc6d',
      weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      referralCode: 157,
      tokens: [
        '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // aave
        '0xba100000625a3754423978a60c9317c58a424e3d', // bal
        '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // bat
        '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // busd
        '0xD533a949740bb3306d119CC777fa900bA034cd52', // crv
        '0x6b175474e89094c44da98b954eedeac495271d0f', // dai
        '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c', // enj
        '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // gusd
        '0xdd974d5c2e2928dea5f71b9825b8b646686bd200', // knc
        '0x514910771af9ca656af840dff83e8264ecf986ca', // link
        '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', // mana
        '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // mkr
        '0x408e41876cCCDC0F92210600ef50372656052a38', // ren
        '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // snx
        '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51', // susd
        '0x0000000000085d4780B73119b644AE5ecd22b376', // tusd
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // uni
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // usdc
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // usdt
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // wbtc
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // weth
        '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', // yfi
        '0xE41d2489571d322189246DaFA5ebDe1F4699F498', // zrx
      ],
    },

    supportedWallets: commonPlatformWallets,
    fundedAmount: 5, // swap 5 eth each for every totken
  },
};
