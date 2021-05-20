export interface IConfig {
  autoVerifyContract: boolean;

  busdAddress: string;
  daiAddress: string;
  usdcAddress: string;
  usdtAddress: string;
  wbnb: string;

  pancake: {
    router: string;
  };

  venus: {
    compTroller: string;
    vBnb: string;
    vTokens: string[];
  };

  supportedWallets: string[];
}

const NetworkConfig: Record<string, IConfig> = {
  testnet: {
    autoVerifyContract: true,

    busdAddress: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
    daiAddress: '0xec5dcb5dbf4b114c9d0f65bccab49ec54f6a0867',
    usdcAddress: '0x64544969ed7ebf5f083679233325356ebe738930',
    usdtAddress: '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd',
    wbnb: '',

    // Pancake
    pancake: {
      router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    },

    // Venus
    venus: {
      compTroller: '0x94d1820b2d1c7c7452a163983dc888cec546b77d',
      vBnb: '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c',
      vTokens: [
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

  mainnet: {
    autoVerifyContract: true,

    busdAddress: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    daiAddress: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    usdcAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    usdtAddress: '0x55d398326f99059ff775485246999027b3197955',
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',

    pancake: {
      router: '0x05ff2b0db69458a0750badebc4f9e13add608c7f',
    },

    venus: {
      compTroller: '0xfd36e2c2a6789db23113685031d7f16329158384',
      vBnb: '0xa07c5b74c9b40447a954e1466938b865b6bbea36',
      vTokens: [
        // https://api.venus.io/api/vToken
        '0x2ff3d0f6990a40261c66e1ff2017acbc282eb6d0',
      ],
    },

    supportedWallets: [
      '0xa1738F8DD7c42cd4175CcdCa79Af89b3EC7b68E9', // android
      '0x5250b8202AEBca35328E2c217C687E894d70Cd31', // ios
      '0x168E4c3AC8d89B00958B6bE6400B066f0347DDc9', // web
    ],
  },
};

NetworkConfig.hardhat = {
  ...NetworkConfig.mainnet,
  autoVerifyContract: false,
};

export {NetworkConfig};
