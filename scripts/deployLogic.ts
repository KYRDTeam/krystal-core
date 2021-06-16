import {network, ethers, run} from 'hardhat';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {NetworkConfig} from './config';
import {
  FetchTokenBalances,
  SmartWalletImplementation,
  SmartWalletProxy,
  UniSwap,
  CompoundLending,
  UniSwapV3,
  KyberProxy,
} from '../typechain';
import {Contract} from '@ethersproject/contracts';

const gasLimit = 700000;

const networkConfig = NetworkConfig[network.name];
if (!networkConfig) {
  throw new Error(`Missing deploy config for ${network.name}`);
}

export interface KrystalContracts {
  smartWalletImplementation: SmartWalletImplementation;
  smartWalletProxy: SmartWalletProxy;
  fetchTokenBalances: FetchTokenBalances;
  swapContracts: {
    uniSwap?: UniSwap;
    uniSwapV3?: UniSwapV3;
    kyberProxy?: KyberProxy;
  };
  lendingContracts: {
    compoundLending?: CompoundLending;
  };
}

export const deploy = async (
  existingContract: Record<string, any> | undefined = undefined,
  extraArgs: {from?: string} = {}
): Promise<KrystalContracts> => {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  log(0, 'Start deploying Krystal contracts');
  log(0, '======================\n');
  let deployedContracts = await deployContracts(existingContract, deployerAddress);

  // Initialization
  let step = 0;
  log(0, 'Updating proxy data');
  log(0, '======================\n');
  await updateProxy(deployedContracts, extraArgs);

  log(0, 'Updating swaps/lendings linking');
  log(0, '======================\n');
  await updateChildContracts(deployedContracts, extraArgs);

  log(0, 'Updating uniswap/clones config');
  log(0, '======================\n');
  await updateUniSwap(deployedContracts.swapContracts.uniSwap, extraArgs);

  log(0, 'Updating uniswapV3/clones config');
  log(0, '======================\n');
  await updateUniSwapV3(deployedContracts.swapContracts.uniSwapV3, extraArgs);

  log(0, 'Updating kyberProxy config');
  log(0, '======================\n');
  await updateKyberProxy(deployedContracts.swapContracts.kyberProxy, extraArgs);

  log(0, 'Updating compound/clones config');
  log(0, '======================\n');
  await updateCompoundLending(deployedContracts.lendingContracts.compoundLending, extraArgs);

  // Summary
  log(0, 'Summary');
  log(0, '=======\n');

  log(0, JSON.stringify(convertToAddressObject(deployedContracts), null, 2));

  console.log('\nDeployment complete!');
  return deployedContracts;
};

async function deployContracts(
  existingContract: Record<string, any> | undefined = undefined,
  deployerAddress: string
): Promise<KrystalContracts> {
  let step = 0;

  const smartWalletImplementation = (await deployContract(
    ++step,
    networkConfig.autoVerifyContract,
    'SmartWalletImplementation',
    existingContract?.['smartWalletImplementation'],
    deployerAddress
  )) as SmartWalletImplementation;

  const fetchTokenBalances = (await deployContract(
    ++step,
    networkConfig.autoVerifyContract,
    'FetchTokenBalances',
    existingContract?.['fetchTokenBalances'],
    deployerAddress
  )) as FetchTokenBalances;

  const swapContracts = {
    uniSwap: !networkConfig.uniswap
      ? undefined
      : ((await deployContract(
          ++step,
          networkConfig.autoVerifyContract,
          'UniSwap',
          existingContract?.['swapContracts']?.['uniSwap'],
          deployerAddress,
          networkConfig.uniswap.routers
        )) as UniSwap),
    uniSwapV3: !networkConfig.uniswapV3
      ? undefined
      : ((await deployContract(
          ++step,
          networkConfig.autoVerifyContract,
          'UniSwapV3',
          existingContract?.['swapContracts']?.['uniSwapV3'],
          deployerAddress,
          networkConfig.uniswapV3.routers
        )) as UniSwapV3),
    kyberProxy: !networkConfig.kyberProxy
      ? undefined
      : ((await deployContract(
          ++step,
          networkConfig.autoVerifyContract,
          'KyberProxy',
          existingContract?.['swapContracts']?.['kyberProxy'],
          deployerAddress,
          networkConfig.kyberProxy.proxy
        )) as KyberProxy),
  };

  const lendingContracts = {
    compoundLending: (!networkConfig.compound
      ? undefined
      : await deployContract(
          ++step,
          networkConfig.autoVerifyContract,
          'CompoundLending',
          existingContract?.['lendingContracts']?.['compoundLending'],
          deployerAddress
        )) as CompoundLending,
  };

  const smartWalletProxy = (await deployContract(
    ++step,
    networkConfig.autoVerifyContract,
    'SmartWalletProxy',
    existingContract?.['smartWalletProxy'],
    deployerAddress,
    smartWalletImplementation.address,
    networkConfig.supportedWallets,
    Object.values(swapContracts)
      .filter((c) => c)
      .map((c?: Contract) => c!.address),
    Object.values(lendingContracts)
      .filter((c) => c)
      .map((c: Contract) => c.address)
  )) as SmartWalletProxy;

  return {
    smartWalletImplementation,
    smartWalletProxy,
    fetchTokenBalances,
    swapContracts,
    lendingContracts,
  };
}

