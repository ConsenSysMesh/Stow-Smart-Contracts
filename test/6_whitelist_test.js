import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const LinniaHub = artifacts.require('./LinniaHub.sol');
const LinniaUsers = artifacts.require('./LinniaUsers.sol');
const Whitelist = artifacts.require('./WhitelistMock.sol');

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

contract('Whitelist', accounts => {
  let hub;
  let users;
  let instance;
  const expertUser1 = accounts[1];

  before('set up a LinniaHub contract', async () => {
    hub = await LinniaHub.new();
  });
  beforeEach('deploy a new LinniaUsers contract', async () => {
    users = await LinniaUsers.new(hub.address);
    await hub.setUsersContract(users.address);
  });
  beforeEach('deploy a new Whitelist contract', async () => {
    instance = await Whitelist.new();
  });
  describe('adding and getting', () => {
    it('should not allow non owner to add expert', async () => {
      await assertRevert(
        instance.updateScore(expertUser1, 3, { from: accounts[5] })
      );
    });
    it('owner should set score of expert', async () => {
      const tx = await instance.updateScore(expertUser1, 3);
      const score = await instance.expertScores.call(expertUser1);
      // check state
      assert.equal(score, 3);
      // check logs
      assert.equal(tx.logs[0].event, 'LogExpertScoreUpdated');
      assert.equal(tx.logs[0].args.user, expertUser1);
      assert.equal(tx.logs[0].args.score, 3);
    });
    it('should get the scores from whitelist function', async () => {
      await instance.updateScore(expertUser1, 3);
      const score = await instance.expertScoreOf.call(expertUser1);
      assert.equal(score, 3);
    });
  });
  describe('set expert score function', () => {
    it('should not allow non owner to add expert score', async () => {
      await instance.updateScore(expertUser1, 3);
      await users.register({ from: expertUser1 });
      await assertRevert(users.setExpertScore(instance.address, expertUser1, { from: accounts[5] }));
    });
    it('should not allow score of non user to be updated', async () => {
      await instance.updateScore(expertUser1, 3);
      await assertRevert(users.setExpertScore(instance.address, expertUser1));
    });
    it('should not allow score of non user to be updated', async () => {
      await instance.updateScore(expertUser1, 3);
      await assertRevert(users.setExpertScore(instance.address, expertUser1));
    });
    it('should allow score of user to be updated', async () => {
      await instance.updateScore(expertUser1, 3);
      await users.register({ from: expertUser1 });
      const tx = await users.setExpertScore(instance.address, expertUser1);
      // check state
      assert.equal((await users.users(expertUser1))[2], 3);
      // check logs
      assert.equal(tx.logs[0].event, 'LinniaProvenanceChanged');
      assert.equal(tx.logs[0].args.user, expertUser1);
      assert.equal(tx.logs[0].args.provenance, 3);
    });
  });
});
