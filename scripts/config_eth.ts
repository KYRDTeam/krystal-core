import {commonPlatformWallets, IConfig} from './config_utils';

export const EthConfig: Record<string, IConfig> = {
  eth_mainnet: {
    autoVerifyContract: true,

    tokens: [
      {symbol: 'kncv2', address: '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'},
      {symbol: 'dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f'},
      {symbol: 'link', address: '0x514910771af9ca656af840dff83e8264ecf986ca'},
      {symbol: 'usdt', address: '0xdac17f958d2ee523a2206206994597c13d831ec7'},
    ],

    wNative: '',

    // Uniswap & clones
    uniswap: {
      routers: [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // univ2 router2
        '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // sushiswap
      ],
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
