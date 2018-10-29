import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';
import eutil from 'ethereumjs-util';

const LinniaHub = artifacts.require('./LinniaHub.sol');
const LinniaUsers = artifacts.require('./LinniaUsers');
const LinniaRecords = artifacts.require('./LinniaRecords.sol');
const LinniaPolicies = artifacts.require('./LinniaPolicies.sol');
const Policy = artifacts.require('./mock/PolicyMock.sol');

const testDataContent = '{"foo":"bar","baz":42}';
const testDataHash = eutil.bufferToHex(eutil.sha3(testDataContent));
const testDataUri = 'QmUMqi1rr4Ad1eZ3ctsRUEmqK2U3CyZqpetUe51LB9GiAM';
const testMetadata = 'KEYWORDS';

contract('LinniaPolicies', accounts => {
  let hub;
  let records;
  let policies;
  let policy;

  before('set up a LinniaHub contract', async () => {
    hub = await LinniaHub.new();
    records = await LinniaRecords.new(hub.address);
    await hub.setRecordsContract(records.address);
  });

  before('set up users contract and registers user', async () => {
    const users = await LinniaUsers.new(hub.address);
    await hub.setUsersContract(users.address);
    await users.register();
  });

  before('add a record', async () => {
    await records.addRecord(testDataHash, testMetadata, testDataUri, { from: accounts[0] });
  });

  beforeEach('new policies contract', async () => {
    policies = await LinniaPolicies.new(hub.address);
    await hub.setPoliciesContract(policies.address);
  });

  beforeEach('deploy a new polic', async () => {
    policy = await Policy.new();
  });

  describe('followsExistingPolicies', () => {
    it('should return true if new permission conforms to record policies', async () => {
      await policies.addPolicyToRecord(testDataHash, policy.address);
      const doesConform = await policies.followsExistingPolicies(
        testDataHash,
        accounts[0],
        testDataUri
      );
      assert(doesConform);
    });
    it('should revert if it doesnt follow existing policies', async () => {
      await policies.addPolicyToRecord(testDataHash, policy.address);
      await policy.setVal(false);
      assertRevert(policies.followsExistingPolicies(
        testDataHash,
        accounts[0],
        testDataUri
      ));
    });
  });
  describe('policiesAreValid', () => {
    it('should return true is policy is valid', async () => {
      assert(await policies.policyIsValid(
        testDataHash,
        accounts[0],
        testDataUri,
        [policy.address]
      ));
    });
    it('should revert if not conforming', async () => {
      await policy.setVal(false);
      assertRevert(policies.policyIsValid(
        testDataHash,
        accounts[0],
        testDataUri,
        [policy.address]
      ));
    });
  });
  describe('policyIsValid', () => {
    it('should return true is policy is valid', async () => {
      assert(await policies.policyIsValid(
        testDataHash,
        accounts[0],
        testDataUri,
        policy.address
      ));
    });
    it('should emit an event saying that the record/permission is valid', async () => {
      const tx = await policies.policyIsValid(
        testDataHash,
        accounts[0],
        testDataUri,
        policy.address
      );

      assert.equal(tx.logs[0].event, 'LinniaPolicyChecked');
    });
    it('should revert if not conforming', async () => {
      await policy.setVal(false);
      assertRevert(policies.policyIsValid(
        testDataHash,
        accounts[0],
        testDataUri,
        policy.address
      ));
    });
  });
  describe('addPolicyToRecord', () => {
    it('should allow a user to add a policy to her record', async () => {
      await policies.addPolicyToRecord(testDataHash, policy.address);
      const recordPolicies = await policies.policiesForRecord(testDataHash);
      assert.equal(policy.address, recordPolicies[0]);
    });
    it('should not allow a user to add a policy to someone elses record', async () => {
      assertRevert(policies.addPolicyToRecord(testDataHash, policy.address, { from: accounts[2] }));
    });
    it('should not let a user add a non conforming policy to record', async () => {
      await policy.setVal(false);
      assertRevert(policies.addPolicyToRecord(testDataHash, policy.address));
      const recordPolicies = await policies.policiesForRecord(testDataHash);
      assert.equal(recordPolicies.length, 0);
    });
  });
  describe('removePolicyFromRecord', () => {
    it('should remove a policy from a record you own', async () => {
      await policies.addPolicyToRecord(testDataHash, policy.address);
      await policies.removePolicyFromRecord(testDataHash, policy.address);
      const recordPolicies = await policies.policiesForRecord(testDataHash);
      assert.equal(recordPolicies.length, 0);
    });
    it('should not let a non owner remove a policy', async () => {
      await policies.addPolicyToRecord(testDataHash, policy.address);
      assertRevert(policies.addPolicyToRecord(testDataHash, policy.address, { from: accounts[1] }));
    });
  });
});
