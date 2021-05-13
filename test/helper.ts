import hre from 'hardhat';
import BN from 'bn.js';
import {IBEP20} from '../typechain';

const Math = require('mathjs');
const {constants, time} = require('@openzeppelin/test-helpers');

const BPS = new BN(10000);
const precisionUnits = new BN(10).pow(new BN(18));
export const bnbDecimals = 18;

export const binanceColdWallet = '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE';
export const bnbAddress = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';

export const zeroAddress = constants.ZERO_ADDRESS;
export const emptyHint = '0x';
export const zeroBN = new BN(0);
export const MAX_QTY = new BN(10).pow(new BN(28));
export const MAX_RATE = precisionUnits.mul(new BN(10).pow(new BN(7)));
export const MAX_ALLOWANCE = new BN(2).pow(new BN(256)).sub(new BN(1));
export const AAVE_V1_ADDRESSES = {
  aEthAddress: '0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04',
  aUsdtAddress: '0x71fc860f7d3a592a4a98740e39db31d25db65ae8',
  aDaiAddress: '0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
  aavePoolV1Address: '0x398eC7346DcD622eDc5ae82352F02bE94C62d119',
  aavePoolCoreV1Address: '0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3',
};
export const AAVE_V2_ADDRESSES = {
  aWethAddress: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
  aUsdtAddress: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
  aDaiAddress: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
  aavePoolV2Address: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
  aaveProviderV2Address: '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d',
};
export const COMPOUND_ADDRESSES = {
  cEthAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  cUsdtAddress: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
  cDaiAddress: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
  comptroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
};
export const lendingPlatforms = [0, 1, 2];

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

export const fundWallet = async function (wallet: string, Token: IBEP20, amount: number) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [binanceColdWallet],
  });

  const tokenDec = await Token.decimals();
  const bnAmount = new BN(amount).mul(new BN(10).pow(new BN(tokenDec)));

  await Token.transfer(wallet, bnAmount.toString(), {from: binanceColdWallet});

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [binanceColdWallet],
  });
};

// export const isRevertErrorMessageContains = function (error, msg) {
//   return error.message.search(msg) >= 0;
// };

// export const isRevertErrorMessage = function (error) {
//   if (error.message.search('invalid opcode') >= 0) return true;
//   if (error.message.search('revert') >= 0) return true;
//   if (error.message.search('out of gas') >= 0) return true;
//   return false;
// };

// export const expectThrow = async function (promise, message) {
//   try {
//     await promise;
//   } catch (error) {
//     // Message is an optional parameter here
//     if (message) {
//       assert(error.message.search(message) >= 0, "Expected '" + message + "', got '" + error + "' instead");
//       return;
//     } else {
//       assert(this.isRevertErrorMessage(error), "Expected throw, got '" + error + "' instead");
//       return;
//     }
//   }
//   assert.fail('Expected throw not received');
// };

// export const sendEtherWithPromise = function (sender, recv, amount) {
//   return new Promise(function (fulfill, reject) {
//     web3.eth.sendTransaction({to: recv, from: sender, value: amount}, function (error, result) {
//       if (error) {
//         return reject(error);
//       } else {
//         return fulfill(true);
//       }
//     });
//   });
// };

// function getBalancePromise(account) {
//   return new Promise(function (fulfill, reject) {
//     web3.eth.getBalance(account, function (err, result) {
//       if (err) reject(err);
//       else fulfill(new BN(result));
//     });
//   });
// }

// export const getBalancePromise = getBalancePromise;

// export const getCurrentBlock = function () {
//   return new Promise(function (fulfill, reject) {
//     web3.eth.getBlockNumber(function (err, result) {
//       if (err) reject(err);
//       else fulfill(result);
//     });
//   });
// };

// export const getCurrentBlockTime = function () {
//   return new Promise(function (fulfill, reject) {
//     web3.eth.getBlock('latest', false, function (err, result) {
//       if (err) reject(err);
//       else fulfill(result.timestamp);
//     });
//   });
// };

// export const bytesToHex = function (byteArray) {
//   let strNum = toHexString(byteArray);
//   let num = '0x' + strNum;
//   return num;
// };

// function toHexString(byteArray) {
//   return Array.from(byteArray, function (byte) {
//     return ('0' + (byte & 0xff).toString(16)).slice(-2);
//   }).join('');
// }

