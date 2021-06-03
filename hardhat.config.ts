import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import {HardhatUserConfig} from 'hardhat/types';
import * as dotenv from 'dotenv';
import {accounts} from './scripts/testWallet';

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',

  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
    disambiguatePaths: false,
  },

  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
  },

  networks: {
    hardhat: {
      accounts: accounts,
      chainId: 56,
      forking: {
        enabled: true,
        url: 'https://bsc-dataseed.binance.org/',
      },
    },
  },

  solidity: {
    compilers: [
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 780,
          },
          metadata: {
            // metadata hash is machine dependent, we want all generated code to be deterministic
            // https://docs.soliditylang.org/en/v0.7.6/metadata.html
            bytecodeHash: 'none',
          },
        },
      },
    ],
  },

  paths: {
    sources: './contracts',
    tests: './test/',
  },

  mocha: {
    timeout: 0,
    fullStackTrace: true,
  },

  etherscan: {
    // Your API key for bscscan
    // Obtain one at https://bscscan.io/
    apiKey: process.env.BSCSCAN_KEY,
  },

  typechain: {
    outDir: './typechain',
    target: 'ethers-v5',
  },
};

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (PRIVATE_KEY != undefined) {
  config.networks!.bsc_testnet = {
    url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    gasPrice: 20000000000,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };

  config.networks!.bsc_mainnet = {
    url: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };
}

export default config;
