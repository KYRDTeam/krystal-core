import {commonPlatformWallets, IConfig} from './config_utils';

export const PolygonConfig: Record<string, IConfig> = {
  polygon_mainnet: {
    autoVerifyContract: true,

    tokens: [
      {symbol: 'quick', address: '0x831753dd7087cac61ab5644b308642cc1c33dc13'},
      {symbol: 'dai', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'},
      {symbol: 'weth', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'},
    ],

    wNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',

    // Uniswap & clones
    uniswap: {
      routers: [
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
    supportedWallets: commonPlatformWallets,
  },
};
