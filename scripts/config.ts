import {IConfig} from './config_utils';
import {BscConfig} from './config_bsc';
import {EthConfig} from './config_eth';
import {PolygonConfig} from './config_polygon';
import {AvalancheConfig} from './config_avalanche';
import {FantomConfig} from './config_fantom';
import {CronosConfig} from './config_cronos';
import {ArbitrumConfig} from './config_arbitrum';
import {customNetworkConfig} from '../hardhat.config';
import {AuroraConfig} from './config_aurora';
import {KlaytnConfig} from './config_klaytn';
import {OptimismConfig} from './config_optimism';
import {LineaConfig} from './config_linea';

const NetworkConfig: Record<string, IConfig> = {
  ...BscConfig,
  ...EthConfig,
  ...PolygonConfig,
  ...AvalancheConfig,
  ...FantomConfig,
  ...CronosConfig,
  ...AuroraConfig,
  ...ArbitrumConfig,
  ...KlaytnConfig,
  ...OptimismConfig,
  ...LineaConfig,
};

NetworkConfig.hardhat = {
  // In case of testing, fork the config of the particular chain to hardhat
  ...NetworkConfig[customNetworkConfig ?? 'bsc_mainnet'],
  autoVerifyContract: false,
};

export {NetworkConfig};
