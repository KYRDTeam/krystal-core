import {ethers, network} from 'hardhat';
import {evm_snapshot} from './helper';
import {IUniswapV2Router02, SmartWalletImplementation} from '../typechain';
import {deploy, KrystalContracts} from '../scripts/deployLogic';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {NetworkConfig} from '../scripts/config';
import {IConfig} from '../scripts/config_utils';

const setupContracts = async (accounts: SignerWithAddress[]) => {
  let user = accounts[0];
  let admin = accounts[0];

  const krystalContracts = await deploy(undefined, {from: admin.address});

  let proxyInstance = (await ethers.getContractAt(
    'SmartWalletImplementation',
    krystalContracts.smartWalletProxy!.address
  )) as SmartWalletImplementation;

  return {
    user,
    krystalContracts,
    proxyInstance,
    postSetupSnapshotId: await evm_snapshot(),
  };
};

export interface IInitialSetup {
  user: SignerWithAddress;
  preSetupSnapshotId: any;
  postSetupSnapshotId: any;
  proxyInstance: SmartWalletImplementation;
  network: IConfig;
  krystalContracts: KrystalContracts;
}

export const networkSetting = NetworkConfig[network.name];

let initialSetup: IInitialSetup;

export const getInitialSetup = async (): Promise<IInitialSetup> => {
  if (!initialSetup) {
    try {
      console.log('\n\n\n=== Setting initial testing contracts ===');
      let signers = await ethers.getSigners();
      let preSetupSnapshotId = await evm_snapshot();
      let data = await setupContracts(signers);
      initialSetup = {
        preSetupSnapshotId,
        ...data,
        network: networkSetting,
      };
    } catch (e) {
      console.log('\n\n\n=== Cannot initialize setup', e);
      process.exit(1);
    }
  }
  return initialSetup;
};
