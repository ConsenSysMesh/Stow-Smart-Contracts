const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaHTH = artifacts.require("./LinniaHTH.sol")

const bs58 = require("bs58")
const crypto = require("crypto")
const eutil = require("ethereumjs-util")
const multihashes = require("multihashes")

import expectThrow from "zeppelin-solidity/test/helpers/expectThrow"

// assume this is the ipfs hash of the encrypted file
const testFileContent = `{foo:"bar",baz:42}`
const testFileHash = eutil.bufferToHex(eutil.sha3(testFileContent))
const testIpfsHash = eutil.bufferToHex(
  multihashes.decode(
    bs58.decode(
      "QmXJdGeZyk8Ae7L9Ca2aLo6qGCX49tC3nnPuyahXDUCUzy")).digest)

contract("LinniaRecords", (accounts) => {
  const admin = accounts[0]
  const patient = accounts[1]
  const doctor1 = accounts[2]
  const doctor2 = accounts[3]
  const nonUser = accounts[4]
  let hub
  let instance

  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  before("set up a LinniaRoles contract", async () => {
    const rolesInstance = await LinniaRoles.new(hub.address)
    await hub.setRolesContract(rolesInstance.address)
    rolesInstance.registerPatient({ from: patient })
    rolesInstance.registerDoctor(doctor1, { from: accounts[0] })
    rolesInstance.registerDoctor(doctor2, { from: accounts[0] })
  })
  beforeEach("deploy a new LinniaHTH contract", async () => {
    // HTH isn't reusable in the test, we must deploy a new one per test
    const hthInstance = await LinniaHTH.new(hub.address)
    await hub.setHTHContract(hthInstance.address)
  })
  beforeEach("deploy a new LinniaRecords contract", async () => {
    instance = await LinniaRecords.new(hub.address)
    await hub.setRecordsContract(instance.address)
  })
  describe("constructor", () => {
    it("should set hub address correctly", async () => {
      const instance = await LinniaRecords.new(hub.address)
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
  describe("add record by patient", () => {
    it("should allow a patient to add a record", async () => {
      const tx = await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].event, "RecordAdded")
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.patient, patient)
      const timestamp = web3.eth.getBlock(tx.receipt.blockNumber)
        .timestamp
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], 0) // sig count
      assert.equal(storedRecord[2], 1) // record type
      assert.equal(storedRecord[3], testIpfsHash)
      assert.equal(storedRecord[4], timestamp)
      assert.equal(await instance.ipfsRecords(testIpfsHash), testFileHash)
    })
    it("should now allow patient to add same record twice", async () => {
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      // try submitting the file again
      await expectThrow(
        instance.addRecordByPatient(testFileHash, 2,
          testIpfsHash, { from: patient })
      )
    })
    it("should not allow non-patients to call", async () => {
      await expectThrow(
        instance.addRecordByPatient(testFileHash, 1,
          testIpfsHash, { from: nonUser })
      )
    })
    it("should reject if hash is zero or record type is zero", async () => {
      // try zero record type
      await expectThrow(
        instance.addRecordByPatient(testFileHash, 0,
          testIpfsHash, { from: patient })
      )
      // try zero file hash
      await expectThrow(
        instance.addRecordByPatient(0, 1,
          testIpfsHash, { from: patient })
      )
      // try zero ipfs hash
      await expectThrow(
        instance.addRecordByPatient(0, 1,
          0, { from: patient })
      )
    })
  })
  describe("add record by doctor", () => {
    it("should allow a doctor to add a record", async () => {
      const tx = await instance.addRecordByDoctor(testFileHash, patient, 1,
        testIpfsHash, { from: doctor1 })
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, "RecordAdded")
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.patient, patient)
      assert.equal(tx.logs[1].event, "RecordSigAdded")
      assert.equal(tx.logs[1].args.fileHash, testFileHash)
      assert.equal(tx.logs[1].args.doctor, doctor1)
      const timestamp = web3.eth.getBlock(tx.receipt.blockNumber)
        .timestamp
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], 1) // sig count
      assert.equal(storedRecord[2], 1) // record type
      assert.equal(storedRecord[3], testIpfsHash)
      assert.equal(storedRecord[4], timestamp)
      assert.equal(await instance.ipfsRecords(testIpfsHash), testFileHash)
      assert.equal(await instance.sigExists(testFileHash, doctor1),
        true)
    })
    it("should now allow doctor to add a record twice", async () => {
      await instance.addRecordByDoctor(testFileHash, patient, 1,
        testIpfsHash, { from: doctor1 })
      await expectThrow(
        instance.addRecordByDoctor(testFileHash,
          patient, 2, testIpfsHash, { from: doctor1 })
      )
    })
    it("should not allow doctor to add a record for non-patient", async () => {
      await expectThrow(
        instance.addRecordByDoctor(testFileHash, doctor2, 2,
          testIpfsHash, { from: doctor1 })
      )
    })
    it("should not allow non-doctor to call", async () => {
      await expectThrow(
        instance.addRecordByDoctor(testFileHash, patient, 1,
          testIpfsHash, { from: patient })
      )
    })
    it("should increment HTH score if HTH is set", async () => {
      const hthInstance = LinniaHTH.at(await hub.hthContract())
      const prevScore = await hthInstance.score(patient)
      const tx = await instance.addRecordByDoctor(testFileHash,
        patient, 1, testIpfsHash, { from: doctor1 })
      assert.equal((await hthInstance.score(patient)).toString(),
        prevScore.add(1).toString())
    })
  })
  describe("add signature", () => {
    it("should allow adding valid signature", async () => {
      // add a file without any sig
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      // have doctor1 sign it
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      const tx = await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s),
        rsv.v, { from: nonUser })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.doctor, doctor1)
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[1], 1) // sig count
      assert.equal(await instance.sigExists(testFileHash, doctor1),
        true)
    })
    it("should not allow adding the same sig twice", async () => {
      // add a file without any sig
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      // have doctor1 sign it
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s),
        rsv.v, { from: nonUser })
      await expectThrow(
        instance.addSig(testFileHash,
          eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s),
          rsv.v, { from: nonUser })
      )
    })
    it("should increment HTH score if HTH is set", async () => {
      const hthInstance = LinniaHTH.at(await hub.hthContract())
      const prevScore = await hthInstance.score(patient)
      // add a file without any sig
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      // have doctor1 sign it
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s),
        rsv.v, { from: nonUser })
      assert.equal((await hthInstance.score(patient)).toString(),
        prevScore.add(1).toString())
    })
    it("should allow adding multiple signatures", async () => {
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      // have doctor1 sign it
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv.r), eutil.bufferToHex(rsv.s),
        rsv.v, { from: nonUser })
      // have doctor2 sign it
      const rsv2 = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash))
      await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv2.r), eutil.bufferToHex(rsv2.s),
        rsv2.v, { from: nonUser })
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[1], 2) // sig count
      assert.equal(await instance.sigExists(testFileHash, doctor1),
        true)
      assert.equal(await instance.sigExists(testFileHash, doctor2),
        true)
    })
    it("should allow adding another sig after doctor added file", async () => {
      await instance.addRecordByDoctor(testFileHash, patient, 1,
        testIpfsHash, { from: doctor1 })
      // now have doctor2 sign it
      const rsv2 = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash))
      const tx = await instance.addSig(testFileHash,
        eutil.bufferToHex(rsv2.r), eutil.bufferToHex(rsv2.s),
        rsv2.v, { from: nonUser })
      assert.equal(tx.logs[0].event, "RecordSigAdded")
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.doctor, doctor2)
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[1], 2) // sig count
      assert.equal(await instance.sigExists(testFileHash, doctor1),
        true)
      assert.equal(await instance.sigExists(testFileHash, doctor2),
        true)
    })
    it("should reject bad signatures", async () => {
      await instance.addRecordByPatient(testFileHash, 1,
        testIpfsHash, { from: patient })
      const rsv = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash))
      // flip S and V
      await expectThrow(
        instance.addSig(testFileHash,
          eutil.bufferToHex(rsv.s), eutil.bufferToHex(rsv.v),
          rsv.v, { from: nonUser })
      )
    })
  })
  describe("add record by admin", () => {
    it("should allow admin to add a record without doctor sig", async () => {
      const tx = await instance.addRecordByAdmin(testFileHash,
        patient, 0,
        1, testIpfsHash, { from: admin })
      assert.equal(tx.logs.length, 1)
      assert.equal(tx.logs[0].event, "RecordAdded")
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.patient, patient)
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], 0) // sig count
      assert.equal(storedRecord[2], 1) // record type
      assert.equal(storedRecord[3], testIpfsHash)
      assert.equal(await instance.ipfsRecords(testIpfsHash), testFileHash)
    })
    it("should allow admin to add a record with doctor sig", async () => {
      const tx = await instance.addRecordByAdmin(testFileHash,
        patient, doctor1,
        1, testIpfsHash, { from: admin })
      assert.equal(tx.logs.length, 2)
      assert.equal(tx.logs[0].event, "RecordAdded")
      assert.equal(tx.logs[0].args.fileHash, testFileHash)
      assert.equal(tx.logs[0].args.patient, patient)
      assert.equal(tx.logs[1].event, "RecordSigAdded")
      assert.equal(tx.logs[1].args.fileHash, testFileHash)
      assert.equal(tx.logs[1].args.doctor, doctor1)
      // check state
      const storedRecord = await instance.records(testFileHash)
      assert.equal(storedRecord[0], patient)
      assert.equal(storedRecord[1], 1) // sig count
      assert.equal(storedRecord[2], 1) // record type
      assert.equal(storedRecord[3], testIpfsHash)
      assert.equal(await instance.ipfsRecords(testIpfsHash), testFileHash)
      assert.equal(await instance.sigExists(testFileHash, doctor1),
        true)
    })
    it("should not allow non admin to call", async () => {
      await expectThrow(
        instance.addRecordByAdmin(testFileHash,
          patient, doctor1,
          1, testIpfsHash, { from: doctor1 })
      )
    })
    it("should increment HTH score if HTH is set", async () => {
      const hthInstance = LinniaHTH.at(await hub.hthContract())
      const prevScore = await hthInstance.score(patient)
      const tx = await instance.addRecordByAdmin(testFileHash,
        patient, doctor1,
        1, testIpfsHash, { from: admin })
      assert.equal((await hthInstance.score(patient)).toString(),
        prevScore.add(1).toString())
    })
  })
})
