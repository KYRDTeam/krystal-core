import {network, ethers, run} from 'hardhat';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {NetworkConfig} from './config';
import {SmartWalletSwapImplementation, SmartWalletSwapProxy} from '../typechain';

const gasLimit = 700000;

const networkConfig = NetworkConfig[network.name];
if (!networkConfig) {
  throw new Error(`Missing deploy config for ${network.name}`);
}

export const deploy = async (
  existingContract: Record<string, string> | undefined = undefined,
  extraArgs: {from?: string} = {}
): Promise<Record<string, string>> => {
  const deployedContracts: Record<string, string> = {};

  console.log('Start deploying Krystal contracts ...');
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployContracts = ['SmartWalletSwapImplementation', 'SmartWalletSwapProxy', 'FetchTokenBalances'];
  let args = [[deployerAddress], [deployerAddress, null, networkConfig.pancake.routers], [deployerAddress]];
  let step = 0;
  let tx;

  // Deployment
  console.log(`Deploying Contracts using ${deployerAddress}`);
  console.log('============================\n');
  for (let index in deployContracts) {
    const contractName = deployContracts[index];

    if (existingContract?.[contractName]) {
      deployedContracts[contractName] = existingContract[contractName];

      console.log(`   ${++step}. contract already exists, skip deploy '${contractName}'`);
      console.log(`   contract address = ${existingContract[contractName]}`);
      console.log('   ------------------------------------\n');
    } else {
      if (deployContracts[index] === 'SmartWalletSwapProxy')
        args[index][1] = deployedContracts['SmartWalletSwapImplementation'];
      deployedContracts[contractName] = await deployContract(++step, contractName, ...args[index]);
      // auto verify contract on mainnet/testnet
      if (networkConfig.autoVerifyContract) {
        try {
          await run('verify:verify', {
            address: deployedContracts[contractName],
            constructorArguments: args[index],
          });
        } catch (e) {
          console.log('failed to verify contract', e);
        }
      }
    }
  }

  // Initialization
  console.log('Initializing SmartWalletSwapProxy');
  console.log('======================\n');

  // Original proxy instance
  let swapProxyOrigin = (await ethers.getContractAt(
    'SmartWalletSwapProxy',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapProxy;

  // Using SwapProxy address under SmartWalletSwapImplementation logics
  let swapProxyInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapImplementation;

  // Update supported platform wallets
  console.log(`   ${++step}.  updateSupportedPlatformWallets`);
  console.log('   ------------------------------------');
  const toUpdateWallets = [];
  for (let w of networkConfig.supportedWallets) {
    let supported = await swapProxyInstance.supportedPlatformWallets(w);
    if (!supported) {
      toUpdateWallets.push(w);
    }
  }
  if (toUpdateWallets.length) {
    console.log('   new wallets', toUpdateWallets);
    tx = await swapProxyInstance.updateSupportedPlatformWallets(toUpdateWallets, true, {
      gasLimit,
      ...extraArgs,
    });
    printInfo(tx);
    console.log('\n');
  } else {
    console.log(`   Nothing to update\n`);
  }

  // Update pancake routers
  console.log(`   ${++step}.  updatePancakeRouters`);
  console.log('   ------------------------------------');
  const toUpdateRouters = [];
  for (let w of networkConfig.pancake.routers) {
    let supported = await swapProxyInstance.pancakeRouters(w);
    if (!supported) {
      toUpdateRouters.push(w);
    }
  }
  if (toUpdateRouters.length) {
    console.log('   new routers', toUpdateRouters);
    tx = await swapProxyInstance.updatePancakeRouters(toUpdateRouters, true, {
      gasLimit,
      ...extraArgs,
    });
    printInfo(tx);
    console.log('\n');
  } else {
    console.log(`   Nothing to update\n`);
  }

  // Link from proxy to impl contract if the addresses are different
  console.log(`   ${++step}.  updatedImplContract`);
  console.log('   ------------------------------------');

  const currentImpleContract = await swapProxyOrigin.implementation();
  if (currentImpleContract === deployedContracts['SmartWalletSwapImplementation']) {
    console.log(`   Impl contract is already up-to-date at ${currentImpleContract}\n`);
  } else {
    tx = await swapProxyOrigin.updateNewImplementation(deployedContracts['SmartWalletSwapImplementation'], {
      gasLimit,
      ...extraArgs,
    });
    printInfo(tx);
    console.log('\n');
  }

  // Summary
  console.log('Summary');
  console.log('=======\n');
  for (let contract of deployContracts) {
    console.log(`   > ${contract}: ${deployedContracts[contract]}`);
  }

  console.log('\nDeployment complete!');
  return deployedContracts;
};

async function deployContract(step: number, contractName: string, ...args: any[]): Promise<string> {
  console.log(`   ${step}. Deploying '${contractName}'`);
  console.log('   ------------------------------------');

  const factory = await ethers.getContractFactory(contractName);
  const contract = await factory.deploy(...args);
  const tx = await contract.deployed();
  printInfo(tx.deployTransaction);
  console.log(`   > address:\t${contract.address}\n\n`);

  return contract.address;
}

function printInfo(tx: TransactionResponse) {
  console.log(`   > tx hash:\t${tx.hash}`);
  console.log(`   > gas price:\t${tx.gasPrice.toString()}`);
  console.log(`   > gas limit:\t${tx.gasLimit.toString()}`);
}
