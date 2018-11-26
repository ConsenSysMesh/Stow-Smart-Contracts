import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const StowHub = artifacts.require('./StowHub.sol');

contract('StowHub', accounts => {
  let instance;
  beforeEach('deploy a new StowHub contract', async () => {
    instance = await StowHub.new();
  });

  describe('constructor', () => {
    it('should set admin correctly', async () => {
      const newInstance = await StowHub.new();
      assert.equal(await newInstance.owner(), accounts[0]);
    });
    it('should initialize users, records addresss to zero', async () => {
      assert.equal(await instance.usersContract(), 0);
      assert.equal(await instance.recordsContract(), 0);
    });
  });
  describe('set users contract', () => {
    it('should allow admin to set Users address', async () => {
      const tx = await instance.setUsersContract(42);
      assert.equal(tx.logs[0].event, 'StowUsersContractSet');
      assert.equal(tx.logs[0].args.from, 0);
      assert.equal(tx.logs[0].args.to, 42);
      assert.equal(await instance.usersContract(), 42);
    });
    it('should not allow non-admin to set Users address', async () => {
      await assertRevert(instance.setUsersContract(42, { from: accounts[1] }));
    });
  });
  describe('set Records contract', () => {
    it('should allow admin to set Records address', async () => {
      const tx = await instance.setRecordsContract(42);
      assert.equal(tx.logs[0].event, 'StowRecordsContractSet');
      assert.equal(tx.logs[0].args.from, 0);
      assert.equal(tx.logs[0].args.to, 42);
      assert.equal(await instance.recordsContract(), 42);
    });
    it('should not allow non-admin to set Records address', async () => {
      await assertRevert(
        instance.setRecordsContract(42, { from: accounts[1] })
      );
    });
  });
  describe('set Permissions contract', () => {
    it('should allow admin to set Permissions address', async () => {
      const tx = await instance.setPermissionsContract(42);
      assert.equal(tx.logs[0].event, 'StowPermissionsContractSet');
      assert.equal(tx.logs[0].args.from, 0);
      assert.equal(tx.logs[0].args.to, 42);
      assert.equal(await instance.permissionsContract(), 42);
    });
    it('should not allow non-admin to set Permissions address', async () => {
      await assertRevert(
        instance.setPermissionsContract(42, { from: accounts[1] })
      );
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
