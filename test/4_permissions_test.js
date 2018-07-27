import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const LinniaHub = artifacts.require('./LinniaHub.sol');
const LinniaUsers = artifacts.require('./LinniaUsers.sol');
const LinniaRecords = artifacts.require('./LinniaRecords.sol');
const LinniaPermissions = artifacts.require('./LinniaPermissions.sol');

const crypto = require('crypto');
const eutil = require('ethereumjs-util');

const testDataContent1 = '{"foo":"bar","baz":42}';
const testDataContent2 = '{"asdf":42}';
const testDataHash1 = eutil.bufferToHex(eutil.sha3(testDataContent1));
const testDataHash2 = eutil.bufferToHex(eutil.sha3(testDataContent2));
const testDataUri1 = 'QmUMqi1rr4Ad1eZ3ctsRUEmqK2U3CyZqpetUe51LB9GiAM';
const testDataUri2 = 'QmUoCHEZqSuYhr9fV1c2b4gLASG2hPpC2moQXQ6qzy697d';
const testMetadata = 'KEYWORDS';

contract('LinniaPermissions', accounts => {
  const admin = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const provider1 = accounts[3];
  const provider2 = accounts[4];
  let hub;
  let instance;

  before('set up a LinniaHub contract', async () => {
    hub = await LinniaHub.new();
  });
  before('set up a LinniaUsers contract', async () => {
    const usersInstance = await LinniaUsers.new(hub.address);
    await hub.setUsersContract(usersInstance.address);
    usersInstance.register({ from: user1 });
    usersInstance.register({ from: user2 });
    usersInstance.register({ from: provider1 });
    usersInstance.register({ from: provider2 });
    usersInstance.setProvenance(provider1, 1, { from: admin });
    usersInstance.setProvenance(provider2, 1, { from: admin });
  });
  before('set up a LinniaRecords contract', async () => {
    const recordsInstance = await LinniaRecords.new(hub.address);
    await hub.setRecordsContract(recordsInstance.address);
    // upload 2 records, one for user1 and one for user2
    // 1st one is not attested, 2nd one is attested by provider1
    await recordsInstance.addRecord(testDataHash1, testMetadata, testDataUri1, {
      from: user1
    });
    await recordsInstance.addRecordByProvider(
      testDataHash2,
      user2,
      testMetadata,
      testDataUri2,
      { from: provider1 }
    );
  });
  beforeEach('deploy a new LinniaPermissions contract', async () => {
    instance = await LinniaPermissions.new(hub.address, { from: accounts[0] });
    await hub.setPermissionsContract(instance.address);
  });

  describe('constructor', () => {
    it('should set hub address correctly', async () => {
      const newInstance = await LinniaRecords.new(hub.address, {
        from: accounts[0]
      });
      assert.equal(await newInstance.hub(), hub.address);
    });
  });
  describe('grant access', () => {
    it('should allow user to grant access to their data', async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      const tx = await instance.grantAccess(
        testDataHash1,
        provider2,
        fakeIpfsHash,
        { from: user1 }
      );
      assert.equal(tx.logs[0].event, 'LinniaAccessGranted');
      assert.equal(tx.logs[0].args.dataHash, testDataHash1);
      assert.equal(tx.logs[0].args.owner, user1);
      assert.equal(tx.logs[0].args.viewer, provider2);
      const perm = await instance.permissions(testDataHash1, provider2);
      assert.equal(perm[0], true);
      assert.equal(perm[1], fakeIpfsHash);
    });
    it('should not allow non-owner to grant access', async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      await assertRevert(
        instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
          from: provider1
        })
      );
      await assertRevert(
        instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
          from: provider2
        })
      );
      await assertRevert(
        instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
          from: user2
        })
      );
    });
    it('should reject if viewer or data uri is zero', async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      await assertRevert(
        instance.grantAccess(testDataHash1, 0, fakeIpfsHash, { from: user1 })
      );
      await assertRevert(
        instance.grantAccess(testDataHash1, provider2, 0, { from: user1 })
      );
    });
    // TODO, This is disabled for testing purposes
    // it(
    //   'should not allow sharing same record twice with same user',
    //   async () => {
    //     const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
    //     await instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
    //       from: user1
    //     });
    //     await assertRevert(
    //       instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
    //         from: user1
    //       })
    //     );
    //   }
    // );
  });
  describe('revoke access', () => {
    beforeEach('grant provider2 to access user1\'s record1', async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      await instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
        from: user1
      });
    });
    it('should allow owner to revoke access to their data', async () => {
      const tx = await instance.revokeAccess(testDataHash1, provider2, {
        from: user1
      });
      assert.equal(tx.logs[0].event, 'LinniaAccessRevoked');
      assert.equal(tx.logs[0].args.dataHash, testDataHash1);
      assert.equal(tx.logs[0].args.owner, user1);
      assert.equal(tx.logs[0].args.viewer, provider2);
      const perm = await instance.permissions(testDataHash1, provider2);
      assert.equal(perm[0], false);
      assert.equal(perm[1], '');
    });
    it('should not allow non-owner to revoke access to data', async () => {
      await assertRevert(
        instance.revokeAccess(testDataHash1, provider2, { from: provider1 })
      );
      await assertRevert(
        instance.revokeAccess(testDataHash1, provider2, { from: provider2 })
      );
      await assertRevert(
        instance.revokeAccess(testDataHash1, provider2, { from: user2 })
      );
    });
  });
  describe('check access', () => {
    it('should check access to data', async () => {
      assert.equal(await instance.checkAccess(testDataHash1, provider2, {
        from: user1
      }), false);
      // grant provider2 to access user1\'s record1
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      await instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
        from: user1
      });
      assert.equal(await instance.checkAccess(testDataHash1, provider2, {
        from: user1
      }), true);
    });
  });
  describe('pausable', () => {
    it('should not allow non-admin to pause or unpause', async () => {
      await assertRevert(instance.pause({ from: accounts[1] }));
      await assertRevert(instance.unpause({ from: accounts[1] }));
    });
    it('should not allow sharing records when paused by admin', async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32));
      const tx = await instance.pause();
      assert.equal(tx.logs[0].event, 'Pause');
      await assertRevert(
        instance.grantAccess(testDataHash1, provider2, fakeIpfsHash, {
          from: user1
        })
      );
      const tx2 = await instance.unpause();
      assert.equal(tx2.logs[0].event, 'Unpause');
      const tx3 = await instance.grantAccess(
        testDataHash1,
        provider2,
        fakeIpfsHash,
        { from: user1 }
      );
      assert.equal(tx3.logs[0].event, 'LinniaAccessGranted');
    });
  });
  // copy paste from records contract
  describe('destructible', () => {
    it('should not allow non-admin to destroy', async () => {
      await assertRevert(instance.destroy({ from: accounts[1] }));
    });
    it('should allow admin to destroy', async () => {
      assert.notEqual(web3.eth.getCode(instance.address), '0x0');
      const tx = await instance.destroy({ from: admin });
      assert.equal(tx.logs.length, 0, `did not expect logs but got ${tx.logs}`);
      assert.equal(web3.eth.getCode(instance.address), '0x0');
    });
    it('should allow admin to destroyAndSend', async () => {
      assert.notEqual(web3.eth.getCode(instance.address), '0x0');
      const tx = await instance.destroyAndSend(admin, { from: admin });
      assert.equal(tx.logs.length, 0, `did not expect logs but got ${tx.logs}`);
      assert.equal(web3.eth.getCode(instance.address), '0x0');
      assert.equal(web3.eth.getBalance(instance.address).toNumber(), 0);
    });
  });
});