async function deployContract(
  step: number,
  autoVerify: boolean,
  contractName: string,
  contractAddress: string | undefined,
  ...args: any[]
): Promise<Contract> {
  log(1, `${step}. Deploying '${contractName}'`);
  log(1, '------------------------------------');

  const factory = await ethers.getContractFactory(contractName);

  if (contractAddress) {
    log(2, `> contract already exists`);
    log(2, `> address:\t${contractAddress}`);
    return factory.attach(contractAddress);
  }

  const contract = await factory.deploy(...args);
  const tx = await contract.deployed();
  printInfo(tx.deployTransaction);
  log(2, `> address:\t${contract.address}`);

  if (autoVerify) {
    try {
      await run('verify:verify', {
        address: contract.address,
        constructorArguments: args,
      });
    } catch (e) {
      log(2, 'failed to verify contract', e);
    }
  }

  return contract;
}

async function updateProxy(
  {smartWalletProxy, smartWalletImplementation, swapContracts, lendingContracts}: KrystalContracts,
  extraArgs: {from?: string}
) {
  log(1, 'Update impl contract');
  let currentImpl = await smartWalletProxy.implementation();
  if (currentImpl === smartWalletImplementation.address) {
    log(2, `Impl contract is already up-to-date at ${smartWalletImplementation.address}`);
  } else {
    const tx = await smartWalletProxy.updateNewImplementation(smartWalletImplementation.address, {
      gasLimit,
      ...extraArgs,
    });
    printInfo(tx);
  }

  log(1, 'update supported platform wallets');
  let existing = (await smartWalletProxy.getAllSupportedPlatformWallets()).map((r) => r.toLowerCase());
  let configWallets = networkConfig.supportedWallets.map((r) => r.toLowerCase());
  let toBeRemoved = existing.filter((add) => !configWallets.includes(add));
  let toBeAdded = configWallets.filter((add) => !existing.includes(add));
  await updateAddressSet(smartWalletProxy.updateSupportedPlatformWallets, toBeRemoved, toBeAdded, extraArgs);

  log(1, 'update supported swaps');
  existing = (await smartWalletProxy.getAllSupportedSwaps()).map((r) => r.toLowerCase());
  let swaps: string[] = Object.values(swapContracts)
    .filter((c) => c)
    .map((c) => c!.address.toLowerCase());
  toBeRemoved = existing.filter((add) => !swaps.includes(add));
  toBeAdded = swaps.filter((add) => !existing.includes(add));
  await updateAddressSet(smartWalletProxy.updateSupportedSwaps, toBeRemoved, toBeAdded, extraArgs);

  log(1, 'update supported lendings');
  existing = (await smartWalletProxy.getAllSupportedLendings()).map((r) => r.toLowerCase());
  let lendings: string[] = Object.values(lendingContracts)
    .filter((c) => c)
    .map((c) => c!.address.toLowerCase());
  toBeRemoved = existing.filter((add) => !lendings.includes(add));
  toBeAdded = lendings.filter((add) => !existing.includes(add));
  await updateAddressSet(smartWalletProxy.updateSupportedLendings, toBeRemoved, toBeAdded, extraArgs);
}

async function updateChildContracts(
  {smartWalletProxy, swapContracts, lendingContracts}: KrystalContracts,
  extraArgs: {from?: string}
) {
  log(1, 'Linking swap contracts to proxy');
  let merged = {...swapContracts, ...lendingContracts};
  for (let contractName in merged) {
    // @ts-ignore maping to UniSwap to get function list
    let contract: UniSwap | undefined = merged[contractName];
    if (contract) {
      log(2, `Updating ${contractName} ${contract.address}`);
      if ((await contract.proxyContract()).toLowerCase() == smartWalletProxy.address.toLowerCase()) {
        log(2, `> Proxy contract is already up-to-date at ${smartWalletProxy.address}`);
      } else {
        const tx = await contract.updateProxyContract(smartWalletProxy.address, {
          gasLimit,
          ...extraArgs,
        });
        log(2, `> Linking to proxy ${smartWalletProxy.address}`);
        printInfo(tx);
      }
    }
  }
}

