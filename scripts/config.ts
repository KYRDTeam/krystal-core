import {IConfig} from './config_utils';
import {BscConfig} from './config_bsc';
import {EthConfig} from './config_eth';

const NetworkConfig: Record<string, IConfig> = {
  ...BscConfig,
  ...EthConfig,
};

NetworkConfig.hardhat = {
  ...NetworkConfig.bsc_mainnet,
  autoVerifyContract: false,
};

export {NetworkConfig};
