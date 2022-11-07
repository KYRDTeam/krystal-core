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
dotenv.config({path: `${__dirname}/./env/.env.${process.env.CHAIN}.${process.env.NETWORK}`});

const {
  PRIVATE_KEY,
  INFURA_API_KEY,
  ETHERSCAN_KEY,
  BSCSCAN_KEY,
  AVAXSCAN_KEY,
  POLYGONSCAN_KEY,
  FANTOMSCAN_KEY,
  AURORASCAN_KEY,
  ARBISCAN_KEY,
  OPTIMISTICSCAN_KEY,
  MAINNET_ID,
  MAINNET_FORK,
  MAINNET_FORK_BLOCK,
} = process.env;

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
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      ropsten: ETHERSCAN_KEY,
      goerli: ETHERSCAN_KEY,
      rinkeby: ETHERSCAN_KEY,

      // binance smart chain
      bsc: BSCSCAN_KEY,
      bscTestnet: BSCSCAN_KEY,

      // fantom mainnet
      opera: FANTOMSCAN_KEY,
      ftmTestnet: FANTOMSCAN_KEY,

      // polygon
      polygon: POLYGONSCAN_KEY,
      polygonMumbai: POLYGONSCAN_KEY,

      // avalanche
      avalanche: AVAXSCAN_KEY,
      avalancheFujiTestnet: AVAXSCAN_KEY,

      // aurora
      aurora: AURORASCAN_KEY,
      auroraTestnet: AURORASCAN_KEY,

      // arbitrum
      arbitrumOne: ARBISCAN_KEY,
      arbitrumTestnet: ARBISCAN_KEY,

      // optimism
      optimisticEthereum: OPTIMISTICSCAN_KEY,
    },
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

  config.networks!.bsc_staging = {
    url: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 5 * 1e9,
  };

  config.networks!.avalanche_fuji = {
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
  };

  config.networks!.avalanche_mainnet = {
    url: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 75 * 1e9,
  };

  config.networks!.fantom_mainnet = {
    url: 'https://rpc.ftm.tools/',
    chainId: 250,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 301 * 1e9,
  };

  config.networks!.arbitrum_mainnet = {
    url: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 1 * 1e9,
  };

  config.networks!.arbitrum_rinkeby = {
    url: 'https://rinkeby.arbitrum.io/rpc',
    chainId: 421611,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 1 * 1e9,
  };

  config.networks!.cronos_mainnet = {
    url: 'https://evm-cronos.crypto.org',
    chainId: 25,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 5000 * 1e9,
  };

  config.networks!.aurora_mainnet = {
    url: 'https://mainnet.aurora.dev/',
    chainId: 1313161554,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 1 * 1e9,
  };

  config.networks!.aurora_testnet = {
    url: 'https://testnet.aurora.dev/',
    chainId: 1313161555,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 1 * 1e9,
  };

  config.networks!.klaytn_mainnet = {
    url: 'https://public-node-api.klaytnapi.com/v1/cypress',
    chainId: 8217,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 250 * 1e9,
  };

  config.networks!.klaytn_testnet = {
    url: 'https://api.baobab.klaytn.net:8651',
    chainId: 1001,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 250 * 1e9,
  };
}

if (PRIVATE_KEY && INFURA_API_KEY) {
  config.networks!.polygon_mainnet = {
    url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 137,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 35 * 1e9,
  };

  config.networks!.polygon_staging = {
    url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 137,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 35 * 1e9,
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
    gasPrice: 15 * 1e9,
  };

  config.networks!.eth_goerli = {
    url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 5,
    accounts: [PRIVATE_KEY],
    timeout: 2000,
    gasPrice: 1 * 1e9,
  };

  config.networks!.eth_mainnet = {
    url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    chainId: 1,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 13 * 1e9,
  };

  config.networks!.optimism_mainnet = {
    url: `https://mainnet.optimism.io/`,
    chainId: 10,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 0.001 * 1e9,
  };

  config.networks!.optimism_testnet = {
    url: `https://goerli.optimism.io/`,
    chainId: 420,
    accounts: [PRIVATE_KEY],
    timeout: 20000,
    gasPrice: 0.001 * 1e9,
  };
}

export default config;
