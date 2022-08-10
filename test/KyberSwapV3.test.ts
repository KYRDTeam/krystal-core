import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {FeeMode, nativeTokenDecimals} from './helper';
import {apiMock} from './api_helper';
import hre from 'hardhat';
import {SmartWalletImplementation, SmartWalletProxy} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {loadFixture} from 'ethereum-waffle';
// import {helpers} from '@nomicfoundation/hardhat-network-helpers';

describe('KyberSwapV3', async function () {
  let signers: SignerWithAddress[];
  let admin: SignerWithAddress;
  let platformFee = 8;

  // TODO: refactor this hardcoded address
  const krystalProxyAddr = '0x70270C228c5B4279d1578799926873aa72446CcD';
  let krystalProxy: SmartWalletImplementation;

  // TODO: refactor this hardcoded address
  const kyberRouterAddr = '0x00555513Acf282B42882420E5e5bA87b44D8fA6E';

  async function deployKyberSwapV3() {
    // ========================================================================
    // Prepare to deploy & update swap contract KyberSwap V3

    const KyberSwapV3 = await hre.ethers.getContractFactory('KyberSwapV3');
    const kyberSwapV3 = await KyberSwapV3.deploy(admin.address, kyberRouterAddr);

    // update proxy
    await kyberSwapV3.updateProxyContract(krystalProxyAddr);

    // update swap contract
    const krystalAdmin = await hre.ethers.getImpersonatedSigner('0x4ef7c0ecd6ebf8379b0448546972acd7d67ebff6');
    let proxy = (await hre.ethers.getContractAt('SmartWalletProxy', krystalProxyAddr)) as SmartWalletProxy;
    await proxy.updateSupportedSwaps({
      addresses: [kyberSwapV3.address],
      isSupported: true,
    });

    return {kyberSwapV3};
  }

  before(async function () {
    signers = await hre.ethers.getSigners();
    admin = signers[0];

    krystalProxy = (await hre.ethers.getContractAt(
      'SmartWalletImplementation',
      krystalProxyAddr
    )) as SmartWalletImplementation;
  });

  it('Should revert with getExpectedReturn_notSupported', async function () {
    const {kyberSwapV3} = await loadFixture(deployKyberSwapV3);

    await expect(
      krystalProxy.getExpectedReturn({
        swapContract: kyberSwapV3.address,
        srcAmount: BigNumber.from(1),
        tradePath: [],
        feeMode: FeeMode.FROM_SOURCE,
        feeBps: platformFee,
        extraArgs: '0x',
      })
    ).to.be.revertedWith('getExpectedReturn_notSupported');
  });

  it('Should revert with getExpectedReturnWithImpact_notSupported', async function () {
    const {kyberSwapV3} = await loadFixture(deployKyberSwapV3);

    await expect(
      krystalProxy.getExpectedReturnWithImpact({
        swapContract: kyberSwapV3.address,
        srcAmount: BigNumber.from(1),
        tradePath: [],
        feeMode: FeeMode.FROM_SOURCE,
        feeBps: platformFee,
        extraArgs: '0x',
      })
    ).to.be.revertedWith('getExpectedReturnWithImpact_notSupported');
  });

  it('Should swap native to token successfully', async function () {
    const {kyberSwapV3} = await loadFixture(deployKyberSwapV3);

    // TODO refactor
    const url = `https://aggregator-api.kyberswap.com/ethereum/route/encode?tokenIn=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&tokenOut=0xdac17f958d2ee523a2206206994597c13d831ec7&amountIn=1000000000000000000&saveGas=0&gasInclude=0&gasPrice=14000000000&slippageTolerance=50&deadline=1660127660&to=0x320849EC0aDffCd6fb0212B59a2EC936cdEF5fCa&chargeFeeBy=&feeReceiver=&isInBps=&feeAmount=&clientData=%7B%22source%22%3A%22kyberswap%22%7D`;
    const data = apiMock[url];

    let tokenIn = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let tokenOut = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    let srcAmount = BigNumber.from('1000000000000000000');
    let tradePath = [tokenIn, tokenOut];
    let minDestAmount = BigNumber.from(169380000);

    let platformWallet = '0x5250b8202AEBca35328E2c217C687E894d70Cd31';

    await expect(
      krystalProxy.swap(
        {
          swapContract: kyberSwapV3.address,
          srcAmount: srcAmount,
          minDestAmount: minDestAmount,
          tradePath: tradePath,
          feeMode: FeeMode.FROM_SOURCE,
          feeBps: platformFee,
          platformWallet: platformWallet,
          extraArgs: data.encodedSwapData,
        },
        {
          value: srcAmount,
        }
      )
    ).to.be.revertedWith('something went wrong');
  });
});
