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
      cTokens: [],
    },
    supportedWallets: commonPlatformWallets,
  },
};
