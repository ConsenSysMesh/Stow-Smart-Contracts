import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const StowHub = artifacts.require('./StowHub.sol');
const StowUsers = artifacts.require('./StowUsers.sol');

contract('StowUsers', accounts => {
  let hub;
  let instance;
  before('set up a StowHub contract', async () => {
    hub = await StowHub.new();
  });
  beforeEach('deploy a new StowUsers contract', async () => {
    instance = await StowUsers.new(hub.address);
    await hub.setUsersContract(instance.address);
  });
  describe('constructor', () => {
    it('should set the deployer as admin', async () => {
      const newInstance = await StowUsers.new(hub.address);
      assert.equal(await newInstance.owner(), accounts[0]);
    });
    it('should set hub address correctly', async () => {
      const newInstance = await StowUsers.new(hub.address);
      assert.equal(await newInstance.hub(), hub.address);
    });
  });
  describe('change admin', () => {
    it('should allow admin to change admin', async () => {
      const newInstance = await StowUsers.new(hub.address);
      await newInstance.transferOwnership(accounts[1], { from: accounts[0] });
      assert.equal(await newInstance.owner(), accounts[1]);
    });
    it('should not allow non admin to change admin', async () => {
      const newInstance = await StowUsers.new(hub.address);
      await assertRevert(
        newInstance.transferOwnership(accounts[1], {
          from: accounts[1]
        })
      );
    });
  });
  describe('register', () => {
    it('should allow user to self register', async () => {
      const tx = await instance.register({ from: accounts[1] });
      assert.equal(tx.logs[0].event, 'StowUserRegistered');
      assert.equal(tx.logs[0].args.user, accounts[1]);

      const storedUser = await instance.users(accounts[1]);
      assert.equal(storedUser[0], true);
      assert.equal(storedUser[1], tx.receipt.blockNumber);
      assert.equal(storedUser[2], 0);
    });
    it('should not allow a user to self register as twice', async () => {
      const tx = await instance.register({ from: accounts[1] });
      assert.equal(tx.logs[0].args.user, accounts[1]);
      await assertRevert(instance.register({ from: accounts[1] }));
    });
  });
  describe('set provenance', () => {
    it('should allow admin to set provenance of a user', async () => {
      // register a user first
      await instance.register({ from: accounts[1] });
      // set provenance
      const tx = await instance.setProvenance(accounts[1], 42, {
        from: accounts[0]
      });
      // check logs
      assert.equal(tx.logs[0].event, 'StowProvenanceChanged');
      assert.equal(tx.logs[0].args.user, accounts[1]);
      assert.equal(tx.logs[0].args.provenance, 42);
      // check state
      assert.equal((await instance.users(accounts[1]))[2], 42);
    });
    it('should not allow non admin to change provenance', async () => {
      await instance.register({ from: accounts[1] });
      await assertRevert(
        instance.setProvenance(accounts[1], 42, { from: accounts[1] })
      );
    });
    it(
      'should not allow admin to change provenance of nonexistent provider',
      async () => {
        await assertRevert(instance.setProvenance(accounts[1], 42));
      }
    );
  });
  describe('is user', () => {
    it('should return true if user is registered', async () => {
      await instance.register({ from: accounts[1] });
      assert.equal(await instance.isUser(accounts[1]), true);
    });
    it('should return false if user is not registered', async () => {
      assert.equal(await instance.isUser(accounts[1]), false);
    });
  });
  describe('provenance score', () => {
    it('should return the provenance score of a user', async () => {
      await instance.register({ from: accounts[1] });
      await instance.setProvenance(accounts[1], 42, { from: accounts[0] });
      assert.equal((await instance.provenanceOf(accounts[1])).toString(), '42');
    });
    it('should return 0 if user isn\'t registered', async () => {
      assert.equal(await instance.provenanceOf(accounts[1]), 0);
    });
  });
  describe('pausable', () => {
    it('should not allow non-admin to pause or unpause', async () => {
      await assertRevert(instance.pause({ from: accounts[1] }));
      await assertRevert(instance.unpause({ from: accounts[1] }));
    });
    it('should not allow register of users when paused by admin', async () => {
      const tx = await instance.pause();
      assert.equal(await instance.isUser(accounts[1]), false);
      assert.equal(tx.logs[0].event, 'Pause');
      await assertRevert(instance.register({ from: accounts[1] }));
      const tx2 = await instance.unpause();
      assert.equal(tx2.logs[0].event, 'Unpause');
      const tx3 = await instance.register({ from: accounts[1] });
      assert.equal(tx3.logs[0].event, 'StowUserRegistered');
    });
  });
  // copy paste from records contract
  describe('destructible', () => {
    it('should not allow non-admin to destroy', async () => {
      await assertRevert(instance.destroy({ from: accounts[1] }));
    });
    it('should allow admin to destroy', async () => {
      const admin = accounts[0];
      assert.notEqual(web3.eth.getCode(instance.address), '0x0');
      const tx = await instance.destroy({ from: admin });
      assert.equal(tx.logs.length, 0, `did not expect logs but got ${tx.logs}`);
      assert.equal(web3.eth.getCode(instance.address), '0x0');
    });
    it('should allow admin to destroyAndSend', async () => {
      const admin = accounts[0];
      assert.notEqual(web3.eth.getCode(instance.address), '0x0');
      const tx = await instance.destroyAndSend(admin, { from: admin });
      assert.equal(tx.logs.length, 0, `did not expect logs but got ${tx.logs}`);
      assert.equal(web3.eth.getCode(instance.address), '0x0');
      assert.equal(web3.eth.getBalance(instance.address).toNumber(), 0);
    });
  });
});
