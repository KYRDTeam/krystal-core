import {IConfig} from './config_utils';
import {BscConfig} from './config_bsc';
import {EthConfig} from './config_eth';
import {PolygonConfig} from './config_polygon';
import {AvalancheConfig} from './config_avalanche';
import {FantomConfig} from './config_fantom';
import {CronosConfig} from './config_cronos';
import {customNetworkConfig} from '../hardhat.config';

const NetworkConfig: Record<string, IConfig> = {
  ...BscConfig,
  ...EthConfig,
  ...PolygonConfig,
  ...AvalancheConfig,
  ...FantomConfig,
  ...CronosConfig,
};

NetworkConfig.hardhat = {
  // In case of testing, fork the config of the particular chain to hardhat
  ...NetworkConfig[customNetworkConfig ?? 'bsc_mainnet'],
  autoVerifyContract: false,
};

export {NetworkConfig};
