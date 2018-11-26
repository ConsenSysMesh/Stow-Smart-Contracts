import assertRevert from 'openzeppelin-solidity/test/helpers/assertRevert';

const StowHub = artifacts.require('./StowHub.sol');
const StowUsers = artifacts.require('./StowUsers.sol');
const StowRecords = artifacts.require('./StowRecords.sol');
const irisScoreProvider = artifacts.require('./mock/IrisScoreProviderMock.sol');

const crypto = require('crypto');
const eutil = require('ethereumjs-util');

let irisScoreProviderContractAddress;
let irisScoreProviderInstance;

const testDataContent = '{"foo":"bar","baz":42}';
const testDataHash = eutil.bufferToHex(eutil.sha3(testDataContent));
const testDataUri = 'QmUMqi1rr4Ad1eZ3ctsRUEmqK2U3CyZqpetUe51LB9GiAM';
const testMetadata = 'KEYWORDS';
const testMetaHash = eutil.bufferToHex(eutil.sha3(testMetadata));
const testRootHash = eutil.bufferToHex(
  eutil.sha3(
    Buffer.concat([eutil.sha3(testDataContent), eutil.sha3(testMetadata)])
  )
);

contract('StowRecords', accounts => {
  const admin = accounts[0];
  const user = accounts[1];
  const provider1 = accounts[2];
  const provider2 = accounts[3];
  const nonUser = accounts[4];
  let hub;
  let instance;

  before('set up a StowHub contract', async () => {
    hub = await StowHub.new();
  });
  before('set up a StowUsers contract', async () => {
    const usersInstance = await StowUsers.new(hub.address);
    await hub.setUsersContract(usersInstance.address);
    usersInstance.register({ from: user });
    usersInstance.register({ from: provider1 });
    usersInstance.register({ from: provider2 });
    usersInstance.setProvenance(provider1, 1);
    usersInstance.setProvenance(provider2, 2);
  });
  beforeEach('deploy a new StowRecords contract', async () => {
    instance = await StowRecords.new(hub.address);
    await hub.setRecordsContract(instance.address);
  });
  describe('constructor', () => {
    it('should set hub address correctly', async () => {
      const newInstance = await StowRecords.new(hub.address);
      assert.equal(await newInstance.hub(), hub.address);
    });
  });
  describe('recover', () => {
    it('should recover the signer address if sig is valid', async () => {
      const msgHash = eutil.bufferToHex(eutil.sha3(crypto.randomBytes(2000)));
      const rsv = eutil.fromRpcSig(web3.eth.sign(provider1, msgHash));
      const recoveredAddr = await instance.recover(
        msgHash,
        eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s),
        rsv.v
      );
      assert.equal(recoveredAddr, provider1);
    });
    it('should recover zero address if sig is bad', async () => {
      const msgHash = eutil.bufferToHex(eutil.sha3(crypto.randomBytes(2000)));
      const recoveredAddr = await instance.recover(
        msgHash,
        eutil.bufferToHex(Buffer.from(new Uint32Array(64))),
        eutil.bufferToHex(Buffer.from(new Uint32Array(64))),
        27
      );
      assert.equal(recoveredAddr, 0);
    });
  });
  describe('add record by user', () => {
    it('should allow a user to add a record', async () => {
      const tx = await instance.addRecord(
        testDataHash,
        testMetadata,
        testDataUri,
        { from: user }
      );
      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, 'StowRecordAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.owner, user);
      assert.equal(tx.logs[0].args.metadata, testMetadata);
      const { timestamp } = web3.eth.getBlock(tx.receipt.blockNumber);
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[0], user);
      assert.equal(storedRecord[1], testMetaHash);
      assert.equal(storedRecord[2], 0); // sig count
      assert.equal(storedRecord[3], 0); // iris score
      assert.equal(storedRecord[4], testDataUri);
      assert.equal(storedRecord[5], timestamp);
    });
    it('should not allow user to add same record twice', async () => {
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // try submitting the file again
      await assertRevert(
        instance.addRecord(testDataHash, testMetadata, testDataUri, {
          from: user
        })
      );
    });
    it('should not allow non-users to call', async () => {
      await assertRevert(
        instance.addRecord(testDataHash, testMetadata, testDataUri, {
          from: nonUser
        })
      );
    });
    it('should reject if data hash or data uri is zero', async () => {
      // try zero data hash
      await assertRevert(
        instance.addRecord(0, testMetadata, testDataUri, {
          from: user
        })
      );
      // try zero data uri
      await assertRevert(
        instance.addRecord(testDataHash, testMetadata, 0, {
          from: user
        })
      );
    });
    it('should allow a long dataUri', async () => {
      const testLongDataUri = eutil.bufferToHex(
        'https://www.centralService.com/cloud/storage/v1/b/example-bucket/o/foo%2f%3fbar'
      );
      const tx = await instance.addRecord(
        testDataHash,
        testMetadata,
        testLongDataUri,
        { from: user }
      );
      assert.equal(tx.logs.length, 1);
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[4], testLongDataUri);
    });
  });
  describe('add record by provider', () => {
    it('should allow a provider to add a record', async () => {
      const tx = await instance.addRecordByProvider(
        testDataHash,
        user,
        testMetadata,
        testDataUri,
        { from: provider1 }
      );
      assert.equal(tx.logs.length, 2);
      assert.equal(tx.logs[0].event, 'StowRecordAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.owner, user);
      assert.equal(tx.logs[0].args.metadata, testMetadata);
      assert.equal(tx.logs[1].event, 'StowRecordSigAdded');
      assert.equal(tx.logs[1].args.dataHash, testDataHash);
      assert.equal(tx.logs[1].args.attester, provider1);
      assert.equal(tx.logs[1].args.irisScore, 1);
      const { timestamp } = web3.eth.getBlock(tx.receipt.blockNumber);
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[0], user);
      assert.equal(storedRecord[1], testMetaHash);
      assert.equal(storedRecord[2], 1); // sig count
      assert.equal(storedRecord[3], 1); // iris score
      assert.equal(storedRecord[4], testDataUri);
      assert.equal(storedRecord[5], timestamp);
      assert.equal(await instance.sigExists(testDataHash, provider1), true);
    });
    it('should not allow provider to add a record twice', async () => {
      await instance.addRecordByProvider(
        testDataHash,
        user,
        testMetadata,
        testDataUri,
        { from: provider1 }
      );
      await assertRevert(
        instance.addRecordByProvider(
          testDataHash,
          user,
          testMetadata,
          testDataUri,
          { from: provider1 }
        )
      );
    });
    it('should not allow provider to add a record for non-user', async () => {
      await assertRevert(
        instance.addRecordByProvider(
          testDataHash,
          nonUser,
          testMetadata,
          testDataUri,
          { from: provider1 }
        )
      );
    });
    it('should not allow non-provider to call', async () => {
      await assertRevert(
        instance.addRecordByProvider(
          testDataHash,
          user,
          testMetadata,
          testDataUri,
          { from: user }
        )
      );
    });
  });
  describe('add signature', () => {
    it('should allow adding valid signature', async () => {
      // add a file without any sig, by user
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // have provider1 sign the root hash
      const rsv = eutil.fromRpcSig(web3.eth.sign(provider1, testRootHash));
      // anyone should be able to submit the signature
      const tx = await instance.addSig(
        testDataHash,
        eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s),
        rsv.v,
        { from: nonUser }
      );
      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, 'StowRecordSigAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.attester, provider1);
      assert.equal(tx.logs[0].args.irisScore, 1);
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[2], 1); // sig count
      assert.equal(storedRecord[3], 1); // iris score
      assert.equal(await instance.sigExists(testDataHash, provider1), true);
    });
    it('should allow adding valid signature by provider', async () => {
      // add a file without any sig, by user
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // have provider1 sign it
      const tx = await instance.addSigByProvider(testDataHash, {
        from: provider1
      });
      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, 'StowRecordSigAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.attester, provider1);
      assert.equal(tx.logs[0].args.irisScore, 1);
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[2], 1); // sig count
      assert.equal(storedRecord[3], 1); // iris score
      assert.equal(await instance.sigExists(testDataHash, provider1), true);
    });
    it('should not allow adding the same sig twice', async () => {
      // add a file without any sig
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // have provider1 sign it
      const rsv = eutil.fromRpcSig(web3.eth.sign(provider1, testRootHash));
      await instance.addSig(
        testDataHash,
        eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s),
        rsv.v,
        { from: nonUser }
      );
      await assertRevert(
        instance.addSig(
          testDataHash,
          eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s),
          rsv.v,
          { from: nonUser }
        )
      );
    });
    it('should allow adding sigs from different providers', async () => {
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // have provider1 sign it
      const rsv1 = eutil.fromRpcSig(web3.eth.sign(provider1, testRootHash));
      const tx1 = await instance.addSig(
        testDataHash,
        eutil.bufferToHex(rsv1.r),
        eutil.bufferToHex(rsv1.s),
        rsv1.v,
        { from: nonUser }
      );
      // check log
      assert.equal(tx1.logs.length, 1);
      assert.equal(tx1.logs[0].event, 'StowRecordSigAdded');
      assert.equal(tx1.logs[0].args.dataHash, testDataHash);
      assert.equal(tx1.logs[0].args.attester, provider1);
      assert.equal(tx1.logs[0].args.irisScore, 1);
      // have provider2 sign it
      const rsv2 = eutil.fromRpcSig(web3.eth.sign(provider2, testRootHash));
      const tx2 = await instance.addSig(
        testDataHash,
        eutil.bufferToHex(rsv2.r),
        eutil.bufferToHex(rsv2.s),
        rsv2.v,
        { from: nonUser }
      );
      // check log
      assert.equal(tx2.logs.length, 1);
      assert.equal(tx2.logs[0].event, 'StowRecordSigAdded');
      assert.equal(tx2.logs[0].args.dataHash, testDataHash);
      assert.equal(tx2.logs[0].args.attester, provider2);
      assert.equal(tx2.logs[0].args.irisScore, 3); // iris should increment
      // check state
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[2], 2); // sig count
      assert.equal(storedRecord[3], 3); // iris score
      assert.equal(await instance.sigExists(testDataHash, provider1), true);
      assert.equal(await instance.sigExists(testDataHash, provider2), true);
    });
    it(
      'should allow adding another sig after provider added file',
      async () => {
        await instance.addRecordByProvider(
          testDataHash,
          user,
          testMetadata,
          testDataUri,
          { from: provider1 }
        );
        // now have provider2 sign it
        const rsv2 = eutil.fromRpcSig(web3.eth.sign(provider2, testRootHash));
        const tx = await instance.addSig(
          testDataHash,
          eutil.bufferToHex(rsv2.r),
          eutil.bufferToHex(rsv2.s),
          rsv2.v,
          { from: nonUser }
        );
        assert.equal(tx.logs[0].event, 'StowRecordSigAdded');
        assert.equal(tx.logs[0].args.dataHash, testDataHash);
        assert.equal(tx.logs[0].args.attester, provider2);
        assert.equal(tx.logs[0].args.irisScore, 3);
        // check state
        const storedRecord = await instance.records(testDataHash);
        assert.equal(storedRecord[2], 2); // sig count
        assert.equal(storedRecord[3], 3); // iris score
        assert.equal(await instance.sigExists(testDataHash, provider1), true);
        assert.equal(await instance.sigExists(testDataHash, provider2), true);
      }
    );
    it('should reject bad signatures', async () => {
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      const rsv = eutil.fromRpcSig(web3.eth.sign(provider1, testRootHash));
      // flip S and V
      await assertRevert(
        instance.addSig(
          testDataHash,
          eutil.bufferToHex(rsv.s),
          eutil.bufferToHex(rsv.v),
          rsv.v,
          { from: user }
        )
      );
    });
    it('should reject sig that doesn\'t cover metadata hash', async () => {
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // sign the data hash instead of root hash
      const rsv = eutil.fromRpcSig(web3.eth.sign(provider1, testDataHash));
      await assertRevert(
        instance.addSig(
          testDataHash,
          eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s),
          rsv.v,
          { from: user }
        )
      );
    });
  });
  describe('add record by admin', () => {
    it('should allow admin to add a record without attestation', async () => {
      const tx = await instance.addRecordByAdmin(
        testDataHash,
        user,
        0,
        testMetadata,
        testDataUri,
        { from: admin }
      );
      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, 'StowRecordAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.owner, user);
      assert.equal(tx.logs[0].args.metadata, testMetadata);
      // check state
      const { timestamp } = web3.eth.getBlock(tx.receipt.blockNumber);
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[0], user);
      assert.equal(storedRecord[1], testMetaHash);
      assert.equal(storedRecord[2], 0); // sig count
      assert.equal(storedRecord[3], 0); // iris score
      assert.equal(storedRecord[4], testDataUri);
      assert.equal(storedRecord[5], timestamp);
    });
    it('should allow admin to add a record with attestation', async () => {
      const tx = await instance.addRecordByAdmin(
        testDataHash,
        user,
        provider1,
        testMetadata,
        testDataUri,
        { from: admin }
      );
      assert.equal(tx.logs.length, 2);
      assert.equal(tx.logs[0].event, 'StowRecordAdded');
      assert.equal(tx.logs[0].args.dataHash, testDataHash);
      assert.equal(tx.logs[0].args.owner, user);
      assert.equal(tx.logs[0].args.metadata, testMetadata);
      assert.equal(tx.logs[1].event, 'StowRecordSigAdded');
      assert.equal(tx.logs[1].args.dataHash, testDataHash);
      assert.equal(tx.logs[1].args.attester, provider1);
      assert.equal(tx.logs[1].args.irisScore, 1);
      // check state
      const { timestamp } = web3.eth.getBlock(tx.receipt.blockNumber);
      const storedRecord = await instance.records(testDataHash);
      assert.equal(storedRecord[0], user);
      assert.equal(storedRecord[1], testMetaHash);
      assert.equal(storedRecord[2], 1); // sig count
      assert.equal(storedRecord[3], 1); // iris score
      assert.equal(storedRecord[4], testDataUri);
      assert.equal(storedRecord[5], timestamp);
      assert.equal(await instance.sigExists(testDataHash, provider1), true);
    });
    it('should not allow non admin to call', async () => {
      await assertRevert(
        instance.addRecordByAdmin(
          testDataHash,
          user,
          provider1,
          testMetadata,
          testDataUri,
          { from: provider1 }
        )
      );
      await assertRevert(
        instance.addRecordByAdmin(
          testDataHash,
          user,
          0,
          testMetadata,
          testDataUri,
          { from: provider1 }
        )
      );
    });
  });
  describe('updateIris', () => {
    before('set up a irisScoreProvider mock contract', async () => {
      irisScoreProviderInstance = await irisScoreProvider.new({from: admin});
      irisScoreProviderContractAddress = irisScoreProviderInstance.address;
    });
    it('update record is score with irisScoreProvider', async () => {
      await instance.addRecord(testDataHash, testMetadata, testDataUri, {from: user});
      const resultValue = await instance.updateIris.call(testDataHash, irisScoreProviderContractAddress);
      assert.equal(resultValue, 42);
    });
    it('should not allow datahash of zero', async () => {
      await assertRevert(instance.updateIris.call(0, irisScoreProviderContractAddress));
      await assertRevert(instance.updateIris(0, irisScoreProviderContractAddress));
    });
    it('should not allow address of zero', async () => {
      await assertRevert(instance.updateIris.call(testDataHash, 0));
      await assertRevert(instance.updateIris(testDataHash, 0));
    });
    it('should not allow irisScoreProvider to return zero or less', async () => {
      await irisScoreProviderInstance.setVal(0);
      await assertRevert(instance.updateIris(testDataHash, irisScoreProviderContractAddress));
      await irisScoreProviderInstance.setVal(42);
    });
    it('should not allow updating more than once with the same irisScoreProvider', async () => {
      const tx0 = await instance.addRecord(testDataHash, testMetadata, testDataUri, {
        from: user
      });
      // sometimes retuns 0x01 -- not sure why
      assert.equal(parseInt(tx0.receipt.status, 16), 1);
      const record0 = await instance.records(testDataHash);
      assert.equal(record0[2], '0');
      const score0 = await instance.getIrisProvidersReport.call(testDataHash, irisScoreProviderContractAddress);
      assert.equal(score0.toString(), '0');

      const tx = await instance.updateIris(testDataHash, irisScoreProviderContractAddress, {from: admin});
      assert.equal(tx.logs[0].event, 'StowUpdateRecordsIris');
      assert.equal(JSON.stringify(tx.logs[0].args),
        JSON.stringify({
          'dataHash':testDataHash,
          'irisProvidersAddress':irisScoreProviderContractAddress,
          'val':'42',
          'sender':admin
        }));
      const record = await instance.records(testDataHash);
      assert.equal(record[3], '42');

      const score = await instance.getIrisProvidersReport.call(testDataHash, irisScoreProviderContractAddress);
      assert.equal(score.toString(), '42');

      await assertRevert(instance.updateIris(testDataHash, irisScoreProviderContractAddress));
    });
  });
  describe('pausable', () => {
    it('should not allow non-admin to pause or unpause', async () => {
      await assertRevert(instance.pause({ from: accounts[1] }));
      await assertRevert(instance.unpause({ from: accounts[1] }));
    });
    it('should not allow adding records when paused by admin', async () => {
      const tx = await instance.pause();
      assert.equal(tx.logs[0].event, 'Pause');
      await assertRevert(
        instance.addRecord(testDataHash, testMetadata, testDataUri, {
          from: user
        })
      );
      const tx2 = await instance.unpause();
      assert.equal(tx2.logs[0].event, 'Unpause');
      const tx3 = await instance.addRecord(
        testDataHash,
        testMetadata,
        testDataUri,
        { from: user }
      );
      assert.equal(tx3.logs[0].event, 'StowRecordAdded');
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
