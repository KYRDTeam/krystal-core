import {network, ethers, run} from 'hardhat';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {NetworkConfig} from './config';
import {SmartWalletLending} from '../typechain/SmartWalletLending';
import {SmartWalletSwapImplementation} from '../typechain/SmartWalletSwapImplementation';

const deployedContracts: Record<string, string> = {};
const gasLimit = 500000;

const networkConfig = NetworkConfig[network.name];
if (!networkConfig) {
  throw new Error(`Missing deploy config for ${network.name}`);
}

async function main() {
  console.log('Start deploying Krystal contracts ...');
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployContracts = ['SmartWalletLending', 'SmartWalletSwapImplementation', 'SmartWalletSwapProxy'];
  let instance;
  let args = [
    [deployerAddress],
    [deployerAddress],
    [deployerAddress, null, networkConfig.kyberProxy, [networkConfig.pancakeRouter]],
  ];
  let step = 0;
  let tx;

  // Deployment
  console.log(`Deploying Contracts using ${deployerAddress}`);
  console.log('============================\n');
  for (let index in deployContracts) {
    if (deployContracts[index] === 'SmartWalletSwapProxy')
      args[index][1] = deployedContracts['SmartWalletSwapImplementation'];
    await deploy(++step, deployContracts[index], ...args[index]);
    // auto verify contract
    await run('verify:verify', {
      address: deployedContracts[deployContracts[index]],
      constructorArguments: args[index],
    });
  }

  // Initialization
  console.log('Initializing SmartWalletSwapProxy');
  console.log('======================\n');
  instance = (await ethers.getContractAt(
    'SmartWalletSwapImplementation',
    deployedContracts['SmartWalletSwapProxy']
  )) as SmartWalletSwapImplementation;

  // Approve allowances to Kyber and PancakeSwap routers
  console.log(`   ${++step}.  approveAllowances`);
  console.log('   ------------------------------------');
  tx = await instance.approveAllowances(
    [networkConfig.busdAddress, networkConfig.daiAddress, networkConfig.usdcAddress, networkConfig.usdtAddress],
    [networkConfig.kyberProxy, networkConfig.pancakeRouter],
    false,
    {gasLimit}
  );
  printInfo(tx);
  console.log('\n');

  // Update lending implementation and proxy
  console.log(`   ${++step}.  updateLendingImplementation`);
  console.log('   ------------------------------------');
  tx = await instance.updateLendingImplementation(deployedContracts['SmartWalletLending'], {
    gasLimit,
  });
  printInfo(tx);
  console.log('\n');

  // Add supported platform wallets
  console.log(`   ${++step}.  updateSupportedPlatformWallets`);
  console.log('   ------------------------------------');
  tx = await instance.updateSupportedPlatformWallets(networkConfig.supportedWallets, true, {
    gasLimit,
  });
  printInfo(tx);
  console.log('\n');

  console.log('Initializing SmartWalletLending');
  console.log('======================\n');
  instance = (await ethers.getContractAt(
    'SmartWalletLending',
    deployedContracts['SmartWalletLending']
  )) as SmartWalletLending;

  // Update Venus lending pool data to lending implementation
  console.log(`   ${++step}.  updateVenusData`);
  console.log('   ------------------------------------');

  tx = await instance.updateVenusData(networkConfig.compTroller, networkConfig.vBnb, networkConfig.vTokens, {
    gasLimit,
  });
  printInfo(tx);
  console.log('\n');

  // Update proxy to lending implementation
  console.log(`   ${++step}.  updateSwapImplementation`);
  console.log('   ------------------------------------');
  tx = await instance.updateSwapImplementation(deployedContracts['SmartWalletSwapProxy'], {gasLimit});
  printInfo(tx);
  console.log('\n');

  // Summary

  console.log('Summary');
  console.log('=======\n');
  for (let contract of deployContracts) {
    console.log(`   > ${contract}: ${deployedContracts[contract]}`);
  }

  console.log('\nDeployment complete!');
}

async function deploy(step: number, contractName: string, ...args: any[]) {
  console.log(`   ${step}. Deploying '${contractName}'`);
  console.log('   ------------------------------------');

  const factory = await ethers.getContractFactory(contractName);
  const contract = await factory.deploy(...args);
  const tx = await contract.deployed();
  printInfo(tx.deployTransaction);
  console.log(`   > address:\t${contract.address}\n\n`);

  deployedContracts[contractName] = contract.address;
}

function printInfo(tx: TransactionResponse) {
  console.log(`   > tx hash:\t${tx.hash}`);
  console.log(`   > gas price:\t${tx.gasPrice.toString()}`);
  console.log(`   > gas used:\t${tx.gasLimit.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
