import {commonNftConfig, commonPlatformWallets, IConfig} from './config_utils';

export const BscConfig: Record<string, IConfig> = {
  bsc_mainnet: {
    autoVerifyContract: true,
    tokens: [
      {symbol: 'busd', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56'},
      {symbol: 'dai', address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3'},
    ],
    wNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',

    // Pancake swap
    uniswap: {
      routers: [
        '0x10ed43c718714eb63d5aa57b78b54704e256024e', // panceke v2
        '0x05ff2b0db69458a0750badebc4f9e13add608c7f', // pancake v1
        '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // sushiswap
        '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7', // apeswap
      ],
    },

    kyberDmm: {
      router: '0x78df70615ffc8066cc0887917f2Cd72092C86409',
    },

    // Venus protocol
    compound: {
      compTroller: '0xfd36e2c2a6789db23113685031d7f16329158384',
      // cBNB or cETH
      cNative: '0xA07c5b74C9B40447a954e1466938b865b6BBea36',
      // https://api.venus.io/api/vToken
      // empty array for the full market data
      cTokens: [],
    },

    supportedWallets: commonPlatformWallets,
    fundedAmount: 10, // swap 10 bnb each for every token

    nft: {
      ...commonNftConfig,
      uri: 'https://api.krystal.app/bsc/nft/',
      name: 'Krystal Collectibles',
    },

    proxyAdminMultisig: '0xD84f47F60F518C37a07FC7371aC1438F989aE7dc',
  },

  bsc_testnet: {
    autoVerifyContract: true,

    tokens: [{symbol: 'busd', address: '0x8301f2213c0eed49a7e28ae4c3e91722919b8b47'}],

    wNative: '0x094616f0bdfb0b526bd735bf66eca0ad254ca81f',

    // Pancake swap
    uniswap: {
      routers: ['0xD99D1c33F9fC3444f8101754aBC46c52416550D1'],
    },

    kyberDmm: {
      router: '0x19395624C030A11f58e820C3AeFb1f5960d9742a',
    },

    // Compound
    compound: {
      compTroller: '0x94d1820b2D1c7c7452A163983Dc888CEC546b77D',
      cNative: '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c',
      // empty array for the full market data
      cTokens: [],
    },
    supportedWallets: commonPlatformWallets,

    nft: {
      ...commonNftConfig,
      uri: 'https://staging-krystal-api.knstats.com/bsc/nft/',
      name: 'Krystal Collectibles Test',
    },

    // This is the mainnet one as gnosis doesnt support bsc-testnet, but it doesnt matter on testnet anw
    proxyAdminMultisig: '0xD84f47F60F518C37a07FC7371aC1438F989aE7dc',
  },
};
