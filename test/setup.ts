import {ethers, network} from 'hardhat';
import {nativeTokenDecimals, evm_snapshot, MAX_AMOUNT} from './helper';
import {IERC20Ext, IUniswapV2Router02, SmartWalletImplementation} from '../typechain';
import {deploy, KrystalContracts} from '../scripts/deployLogic';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {NetworkConfig} from '../scripts/config';
import {IConfig} from '../scripts/config_utils';
import {BigNumber} from '@ethersproject/bignumber';

const setupContracts = async (accounts: SignerWithAddress[]) => {
  let user = accounts[0];
  let admin = accounts[0];

  const krystalContracts = await deploy(undefined, {from: admin.address});
  const networkConfig = NetworkConfig[network.name];

  let uniRouter = (await ethers.getContractAt(
    'IUniswapV2Router02',
    networkConfig.uniswap!.routers[0]
  )) as IUniswapV2Router02;

  let proxyInstance = (await ethers.getContractAt(
    'SmartWalletImplementation',
    krystalContracts!.smartWalletProxy!.address
  )) as SmartWalletImplementation;

  // Fund wallet
  console.log('\nStart funding...');
  for (let {symbol, address} of networkConfig.tokens) {
    const tokenContract = (await ethers.getContractAt('IERC20Ext', address)) as IERC20Ext;
    const nativeTokenAmount = BigNumber.from(networkConfig.fundedAmount ?? 5).mul(
      BigNumber.from(10).pow(nativeTokenDecimals)
    );
    const beforeAmount = await tokenContract.balanceOf(user.address);
    await uniRouter.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [networkConfig.wNative, address],
      user.address,
      MAX_AMOUNT,
      {
        from: user.address,
        value: nativeTokenAmount,
      }
    );

    const afterAmount = await tokenContract.balanceOf(user.address);
    console.log('Funded', {
      token: symbol,
      token_address: address,
      address: user.address,
      new_balance: afterAmount.toString(),
      funded: afterAmount.sub(beforeAmount).toString(),
    });
  }

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
