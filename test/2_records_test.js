const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")

const bs58 = require("bs58")
const eutil = require("ethereumjs-util")
const multihashes = require("multihashes")
const helper = require("./helper")

// assume this is the ipfs hash of the encrypted file
const testFileContent = `{foo:"bar",baz:42}`;
const testFileHash = eutil.bufferToHex(eutil.sha3(testFileContent));
const testIpfsHash = "QmXJdGeZyk8Ae7L9Ca2aLo6qGCX49tC3nnPuyahXDUCUzy";
const testIpfsHashDecoded = eutil.bufferToHex(
  multihashes.decode(bs58.decode(testIpfsHash)).digest)

contract('LinniaRecords', (accounts) => {
  const patient = accounts[1];
  const doctor1 = accounts[2];
  const doctor2 = accounts[3];
  let rolesInstance;

  before("set up LinniaRoles contract", async () => {
    rolesInstance = await LinniaRoles.new()
    rolesInstance.registerPatient({ from: patient })
    rolesInstance.registerDoctor(doctor1, { from: accounts[0] })
    rolesInstance.registerDoctor(doctor2, { from: accounts[0] })
  });
  describe("constructor", () => {
    it("should set LinniaRoles contract address correctly", async () => {
      const instance = await LinniaRecords.new(rolesInstance.address,
        accounts[0], { from: accounts[0] })
      const storedRolesAddress = await instance.rolesContract()
      assert.equal(storedRolesAddress, rolesInstance.address)
    })
  })
  describe("upload record", () => {
    let instance
    beforeEach("deploy a new LinniaRecords contract", async () => {
      instance = await LinniaRecords.new(rolesInstance.address,
        accounts[0], { from: accounts[0] })
    })
    it("should allow a doctor to upload a patient record", async () => {
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx = await instance.uploadRecord(testFileHash, patient, 1,
        testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s), rsv.v,
        { from: doctor1 })
      assert.equal(tx.logs[0].args.patient, patient)
      assert.equal(tx.logs[0].args.doctor, doctor1)
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      const storedRecord = await instance.records(testFileHash);
      assert.equal(storedRecord[0], patient);
      assert.equal(storedRecord[1], doctor1);
      assert.equal(storedRecord[2], 1);
      assert.equal(storedRecord[3], testIpfsHashDecoded);
      assert.equal(storedRecord[4], eutil.bufferToHex(rsv.r));
      assert.equal(storedRecord[5], eutil.bufferToHex(rsv.s));
      assert.equal(storedRecord[6], rsv.v);
    })
    it("should reject if the sig rsv of the file is invalid", async () => {
      // the file is signed by doctor2
      // we will try submitting the file as doctor1
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash))
      try {
        await instance.uploadRecord(testFileHash, patient, 1,
          testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s), rsv.v,
          { from: doctor1 })
        assert.fail("file sig is invalid, but is not rejected")
      } catch (err) {
        // ok
        helper.assertRevert(err)
      }
    })
  })
});
