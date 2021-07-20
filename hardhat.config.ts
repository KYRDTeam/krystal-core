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

// General config in .env
dotenv.config();

// Network specific config
dotenv.config({path: `${__dirname}/./.env.${process.env.CHAIN}.${process.env.NETWORK}`});

const {PRIVATE_KEY, INFURA_API_KEY, ETHERSCAN_KEY, MAINNET_ID, MAINNET_FORK, MAINNET_FORK_BLOCK} = process.env;

// custom network config for testing. See scripts/config.ts
export const customNetworkConfig =
  process.env.CHAIN && process.env.CHAIN ? `${process.env.CHAIN}_${process.env.NETWORK}` : undefined;

export const multisig = process.env.MULTISIG ?? undefined;

console.log(
  `--ENVS:\n--CHAIN=${process.env.CHAIN}, NETWORK=${process.env.NETWORK}, customConfig=${customNetworkConfig}`
);
console.log(
  `--MAINNET_FORK=${process.env.MAINNET_FORK}, MAINNET_ID=${process.env.MAINNET_ID}, MAINNET_FORK_BLOCK=${process.env.MAINNET_FORK_BLOCK}`
);

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',

  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },

  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
  },

  networks: {},

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
    parallel: false,
    fullTrace: true,
  },

  etherscan: {
    // Your API key for bscscan / ethscan
    // Obtain one at https://bscscan.io/
    apiKey: ETHERSCAN_KEY,
  },

  typechain: {
    outDir: './typechain',
    target: 'ethers-v5',
  },
};

if (MAINNET_FORK) {
  config.networks!.hardhat = {
    accounts: accounts,
    chainId: parseInt(MAINNET_ID || '') || undefined,
    forking: {
      url: MAINNET_FORK,
      blockNumber: parseInt(MAINNET_FORK_BLOCK || '') || undefined,
    },
  };
}

if (PRIVATE_KEY) {
  config.networks!.bsc_testnet = {
    url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };

  config.networks!.bsc_mainnet = {
    url: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 5 * 1e9,
  };
}

if (PRIVATE_KEY && INFURA_API_KEY) {
  config.networks!.polygon_mainnet = {
    url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 137,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 2 * 1e9,
  };

  config.networks!.polygon_mumbai = {
    url: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 80001,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 2 * 1e9,
  };

  config.networks!.eth_kovan = {
    url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 42,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };

  config.networks!.eth_rinkeby = {
    url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 4,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 10 * 1e9,
  };

  config.networks!.eth_ropsten = {
    url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 3,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 20 * 1e9,
  };

  config.networks!.eth_mainnet = {
    url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 1,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };
}

export default config;
