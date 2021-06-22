import {commonPlatformWallets, IConfig} from './config_utils';

export const PolygonConfig: Record<string, IConfig> = {
  polygon_mainnet: {
    autoVerifyContract: true,

    tokens: [
      // {symbol: 'quick', address: '0x831753dd7087cac61ab5644b308642cc1c33dc13'},
      // {symbol: 'uni', address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f'},'
      // {symbol: 'aave', address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b'},
      // {symbol: 'weth', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'},
      {symbol: 'dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'},
      {symbol: 'usdc', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'},
    ],

    wNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',

    // Uniswap & clones
    uniswap: {
      routers: [
        '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // sushiswap
        '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // quickswap
      ],
    },

    // Compound
    // compound: {
    //   compTroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    //   cNative: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
    //   // empty array for the full market data
    //   cTokens: [],
    // },

    aaveV2: {
      poolV2: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf',
      provider: '0x7551b5D2763519d4e37e8B81929D336De671d46d',
      weth: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // wmatic
      referralCode: 157,
      // empty array for the full market data
      tokens: [
        '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', // aave
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // dai
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // usdc
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // usdt
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // wbtc
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // weth
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // wmatic
      ],
    },

    supportedWallets: commonPlatformWallets,
    fundedAmount: 10000, // swap some matic each for every token
  },

  polygon_mumbai: {
    autoVerifyContract: true,

    tokens: [
      // {symbol: 'quick', address: '0x831753dd7087cac61ab5644b308642cc1c33dc13'},
      // {symbol: 'uni', address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f'},'
      // {symbol: 'aave', address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b'},
      // {symbol: 'weth', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'},
      {symbol: 'dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'},
      {symbol: 'usdc', address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'},
    ],

    wNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',

    // Uniswap & clones
    uniswap: {
      routers: [
        '0xFCB5348111665Cf95a777f0c4FCA768E05601760', // quickswap
      ],
    },

    // Compound
    // compound: {
    //   compTroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
    //   cNative: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
    //   // empty array for the full market data
    //   cTokens: [],
    // },

    aaveV2: {
      poolV2: '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf',
      provider: '0x7551b5D2763519d4e37e8B81929D336De671d46d',
      weth: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // wmatic
      referralCode: 157,
      // empty array for the full market data
      tokens: [
        '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', // aave
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // dai
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // usdc
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // usdt
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // wbtc
        '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // weth
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // wmatic
      ],
    },

    supportedWallets: commonPlatformWallets,
    fundedAmount: 10000, // swap some matic each for every token
  },
};
