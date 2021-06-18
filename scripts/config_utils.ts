export interface IConfig {
  autoVerifyContract: boolean;

  // mostly used for testing purpose
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

  uniswapV3?: {
    routers: string[];
  };

  kyberProxy?: {
    proxy: string;
  };

  kyberDmm?: {
    router: string;
  };

  // Compound or clones
  compound?: {
    compTroller: string;
    cNative: string;
    cTokens: string[];
  };

  aaveV1?: {
    poolV1: string;
    poolCoreV1: string;
    referralCode: number;
    tokens: string[];
  };

  aaveV2?: {
    poolV2: string;
    provider: string;
    weth: string;
    referralCode: number;
    tokens: string[];
  };

  supportedWallets: string[];
  fundedAmount?: number;
}

export const commonPlatformWallets = [
  '0xa1738F8DD7c42cd4175CcdCa79Af89b3EC7b68E9', // android
  '0x5250b8202AEBca35328E2c217C687E894d70Cd31', // ios
  '0x168E4c3AC8d89B00958B6bE6400B066f0347DDc9', // web
];
