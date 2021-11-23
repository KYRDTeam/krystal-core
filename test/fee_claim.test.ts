import {evm_revert, evm_snapshot} from './helper';
import {expect} from 'chai';
import {ethers} from 'hardhat';
import {
  SmartWalletImplementation,
  SmartWalletImplementation__factory,
  SmartWalletProxy,
  SmartWalletProxy__factory,
} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

describe('fee test', async () => {
  let admin: SignerWithAddress, deployer: SignerWithAddress, stranger: SignerWithAddress;
  let proxy: SmartWalletProxy;
  let implementation: SmartWalletImplementation, proxyInstance: SmartWalletImplementation;
  let postSetupSnapshotId: any;

  before(async () => {
    deployer = (await ethers.getSigners())[0];
    admin = (await ethers.getSigners())[1];
    stranger = (await ethers.getSigners())[2];

    implementation = await new SmartWalletImplementation__factory(deployer).deploy(admin.address);
    proxy = await new SmartWalletProxy__factory(deployer).deploy(admin.address, implementation.address, [], [], []);
    proxyInstance = await new SmartWalletImplementation__factory(deployer).attach(proxy.address);

    postSetupSnapshotId = await evm_snapshot();
  });

  beforeEach(async () => {
    await evm_revert(postSetupSnapshotId);
    postSetupSnapshotId = await evm_snapshot();
  });

  it('test fee claim', async () => {
    await expect(proxyInstance.adminClaimPlatformFees([], [])).to.be.revertedWith('only admin');
    await expect(proxyInstance.connect(admin).adminClaimPlatformFees([], [])).to.be.revertedWith(
      'require admin fee collector'
    );
    await proxyInstance.claimPlatformFee([]);
  });
});