// export const sendPromise = function (method, params) {
//   return new Promise(function (fulfill, reject) {
//     web3.currentProvider.sendAsync(
//       {
//         jsonrpc: '2.0',
//         method,
//         params: params || [],
//         id: new Date().getTime(),
//       },
//       function (err, result) {
//         if (err) {
//           reject(err);
//         } else {
//           fulfill(result);
//         }
//       }
//     );
//   });
// };

// ////////////////////////////////////////////////////////////////////////////////

// export const exp = function (num1, num2) {
//   const num1Math = Math.bignumber(new BN(num1 * 10 ** 9).toString(10)).div(10 ** 9);
//   const num2Math = Math.bignumber(new BN(num2 * 10 ** 9).toString(10)).div(10 ** 9);

//   const result = Math.pow(num1Math, num2Math);

//   return result.toNumber();
// };

// export const ln = function (num) {
//   const numMath = Math.bignumber(new BN(num * 10 ** 9).toString(10)).div(10 ** 9);

//   const result = Math.log(numMath);

//   return result.toNumber();
// };

// ////////////////////////////////////////////////////////////////////////////////

// function absDiffInPercent(num1, num2) {
//   return absDiff(num1, num2).div(new BN(num1)).mul(new BN(100));
// }

// function checkAbsDiff(num1, num2, maxDiffInPercentage) {
//   const diff = absDiff(num1, num2);
//   return diff.mul(new BN(100).div(new BN(num1))).lte(new BN(maxDiffInPercentage * 100));
// }

// function absDiff(num1, num2) {
//   const bigNum1 = new BN(num1);
//   const bigNum2 = new BN(num2);

//   if (bigNum1.gt(bigNum2)) {
//     return bigNum1.sub(bigNum2);
//   } else {
//     return bigNum2.sub(bigNum1);
//   }
// }

// export const assertAbsDiff = function (val1, val2, expectedDiffInPct, errorStr) {
//   val1 = val1.toString();
//   val2 = val2.toString();
//   assert(
//     checkAbsDiff(val1, val2, expectedDiffInPct),
//     errorStr +
//       ' first val is ' +
//       val1 +
//       ' second val is ' +
//       val2 +
//       ' result diff is ' +
//       absDiff(val1, val2).toString(10) +
//       ' actual result diff in percents is ' +
//       absDiffInPercent(val1, val2).toString(10)
//   );
// };

// function assertEqual(val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.equals(new BN(val2)), errorStr);
// }

// export const assertEqual = assertEqual;

// function assertApproximate(val1, val2, errorStr) {
//   if (new BN(val2).lt(new BN(10).pow(new BN(12)))) assertEqual(val1, val2, errorStr);
//   else {
//     if (new BN(val1).gt(new BN(val2))) assert(new BN(val1).sub(new BN(val2)).lt(new BN(1000)), errorStr);
//     else assert(new BN(val2).sub(new BN(val1)).lt(new BN(1000)), errorStr);
//   }
// }

// export const assertEqualArray = assertEqualArray;
// function assertEqualArray(arr1, arr2, errorStr) {
//   assert(arr1.equals(arr2), `${errorStr} actual=${arr1} expected=${arr2}`);
// }

// export const assertTxSuccess = (tx) => {
//   expect(tx.receipt.status).to.equal(true);
// };

// export const assertTxSuccess = (tx) => {
//   expect(tx.receipt.status).to.equal(true);
// };

// // Warn if overriding existing method
// if (Array.prototype.equals)
//   console.warn(
//     "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
//   );

// // attach the .equals method to Array's prototype to call it on any array
// Array.prototype.equals = function (array) {
//   // if the other array is a falsy value, return
//   if (!array) return false;

//   // compare lengths - can save a lot of time
//   if (this.length != array.length) return false;

//   for (var i = 0, l = this.length; i < l; i++) {
//     // Check if we have nested arrays
//     if (this[i] instanceof Array && array[i] instanceof Array) {
//       // recurse into the nested arrays
//       if (!this[i].equals(array[i])) return false;
//     } else if (web3.utils.isBN(this[i]) && web3.utils.isBN(array[i])) {
//       if (!this[i].eq(array[i])) return false;
//     } else if (this[i] != array[i]) {
//       // Warning - two different object instances will never be equal: {x:20} != {x:20}
//       return false;
//     }
//   }
//   return true;
// };
// // Hide method from for-in loops
// Object.defineProperty(Array.prototype, 'equals', {enumerable: false});

