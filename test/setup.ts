import {ethers, network} from 'hardhat';
import {bnbAddress, bnbDecimals, evm_snapshot} from './helper';
import {IBEP20, SmartWalletSwapImplementation} from '../typechain';
import {deploy} from '../scripts/deployLogic';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {NetworkConfig, IConfig} from '../scripts/config';
import {BigNumber} from '@ethersproject/bignumber';

const setupContracts = async (accounts: SignerWithAddress[]) => {
  let user = accounts[0];
  let admin = accounts[0];

  const deployedContracts = await deploy({from: admin.address});
  const networkConfig = NetworkConfig[network.name];

  // Using proxy under the implementaton interface
  let swapProxyInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapImplementation;

  let swapImplementationInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapImplementation']
  )) as SmartWalletSwapImplementation;

  // Fund wallet
  for (let tokenAddress of [
    networkConfig.usdtAddress,
    networkConfig.usdcAddress,
    networkConfig.daiAddress,
    networkConfig.busdAddress,
  ]) {
    const bnbAmount = BigNumber.from(1000).mul(BigNumber.from(10).pow(bnbDecimals));
    await swapProxyInstance.swapPancake(
      networkConfig.pancake.router,
      bnbAmount,
      0,
      [bnbAddress, tokenAddress],
      user.address,
      0,
      networkConfig.supportedWallets[0],
      true,
      {
        from: user.address,
        value: bnbAmount,
      }
    );

    const tokenContract = (await ethers.getContractAt('IBEP20', tokenAddress)) as IBEP20;
    console.log('Funded', {
      token: await tokenContract.symbol(),
      token_address: tokenAddress,
      address: user.address,
      new_balance: (await tokenContract.balanceOf(user.address)).toString(),
    });
  }

  return {
    user,
    swapImplementationInstance,
    swapProxyInstance,
    postSetupSnapshotId: await evm_snapshot(),
  };
};

export interface IInitialSetup {
  user: SignerWithAddress;
  preSetupSnapshotId: any;
  postSetupSnapshotId: any;
  swapImplementationInstance: SmartWalletSwapImplementation;
  swapProxyInstance: SmartWalletSwapImplementation;
  network: IConfig;
}

let initialSetup: IInitialSetup;

export const getInitialSetup = async (): Promise<IInitialSetup> => {
  console.log('\n\n\n=== Setting initial testing contracts ===');
  return (
    initialSetup || {
      preSetupSnapshotId: await evm_snapshot(),
      ...(await setupContracts(await ethers.getSigners())),
      network: NetworkConfig[network.name],
    }
  );
};
