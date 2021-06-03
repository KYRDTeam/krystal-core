import {BigNumber} from '@ethersproject/bignumber';
import * as hre from 'hardhat';

export const BPS = BigNumber.from(10000);
export const nativeTokenDecimals = 18;
export const nativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

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
