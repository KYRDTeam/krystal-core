import {evm_revert} from './helper';
import {getInitialSetup, IInitialSetup} from './setup';
import {ethers} from 'hardhat';

describe('config test', async () => {
  let setup: IInitialSetup;

  before(async () => {
    setup = await getInitialSetup();
  });

  beforeEach(async () => {
    // await evm_revert(setup.postSetupSnapshotId);
  });

  it('tokens should exist', async () => {
    for (let {address} of setup.network.tokens) {
      await ethers.getContractAt('IERC20Ext', address);
    }
  });
});