async function updateUniSwap(uniSwap: UniSwap | undefined, extraArgs: {from?: string}) {
  if (!uniSwap || !networkConfig.uniswap) {
    log(1, 'protocol not supported on this env');
    return;
  }
  log(1, 'update supported routers');
  let existing = (await uniSwap.getAllUniRouters()).map((r) => r.toLowerCase());
  let configRouters = networkConfig.uniswap!.routers.map((r) => r.toLowerCase());
  let toBeRemoved = existing.filter((add) => !configRouters.includes(add));
  let toBeAdded = configRouters.filter((add) => !existing.includes(add));
  await updateAddressSet(uniSwap.updateUniRouters, toBeRemoved, toBeAdded, extraArgs);
}

async function updateUniSwapV3(uniSwapV3: UniSwapV3 | undefined, extraArgs: {from?: string}) {
  if (!uniSwapV3 || !networkConfig.uniswapV3) {
    log(1, 'protocol not supported on this env');
    return;
  }
  log(1, 'update supported routers');
  let existing = (await uniSwapV3.getAllUniRouters()).map((r) => r.toLowerCase());
  let configRouters = networkConfig.uniswapV3!.routers.map((r) => r.toLowerCase());
  let toBeRemoved = existing.filter((add) => !configRouters.includes(add));
  let toBeAdded = configRouters.filter((add) => !existing.includes(add));
  await updateAddressSet(uniSwapV3.updateUniRouters, toBeRemoved, toBeAdded, extraArgs);
}

async function updateKyberProxy(kyberProxy: KyberProxy | undefined, extraArgs: {from?: string}) {
  if (!kyberProxy || !networkConfig.kyberProxy) {
    log(1, 'protocol not supported on this env');
    return;
  }
  log(1, 'update proxy');

  if ((await kyberProxy.kyberProxy()).toLowerCase() === networkConfig.kyberProxy.proxy.toLowerCase()) {
    log(2, `kyberProxy already up-to-date at ${networkConfig.kyberProxy.proxy}`);
  } else {
    const tx = await kyberProxy.updateKyberProxy(networkConfig.kyberProxy.proxy);
    log(2, '> updated kyberProxy', JSON.stringify(networkConfig.kyberProxy, null, 2));
    printInfo(tx);
  }
}

async function updateCompoundLending(compoundLending: CompoundLending | undefined, extraArgs: {from?: string}) {
  if (!compoundLending || !networkConfig.compound) {
    log(1, 'protocol not supported on this env');
    return;
  }

  log(1, 'update compound data');
  if ((await compoundLending.getComptroller()) === networkConfig.compound.compTroller) {
    log(2, `comptroller already up-to-date at ${networkConfig.compound.compTroller}`);
  } else {
    const tx = await compoundLending.updateCompoundData(
      networkConfig.compound.compTroller,
      networkConfig.compound.cNative,
      networkConfig.compound.cTokens
    );
    log(2, '> updated compound', JSON.stringify(networkConfig.compound, null, 2));
    printInfo(tx);
  }
}

async function updateAddressSet(
  updateFunc: any,
  toBeRemoved: string[],
  toBeAdded: string[],
  extraArgs: {from?: string}
) {
  if (toBeRemoved.length) {
    const tx = await updateFunc(toBeRemoved, false, {
      gasLimit,
      ...extraArgs,
    });
    log(2, '> removed wallets', toBeRemoved);
    printInfo(tx);
  } else {
    log(2, '> nothing to be removed');
  }
  console.log('\n');
  if (toBeAdded.length) {
    const tx = await updateFunc(toBeAdded, true, {
      gasLimit,
      ...extraArgs,
    });
    log(2, '> added wallets', toBeAdded);
    printInfo(tx);
  } else {
    log(2, '> nothing to be added');
  }
}

function printInfo(tx: TransactionResponse) {
  log(2, `> tx hash:\t${tx.hash}`);
  log(2, `> gas price:\t${tx.gasPrice.toString()}`);
  log(2, `> gas limit:\t${tx.gasLimit.toString()}`);
}

export function convertToAddressObject(obj: Record<string, any> | Array<any> | Contract): any {
  if (obj instanceof Contract) {
    return obj.address;
  } else if (Array.isArray(obj)) {
    return obj.map((k) => convertToAddressObject(obj[k]));
  } else {
    let ret = {};
    for (let k in obj) {
      // @ts-ignore
      ret[k] = convertToAddressObject(obj[k]);
    }
    return ret;
  }
}

let prevLevel: number;
function log(level: number, ...args: any[]) {
  if (prevLevel != undefined && prevLevel > level) {
    console.log('\n');
  }
  prevLevel = level;

  let prefix = '';
  for (let i = 0; i < level; i++) {
    prefix += '    ';
  }
  console.log(`${prefix}`, ...args);
}
