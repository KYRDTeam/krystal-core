import {ethers, network} from 'hardhat';
import {evm_snapshot} from './helper';
import {SmartWalletLending, SmartWalletSwapImplementation} from '../typechain';
import {deploy} from '../scripts/deployLogic';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {NetworkConfig, IConfig} from '../scripts/config';

const setupContracts = async (accounts: SignerWithAddress[]) => {
  let user = accounts[0];
  let admin = accounts[0];

  const deployedContracts = await deploy({from: admin.address});

  // Using proxy under the implementaton interface
  let swapProxyInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapImplementation;

  let swapImplementationInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapImplementation']
  )) as SmartWalletSwapImplementation;

  let lendingInstance = (await ethers.getContractAt(
    'SmartWalletLending',
    deployedContracts['SmartWalletLending']
  )) as SmartWalletLending;

  // let aUsdtToken = await IERC20Ext.at(AAVE_V1_ADDRESSES.aUsdtAddress);
  // await aUsdtToken.approve(swapProxy.address, MAX_ALLOWANCE, {from: user});
  // aUsdtToken = await IERC20Ext.at(AAVE_V2_ADDRESSES.aUsdtAddress);
  // await aUsdtToken.approve(swapProxy.address, MAX_ALLOWANCE, {from: user});

  // // fund testing wallet with USDT, USDC, and DAI
  // const usdtToken = await IERC20Ext.at(usdtAddress);
  // const usdcToken = await IERC20Ext.at(usdcAddress);
  // const daiToken = await IERC20Ext.at(daiAddress);
  // await fundWallet(user, usdtToken, '10000');
  // await fundWallet(user, usdcToken, '10000');
  // await fundWallet(user, daiToken, '10000');

  // fund testing wallet with WETH
  // const wethToken = await WETH.at(wethAddress);
  // await wethToken.deposit({value: new BN('100').mul(new BN(10).pow(ethDecimals))});

  return {
    user,
    lendingInstance,
    swapImplementationInstance,
    swapProxyInstance,
    postSetupSnapshotId: await evm_snapshot(),
  };
};

export interface IInitialSetup {
  user: SignerWithAddress;
  preSetupSnapshotId: any;
  postSetupSnapshotId: any;
  lendingInstance: SmartWalletLending;
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
