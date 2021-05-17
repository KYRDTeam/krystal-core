import {network, ethers, run} from 'hardhat';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {NetworkConfig} from './config';
import {SmartWalletSwapImplementation} from '../typechain';

const gasLimit = 700000;

const networkConfig = NetworkConfig[network.name];
if (!networkConfig) {
  throw new Error(`Missing deploy config for ${network.name}`);
}

export const deploy = async (extraArgs: {from?: string} = {}): Promise<Record<string, string>> => {
  const deployedContracts: Record<string, string> = {};

  console.log('Start deploying Krystal contracts ...');
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployContracts = ['SmartWalletSwapImplementation', 'SmartWalletSwapProxy'];
  let args = [[deployerAddress], [deployerAddress, null, [networkConfig.pancake.router]]];
  let step = 0;
  let tx;

  // Deployment
  console.log(`Deploying Contracts using ${deployerAddress}`);
  console.log('============================\n');
  for (let index in deployContracts) {
    if (deployContracts[index] === 'SmartWalletSwapProxy')
      args[index][1] = deployedContracts['SmartWalletSwapImplementation'];
    deployedContracts[deployContracts[index]] = await deployContract(++step, deployContracts[index], ...args[index]);
    // auto verify contract on mainnet/testnet
    if (networkConfig.autoVerifyContract) {
      await run('verify:verify', {
        address: deployedContracts[deployContracts[index]],
        constructorArguments: args[index],
      });
    }
  }

  // Initialization
  console.log('Initializing SmartWalletSwapProxy');
  console.log('======================\n');
  // Using SwapProxy address under SmartWalletSwapImplementation logics
  let swapProxyInstance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapImplementation;

  // Approve allowances to Kyber and PancakeSwap routers
  console.log(`   ${++step}.  approveAllowances`);
  console.log('   ------------------------------------');
  tx = await swapProxyInstance.approveAllowances(
    [networkConfig.busdAddress, networkConfig.daiAddress, networkConfig.usdcAddress, networkConfig.usdtAddress],
    [networkConfig.pancake.router],
    false,
    {gasLimit, ...extraArgs}
  );
  printInfo(tx);
  console.log('\n');

  // Add supported platform wallets
  console.log(`   ${++step}.  updateSupportedPlatformWallets`);
  console.log('   ------------------------------------');
  tx = await swapProxyInstance.updateSupportedPlatformWallets(networkConfig.supportedWallets, true, {
    gasLimit,
    ...extraArgs,
  });
  printInfo(tx);
  console.log('\n');

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