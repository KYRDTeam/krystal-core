import {BigNumber} from '@ethersproject/bignumber';
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

export const equalHex = (a: string, b: string) => {
  return a.toLowerCase() === b.toLowerCase();
};

export const getChain = async (): Promise<string> => {
  return (await hre.network.provider.request({
    method: 'eth_chainId',
    params: [],
  })) as string;
};

export const fromWei = (balance: BigNumber, decimal: number): string => {
  const divisor = BigNumber.from(10).pow(decimal);

  const beforeDecimal = balance.div(divisor);
  const afterDecimal = balance.mod(divisor);

  let res = beforeDecimal.toString() + '.';
  for (let i = 0; i < decimal - afterDecimal.toString().length; i++) {
    res += '0';
  }
  res += afterDecimal.toString();
  return res;
};