// export const assertApproximate = assertApproximate;

// export const assertGreater = function (val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.greaterThan(new BN(val2)), errorStr);
// };

// export const assertGreaterOrEqual = function (val1, val2) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.least(new BN(val2)));
// };

// export const assertLessOrEqual = function (val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.most(new BN(val2)), errorStr);
// };

// export const assertLesser = function (val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.lessThan(new BN(val2)), errorStr);
// };

// export const assertGreater = function (val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.greaterThan(new BN(val2)), errorStr);
// };

// export const assertLesser = function (val1, val2, errorStr) {
//   assert(new BN(val1).should.be.a.bignumber.that.is.lessThan(new BN(val2)), errorStr);
// };

// export const addBps = function (rate, bps) {
//   return new BN(rate).mul(new BN(10000 + bps)).div(new BN(10000));
// };

// export const calcSrcQty = function (dstQty, srcDecimals, dstDecimals, rate) {
//   //source quantity is rounded up. to avoid dest quantity being too low.
//   dstQty = new BN(dstQty);
//   srcDecimals = new BN(srcDecimals);
//   dstDecimals = new BN(dstDecimals);
//   rate = new BN(rate);

//   let numerator;
//   let denominator;
//   let precisionUnits = new BN(10).pow(new BN(18));
//   if (srcDecimals.gte(dstDecimals)) {
//     numerator = precisionUnits.mul(dstQty).mul(new BN(10).pow(new BN(srcDecimals.sub(dstDecimals))));
//     denominator = new BN(rate);
//   } else {
//     numerator = precisionUnits.mul(dstQty);
//     denominator = new BN(rate).mul(new BN(10).pow(new BN(dstDecimals.sub(srcDecimals))));
//   }
//   return numerator.add(denominator).sub(new BN(1)).div(denominator);
// };

// export const calcDstQty = function (srcQty, srcDecimals, dstDecimals, rate) {
//   srcQty = new BN(srcQty);
//   srcDecimals = new BN(srcDecimals);
//   dstDecimals = new BN(dstDecimals);
//   rate = new BN(rate);

//   let precisionUnits = new BN(10).pow(new BN(18));
//   let result;

//   if (dstDecimals.gte(srcDecimals)) {
//     result = srcQty
//       .mul(rate)
//       .mul(new BN(10).pow(new BN(dstDecimals.sub(srcDecimals))))
//       .div(precisionUnits);
//   } else {
//     result = srcQty.mul(rate).div(precisionUnits.mul(new BN(10).pow(new BN(srcDecimals.sub(dstDecimals)))));
//   }
//   return result;
// };

// export const assertSameEtherBalance = async function (accountAddress, expectedBalance) {
//   let balance = await getBalancePromise(accountAddress);
//   assertEqual(balance, expectedBalance, 'wrong ether balance');
// };

// export const assertSameTokenBalance = async function (accountAddress, token, expectedBalance) {
//   let balance = await token.balanceOf(accountAddress);
//   assertEqual(balance, expectedBalance, 'wrong token balance');
// };

// export const calcRateFromQty = function (srcQty, dstQty, srcDecimals, dstDecimals) {
//   let decimals;
//   dstDecimals = new BN(dstDecimals);

//   if (dstDecimals.gte(new BN(srcDecimals))) {
//     decimals = new BN(10).pow(new BN(dstDecimals - srcDecimals));
//     return precisionUnits.mul(new BN(dstQty)).div(decimals.mul(new BN(srcQty)));
//   } else {
//     decimals = new BN(10).pow(new BN(srcDecimals - dstDecimals));
//     return precisionUnits.mul(new BN(dstQty)).mul(decimals).div(new BN(srcQty));
//   }
// };

// export const getRandomInt = function (min, max) {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };

// export const increaseBlockNumber = async function (blocks) {
//   for (let id = 0; id < blocks; id++) {
//     await time.advanceBlock();
//   }
// };

// export const increaseBlockNumberTo = async function (newBlock) {
//   await time.advanceBlockTo(newBlock);
// };

// export const txAfterBlocks = async function (blocks, txFunc) {
//   await export const increaseBlockNumber(blocks);
//   await txFunc();
// };

// export const txAtBlock = async function (block, txFunc) {
//   await export const increaseBlockNumberTo(block - 1);
//   await txFunc();
// };

