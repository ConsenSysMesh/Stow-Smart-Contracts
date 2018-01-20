const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaHTH = artifacts.require("./LinniaHTH.sol")

const bs58 = require("bs58")
const crypto = require("crypto")
const eutil = require("ethereumjs-util")
const multihashes = require("multihashes")
const { assertRevert } = require("./helper")

// assume this is the ipfs hash of the encrypted file
const testFileContent = `{foo:"bar",baz:42}`
const testFileHash = eutil.bufferToHex(eutil.sha3(testFileContent))
const testIpfsHash = "QmXJdGeZyk8Ae7L9Ca2aLo6qGCX49tC3nnPuyahXDUCUzy"
const testIpfsHashDecoded = eutil.bufferToHex(
  multihashes.decode(bs58.decode(testIpfsHash)).digest)

contract("LinniaRecords", (accounts) => {
  const admin = accounts[0]
  const patient = accounts[1]
  const doctor1 = accounts[2]
  const doctor2 = accounts[3]
  let hub
  let instance

  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  before("set up a LinniaRoles contract", async () => {
    const rolesInstance = await LinniaRoles.new(hub.address, accounts[0])
    await hub.setRolesContract(rolesInstance.address)
    rolesInstance.registerPatient({ from: patient })
    rolesInstance.registerDoctor(doctor1, { from: accounts[0] })
    rolesInstance.registerDoctor(doctor2, { from: accounts[0] })
  })
  beforeEach("deploy a new LinniaHTH contract", async () => {
    // HTH isn't reusable in the test, we must deploy a new one per test
    const hthInstance = await LinniaHTH.new(hub.address, accounts[0])
    await hub.setHTHContract(hthInstance.address)
  })
  beforeEach("deploy a new LinniaRecords contract", async () => {
    instance = await LinniaRecords.new(hub.address,
      accounts[0], { from: accounts[0] })
    await hub.setRecordsContract(instance.address)
  })
  describe("constructor", () => {
    it("should set hub address correctly", async () => {
      const instance = await LinniaRecords.new(hub.address,
        accounts[0], { from: accounts[0] })
      assert.equal(await instance.hub(), hub.address)
    })
  })
  describe("recover", () => {
    it("should recover the signer address if sig is valid", async () => {
      const msgHash = eutil.bufferToHex(eutil.sha3(crypto.randomBytes(2000)))
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, msgHash))
      const recoveredAddr = await instance.recover(msgHash,
        eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s), rsv.v)
      assert.equal(recoveredAddr, doctor1)
    })
    it("should recover zero address if sig is bad", async () => {
      const msgHash = eutil.bufferToHex(eutil.sha3(crypto.randomBytes(2000)))
      const recoveredAddr = await instance.recover(msgHash,
        eutil.bufferToHex(new Buffer(64)),
        eutil.bufferToHex(new Buffer(64)), 27)
      assert.equal(recoveredAddr, 0)
    })
  })
  describe("upload record", () => {
    it("should allow a doctor to upload a patient record", async () => {
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx = await instance.uploadRecord(testFileHash, patient, 1,
        testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s), rsv.v,
        { from: doctor1 })
      assert.equal(tx.logs[0].args.patient, patient)
      assert.equal(tx.logs[0].args.doctor, doctor1)
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], doctor1)
      assert.equal(storedRecord[2], 1)
      assert.equal(storedRecord[3], testIpfsHashDecoded)
      assert.equal(storedRecord[4], eutil.bufferToHex(rsv.r))
      assert.equal(storedRecord[5], eutil.bufferToHex(rsv.s))
      assert.equal(storedRecord[6], rsv.v)
      const storedFileHash = await instance.ipfsRecords(testIpfsHashDecoded)
      assert.equal(storedFileHash, testFileHash)
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
        assertRevert(err)
      }
    })
    it("should not allow doctor to upload same file twice", async () => {
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      await instance.uploadRecord(testFileHash, patient, 1,
        testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s), rsv.v,
        { from: doctor1 })
      try {
        await instance.uploadRecord(testFileHash, patient, 1,
          testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s), rsv.v,
          { from: doctor1 })
      } catch (err) {
        // ok
        assertRevert(err);
      }
    })
    it("should increment HTH score if HTH is set", async () => {
      const hthInstance = LinniaHTH.at(await hub.hthContract())
      const prevScore = await hthInstance.score(patient)
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx = await instance.uploadRecord(testFileHash, patient, 1,
        testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s), rsv.v,
        { from: doctor1 })
      assert.equal((await hthInstance.score(patient)).toString(),
        prevScore.add(1).toString())
    })
  })
  describe("update record by admin", () => {
    it("should allow admin to upload a record", async () => {
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx = await instance.updateRecordByAdmin(testFileHash, patient,
        doctor1, 1, testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
        eutil.bufferToHex(rsv.s), rsv.v,
        { from: admin })
      assert.equal(tx.logs[0].args.patient, patient)
      assert.equal(tx.logs[0].args.doctor, doctor1)
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], doctor1)
      assert.equal(storedRecord[2], 1)
      assert.equal(storedRecord[3], testIpfsHashDecoded)
      assert.equal(storedRecord[4], eutil.bufferToHex(rsv.r))
      assert.equal(storedRecord[5], eutil.bufferToHex(rsv.s))
      assert.equal(storedRecord[6], rsv.v)
      const storedFileHash = await instance.ipfsRecords(testIpfsHashDecoded)
      assert.equal(storedFileHash, testFileHash)
    })
    it("should not allow non-admin to upload a record", async () => {
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      try {
        await instance.updateRecordByAdmin(testFileHash, patient, doctor1, 1,
          testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s), rsv.v,
          { from: doctor1 })
      } catch (err) {
        // ok
        assertRevert(err)
      }
    })
    it("should not allow admin to upload a record with bad sig", async () => {
      // file is signed by doctor2
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash))
      try {
        // we upload the file claiming it's signed by doctor1
        await instance.updateRecordByAdmin(testFileHash, patient, doctor1, 1,
          testIpfsHashDecoded, eutil.bufferToHex(rsv.r),
          eutil.bufferToHex(rsv.s), rsv.v,
          { from: doctor1 })
      } catch (err) {
        // ok
        assertRevert(err)
      }
    })
    it("should allow admin to update an existing record", async () => {
      const rsv1 = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx1 = await instance.updateRecordByAdmin(testFileHash, patient,
        doctor1, 1, testIpfsHashDecoded, eutil.bufferToHex(rsv1.r),
        eutil.bufferToHex(rsv1.s), rsv1.v,
        { from: admin })
      assert.equal(tx1.logs[0].args.patient, patient)
      assert.equal(tx1.logs[0].args.doctor, doctor1)
      assert.equal(tx1.logs[0].args.fileHash, testFileHash)
      // update the record with sig from doctor2
      const rsv2 = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash))
      const tx2 = await instance.updateRecordByAdmin(testFileHash, patient,
        doctor2, 1, testIpfsHashDecoded, eutil.bufferToHex(rsv2.r),
        eutil.bufferToHex(rsv2.s), rsv2.v,
        { from: admin })
      assert.equal(tx2.logs[0].args.patient, patient)
      assert.equal(tx2.logs[0].args.doctor, doctor2)
      assert.equal(tx2.logs[0].args.fileHash, testFileHash)
    })
  })
})
