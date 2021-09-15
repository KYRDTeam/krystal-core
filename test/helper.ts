import {BigNumber} from '@ethersproject/bignumber';
import {ethers} from 'ethers';
import * as hre from 'hardhat';

export const MAX_AMOUNT = BigNumber.from(10e10);
export const BPS = BigNumber.from(10000);
export const nativeTokenDecimals = 18;
export const nativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const zeroAddress = '0x0000000000000000000000000000000000000000';
export const EPS = 10e-2;

export enum FeeMode {
  FROM_SOURCE = 0,
  FROM_DEST = 1,
  BY_PROTOCOL = 2,
}

export const evm_snapshot = async function () {
  return await hre.network.provider.request({
    method: 'evm_snapshot',
    params: [],
  });
};

export const evm_revert = async function (snapshotId: any) {
  return await hre.network.provider.request({
    method: 'evm_revert',
    params: [snapshotId],
  });
};

export const sleep = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('ok');
    }, timeout);
  });
};

export const getOpenzeppelinDefaultImplementation = async (
  provider: ethers.providers.JsonRpcProvider,
  address: string
) => {
  let data = await provider.getStorageAt(
    address,
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
  );
  return '0x' + data.slice(26, 66);
};

export const getOpenzeppelinDefaultAdmin = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  let data = await provider.getStorageAt(
    address,
    '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
  );
  return '0x' + data.slice(26, 66);
};
