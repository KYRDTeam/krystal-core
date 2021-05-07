interface IConfig {
  busdAddress: string;
  daiAddress: string;
  usdcAddress: string;
  usdtAddress: string;

  pancakeRouter: string;
  kyberProxy: string;
  vBnb: string;
  vTokens: string[];

  compTroller: string;

  supportedWallets: string[];
}

export const NetworkConfig: Record<string, IConfig> = {
  testnet: {
    busdAddress: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
    daiAddress: '0xec5dcb5dbf4b114c9d0f65bccab49ec54f6a0867',
    usdcAddress: '0x64544969ed7ebf5f083679233325356ebe738930',
    usdtAddress: '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd',

    pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    kyberProxy: '0x9AAb3f75489902f3a48495025729a0AF77d4b11e',
    vBnb: '0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c',
    compTroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
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
    supportedWallets: [
      '0x3fFFF2F4f6C0831FAC59534694ACd14AC2Ea501b', // android
      '0x9a68f7330A3Fe9869FfAEe4c3cF3E6BBef1189Da', // ios
      '0x440bBd6a888a36DE6e2F6A25f65bc4e16874faa9', // web
    ],
  },
};
