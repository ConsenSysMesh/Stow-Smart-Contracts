import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const StowHub = artifacts.require('./StowHub.sol');
const StowUsers = artifacts.require('./StowUsers.sol');
const Whitelist = artifacts.require('./WhitelistMock.sol');

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

contract('MockWhitelist', accounts => {
  let hub;
  let users;
  let instance;
  const expertScore = 3;
  const nonOwner = accounts[5];
  const expertUser1 = accounts[1];

  before('set up a StowHub contract', async () => {
    hub = await StowHub.new();
  });
  beforeEach('deploy a new StowUsers contract', async () => {
    users = await StowUsers.new(hub.address);
    await hub.setUsersContract(users.address);
  });
  beforeEach('deploy a new Whitelist contract', async () => {
    instance = await Whitelist.new();
  });
  describe('adding and getting', () => {
    it('should not allow non owner to add expert', async () => {
      await assertRevert(
        instance.updateScore(expertUser1, expertScore, { from: nonOwner })
      );
    });
    it('owner should set score of expert', async () => {
      const tx = await instance.updateScore(expertUser1, expertScore);
      const score = await instance.expertScores.call(expertUser1);
      // check state
      assert.equal(score, expertScore);
      // check logs
      assert.equal(tx.logs[0].event, 'LogExpertScoreUpdated');
      assert.equal(tx.logs[0].args.user, expertUser1);
      assert.equal(tx.logs[0].args.score, expertScore);
    });
    it('should get the scores from whitelist function', async () => {
      await instance.updateScore(expertUser1, expertScore);
      const score = await instance.expertScoreOf.call(expertUser1);
      assert.equal(score, expertScore);
    });
  });
  describe('set expert score function', () => {
    it('should not allow non owner to add expert score', async () => {
      await instance.updateScore(expertUser1, expertScore);
      await users.register({ from: expertUser1 });
      await assertRevert(users.setExpertScore(instance.address, expertUser1, { from: nonOwner }));
    });
    it('should not allow score of non user to be updated', async () => {
      await instance.updateScore(expertUser1, expertScore);
      await assertRevert(users.setExpertScore(instance.address, expertUser1));
    });
    it('should allow score of user to be updated', async () => {
      await instance.updateScore(expertUser1, expertScore);
      await users.register({ from: expertUser1 });
      const tx = await users.setExpertScore(instance.address, expertUser1);
      // check state
      assert.equal((await users.users(expertUser1))[2], expertScore);
      // check logs
      assert.equal(tx.logs[1].event, 'StowWhitelistScoreAdded');
      assert.equal(tx.logs[1].args.whitelist, instance.address);
      assert.equal(tx.logs[0].event, 'StowProvenanceChanged');
      assert.equal(tx.logs[0].args.user, expertUser1);
      assert.equal(tx.logs[0].args.provenance, expertScore);
    });
  });
});
