import {
  nativeTokenAddress,
  nativeTokenDecimals,
  BPS,
  evm_revert,
  FeeMode,
  EPS,
  evm_snapshot,
  getOpenzeppelinDefaultAdmin,
} from './helper';
import {getInitialSetup, IInitialSetup, networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {IDMMFactory, IDMMRouter, IERC20Ext, IUniswapV2Router02, KrystalClaimImpl} from '../typechain';
import {ethers} from 'hardhat';
import {arrayify, hexConcat, hexlify, zeroPad} from 'ethers/lib/utils';

describe('claim test', async () => {
  let setup: IInitialSetup;

  let proxyAdmin: string;
  let contractAdmin: string;
  let proxyInstance: KrystalClaimImpl;

  before(async () => {
    setup = await getInitialSetup();

    proxyInstance = (await ethers.getContractAt(
      'SmartWalletImplementation',
      setup.krystalContracts!.krystalClaim!.address
    )) as KrystalClaimImpl;

    proxyAdmin = networkSetting.proxyAdminMultisig ?? (await ethers.getSigners())[0].address;
    contractAdmin = networkSetting.adminMultisig ?? (await ethers.getSigners())[0].address;
  });

  beforeEach(async () => {
    await evm_revert(setup.postSetupSnapshotId);
    setup.postSetupSnapshotId = await evm_snapshot();
  });

  it('setup config correctly', async () => {
    assert(!!setup.krystalContracts.krystalClaim, 'claim: not set');
    assert(
      (await getOpenzeppelinDefaultAdmin(ethers.provider, setup.krystalContracts.krystalClaim!.address)) ===
        proxyAdmin,
      'claim: wrong proxy admin'
    );
    assert((await proxyInstance.paused()) === false, 'claim: wrong paused');

    let verifier = ethers.Wallet.createRandom();
    await proxyInstance.setVerifier(verifier.address);
    expect('setVerifier').to.be.calledOnContractWith(proxyInstance, [verifier.address]);
    expect((await proxyInstance.verifier()) === verifier.address, 'verifier not set');
  });

  it('claim works correctly', async () => {
    let verifier = ethers.Wallet.createRandom();
    await proxyInstance.setVerifier(verifier.address);
    expect('setVerifier').to.be.calledOnContractWith(proxyInstance, [verifier.address]);

    let chainId = (await ethers.provider.getNetwork()).chainId;
    let recipient = ethers.Wallet.createRandom();
    let token = networkSetting.tokens[0];
    let claimAmount = BigNumber.from(10000);
    let claimId = BigNumber.from(1);

    // Wrong chain
    let msg = ethers.utils.solidityPack(
      ['uint256', 'address', 'uint256', 'address', 'uint256'],
      [0, recipient.address, claimId, token.address, claimAmount]
    );
    let sig = await verifier.signMessage(msg);
    await expect(proxyInstance.claim(recipient.address, claimId, token.address, claimAmount, sig)).to.be.revertedWith(
      'Insufficient funds'
    );
  });

  it('lending test should be initialized', async () => {});
});
