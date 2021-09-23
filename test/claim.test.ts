import {nativeTokenAddress, evm_revert, evm_snapshot, getOpenzeppelinDefaultAdmin} from './helper';
import {networkSetting} from './setup';
import {BigNumber} from 'ethers';
import {assert, expect} from 'chai';
import {KrystalClaimImpl} from '../typechain';
import {ethers} from 'hardhat';
import {deployClaimContract, KrystalContracts} from '../scripts/deployLogic';

describe('claim test', async () => {
  let contracts: KrystalContracts;

  let proxyAdmin: string;
  let contractAdmin: string;
  let proxyInstance: KrystalClaimImpl;
  let postSetupSnapshotId: any;

  before(async () => {
    console.log('\n\n\n=== Setting initial claim contracts ===');
    contracts = await deployClaimContract(0, {}, (await ethers.getSigners())[0].address);

    proxyInstance = (await ethers.getContractAt(
      'KrystalClaimImpl',
      contracts!.krystalClaim!.address
    )) as KrystalClaimImpl;

    proxyAdmin = networkSetting.proxyAdminMultisig ?? (await ethers.getSigners())[0].address;
    contractAdmin = networkSetting.adminMultisig ?? (await ethers.getSigners())[0].address;

    postSetupSnapshotId = await evm_snapshot();
  });

  beforeEach(async () => {
    await evm_revert(postSetupSnapshotId);
    postSetupSnapshotId = await evm_snapshot();
  });

  it('setup config correctly', async () => {
    assert(!!contracts.krystalClaim, 'claim not set');

    let onchainAdmin = await getOpenzeppelinDefaultAdmin(ethers.provider, contracts.krystalClaim!.address);
    assert(
      onchainAdmin.toLowerCase() === proxyAdmin.toLowerCase(),
      `claim: wrong proxy admin ${JSON.stringify({onchainAdmin, proxyAdmin})}`
    );
    assert((await proxyInstance.paused()) === false, 'wrong paused');

    let verifier = ethers.Wallet.createRandom();
    await proxyInstance.setVerifier(verifier.address);
    expect((await proxyInstance.verifier()) === verifier.address, 'verifier not set');
  });

  it('permission works correctly', async () => {
    let stranger = (await ethers.getSigners())[19];

    await expect(proxyInstance.connect(stranger).pause()).to.be.revertedWith('unauthorized: admin required');
    await expect(proxyInstance.connect(stranger).setVerifier(stranger.address)).to.be.revertedWith(
      'unauthorized: admin required'
    );
    await expect(
      proxyInstance.connect(stranger).setClaimCap(Object.values(networkSetting.tokens)[0].address, BigNumber.from(10))
    ).to.be.revertedWith('unauthorized: admin required');
  });

  it('claim works correctly', async () => {
    let verifier = ethers.Wallet.createRandom();
    await proxyInstance.setVerifier(verifier.address);

    let chainId = (await ethers.provider.getNetwork()).chainId;
    let recipient = ethers.Wallet.createRandom();
    let token = Object.values(networkSetting.tokens)[0];
    let claimAmount = BigNumber.from(10).pow(18);
    let claimId = BigNumber.from(1);

    // Claim unsupported token
    let msg = ethers.utils.solidityPack(
      ['uint256', 'address', 'uint256', 'address', 'uint256'],
      [0, recipient.address, claimId, token.address, claimAmount]
    );
    let sig = await verifier.signMessage(msg);
    await expect(proxyInstance.claim(recipient.address, claimId, token.address, claimAmount, sig)).to.be.revertedWith(
      'claim: amount too big'
    );

    // Wrong chain ID
    await proxyInstance.setClaimCap(token.address, claimAmount);
    msg = ethers.utils.solidityPack(
      ['uint256', 'address', 'uint256', 'address', 'uint256'],
      [0, recipient.address, claimId, token.address, claimAmount]
    );
    sig = await verifier.signMessage(ethers.utils.arrayify(msg));
    await expect(proxyInstance.claim(recipient.address, claimId, token.address, claimAmount, sig)).to.be.revertedWith(
      `verify: failed`
    );

    // No balance
    await proxyInstance.setClaimCap(token.address, claimAmount);
    msg = ethers.utils.solidityKeccak256(
      ['uint256', 'address', 'uint256', 'address', 'uint256'],
      [chainId, recipient.address, claimId, token.address, claimAmount]
    );
    sig = await verifier.signMessage(ethers.utils.arrayify(msg));
    await expect(proxyInstance.claim(recipient.address, claimId, token.address, claimAmount, sig)).to.be.revertedWith(
      `transfer amount exceeds balance`
    );

    // Claim Native
    let signer = (await ethers.getSigners())[0];
    await signer.sendTransaction({
      to: proxyInstance.address,
      value: claimAmount,
    });
    await proxyInstance.setClaimCap(nativeTokenAddress, claimAmount);
    msg = ethers.utils.solidityKeccak256(
      ['uint256', 'address', 'uint256', 'address', 'uint256'],
      [chainId, recipient.address, claimId, nativeTokenAddress, claimAmount]
    );
    sig = await verifier.signMessage(ethers.utils.arrayify(msg));
    await expect(
      await proxyInstance.claim(recipient.address, claimId, nativeTokenAddress, claimAmount, sig)
    ).to.changeEtherBalances([proxyInstance], [BigNumber.from(0).sub(claimAmount)]);

    // Already claimed
    assert(await proxyInstance.claimed(claimId), 'wrong claim status');
    await expect(proxyInstance.claim(recipient.address, claimId, token.address, claimAmount, sig)).to.be.revertedWith(
      `claim: claimed`
    );
  });
});