// export const increaseNextBlockTimestamp = async function (duration) {
//   currentChainTime = await export const getCurrentBlockTime();
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send.bind(web3.currentProvider)(
//       {
//         jsonrpc: '2.0',
//         method: 'evm_setNextBlockTimestamp',
//         params: [currentChainTime + duration],
//         id: new Date().getTime(),
//       },
//       (err, res) => {
//         if (err) {
//           return reject(err);
//         }
//         console.log(`next block timestamp will be: ${currentChainTime + duration}`);
//         resolve(res);
//       }
//     );
//   });
// };

// export const setNextBlockTimestamp = async function (timestamp) {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send.bind(web3.currentProvider)(
//       {
//         jsonrpc: '2.0',
//         method: 'evm_setNextBlockTimestamp',
//         params: [timestamp],
//         id: new Date().getTime(),
//       },
//       (err, res) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(res);
//       }
//     );
//   });
// };

// export const txAtTime = async function (timestamp, txFunc) {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send.bind(web3.currentProvider)(
//       {
//         jsonrpc: '2.0',
//         method: 'evm_setNextBlockTimestamp',
//         params: [timestamp],
//         id: new Date().getTime(),
//       },
//       (err, res) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(txFunc());
//       }
//     );
//   });
// };

// export const mineNewBlockAt = async function (timestamp) {
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send.bind(web3.currentProvider)(
//       {
//         jsonrpc: '2.0',
//         method: 'evm_mine',
//         params: [timestamp],
//         id: new Date().getTime(),
//       },
//       (err, res) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(res);
//       }
//     );
//   });
// };

// export const mineNewBlockAfter = async function (duration) {
//   currentChainTime = await export const getCurrentBlockTime();
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.send.bind(web3.currentProvider)(
//       {
//         jsonrpc: '2.0',
//         method: 'evm_mine',
//         params: [currentChainTime + duration],
//         id: new Date().getTime(),
//       },
//       (err, res) => {
//         if (err) {
//           return reject(err);
//         }
//         console.log(`mined new block at: ${currentChainTime + duration}`);
//         resolve(res);
//       }
//     );
//   });
// };

// export const buildHint = function (tradeType) {
//   if (tradeType == 'SPLIT') {
//     return (tradeType, reserveIds, splits) => {
//       let sortedReserveIds = [];
//       let sortedSplits = [];

//       reserveIds
//         .map(function (v, i) {
//           return {
//             id: v,
//             split: splits[i],
//           };
//         })
//         .sort(function (a, b) {
//           return a.id < b.id ? -1 : a.id === b.id ? 0 : 1;
//         })
//         .forEach(function (v, i) {
//           sortedReserveIds[i] = v.id;
//           if (v.split) sortedSplits[i] = v.split;
//         });

//       return web3.eth.abi.encodeParameters(
//         ['uint8', 'bytes32[]', 'uint[]'],
//         [tradeType, sortedReserveIds, sortedSplits]
//       );
//     };
//   } else {
//     return (tradeType, reserveIds, splits) => {
//       return web3.eth.abi.encodeParameters(['uint8', 'bytes32[]', 'uint[]'], [tradeType, reserveIds, splits]);
//     };
//   }
// };

// export const buildHintT2T = function (
//   t2eType,
//   t2eOpcode,
//   t2eReserveIds,
//   t2eSplits,
//   e2tType,
//   e2tOpcode,
//   e2tReserveIds,
//   e2tSplits
// ) {
//   const t2eHint = this.buildHint(t2eType)(t2eOpcode, t2eReserveIds, t2eSplits);
//   const e2tHint = this.buildHint(e2tType)(e2tOpcode, e2tReserveIds, e2tSplits);

//   return web3.eth.abi.encodeParameters(['bytes', 'bytes'], [t2eHint, e2tHint]);
// };

// export const zeroNetworkBalance = async function (network, tokens, admin) {
//   let balance = await getBalancePromise(network.address);

//   if (balance.gt(zeroBN)) {
//     await network.withdrawEther(balance, admin, {from: admin});
//   }

//   for (let i = 0; i < tokens.length; i++) {
//     balance = await tokens[i].balanceOf(network.address);

//     if (balance.gt(zeroBN)) {
//       await network.withdrawToken(tokens[i].address, balance, admin, {from: admin});
//     }
//   }
// };
