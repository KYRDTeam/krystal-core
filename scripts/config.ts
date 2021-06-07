export interface IConfig {
  autoVerifyContract: boolean;

  tokens: Array<{
    symbol: string;
    address: string;
  }>;

  // wrapped native token (wEth/wBnb ..)
  wNative: string;

  // Uniswap or clones
  uniswap?: {
    routers: string[];
  };

  // Compound or clones
  compound?: {
    compTroller: string;
    cNative: string;
    cTokens: string[];
  };

  supportedWallets: string[];
}

const NetworkConfig: Record<string, IConfig> = {
  bsc_testnet: {
    autoVerifyContract: true,

    tokens: [
      {symbol: 'busd', address: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee'},
      {symbol: 'dai', address: '0xec5dcb5dbf4b114c9d0f65bccab49ec54f6a0867'},
      {symbol: 'usdc', address: '0x64544969ed7ebf5f083679233325356ebe738930'},
      {symbol: 'usdt', address: '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd'},
    ],

    wNative: '',

    // Pancake
    uniswap: {
      routers: ['0xD99D1c33F9fC3444f8101754aBC46c52416550D1'],
    },

    // Compound
    compound: {
      compTroller: '0x94d1820b2d1c7c7452a163983dc888cec546b77d',
      cNative: '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c',
      // empty array for the full market data
      cTokens: [
        '0x74469281310195A04840Daf6EdF576F559a3dE80',
        '0xD5C4C2e2facBEB59D0216D0595d63FcDc6F9A1a7',
        '0xb7526572FFE56AB9D7489838Bf2E18e3323b441A',
        '0x08e0A5575De71037aE36AbfAfb516595fE68e5e4',
        '0x6d6F697e34145Bb95c54E77482d97cc261Dc237E',
        '0xb6e9322C49FD75a367Fcb17B0Fcd62C5070EbCBe',
        '0x162D005F0Fff510E54958Cfc5CF32A3180A84aab',
        '0xAfc13BC065ABeE838540823431055D2ea52eBA52',
        '0x488aB2826a154da01CC4CC16A8C83d4720D3cA2C',
        '0x37C28DE42bA3d22217995D146FC684B2326Ede64',
      ],
    },
    supportedWallets: [
      '0xa1738F8DD7c42cd4175CcdCa79Af89b3EC7b68E9', // android
      '0x5250b8202AEBca35328E2c217C687E894d70Cd31', // ios
      '0x168E4c3AC8d89B00958B6bE6400B066f0347DDc9', // web
    ],
  },

  bsc_mainnet: {
    autoVerifyContract: true,
    tokens: [
      {symbol: 'busd', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56'},
      {symbol: 'dai', address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3'},
      {symbol: 'usdc', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'},
      {symbol: 'usdt', address: '0x55d398326f99059ff775485246999027b3197955'},
    ],
    wNative: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',

    uniswap: {
      routers: [
        '0x05ff2b0db69458a0750badebc4f9e13add608c7f', // v1
        '0x10ed43c718714eb63d5aa57b78b54704e256024e', // v2
      ],
    },

    compound: {
      compTroller: '0xfd36e2c2a6789db23113685031d7f16329158384',
      // cBNB or cETH
      cNative: '0xa07c5b74c9b40447a954e1466938b865b6bbea36',
      // https://api.compound.io/api/cToken
      // empty array for the full market data
      cTokens: [],
    },

    supportedWallets: [
      '0xa1738F8DD7c42cd4175CcdCa79Af89b3EC7b68E9', // android
      '0x5250b8202AEBca35328E2c217C687E894d70Cd31', // ios
      '0x168E4c3AC8d89B00958B6bE6400B066f0347DDc9', // web
    ],
  },
};

NetworkConfig.hardhat = {
  ...NetworkConfig.bsc_mainnet,
  autoVerifyContract: false,
};

export {NetworkConfig};
