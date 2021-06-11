import {IConfig} from './config_utils';
import {BscConfig} from './config_bsc';
import {EthConfig} from './config_eth';
import {customNetworkConfig} from '../hardhat.config';

const NetworkConfig: Record<string, IConfig> = {
  ...BscConfig,
  ...EthConfig,
};

NetworkConfig.hardhat = {
  // In case of testing, fork the config of the particular chain to hardhat
  ...NetworkConfig[customNetworkConfig ?? 'bsc_mainnet'],
  autoVerifyContract: false,
};

export {NetworkConfig};
