const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol")

const bs58 = require("bs58")
const crypto = require("crypto")
const eutil = require("ethereumjs-util")
const multihashes = require("multihashes")

import expectThrow from "zeppelin-solidity/test/helpers/expectThrow"

// assume this is the ipfs hash of the encrypted files
const testFileContent1 = `{foo:"bar",baz:42}`
const testFileContent2 = `{"asdf":42}`
const testFileHash1 = eutil.bufferToHex(eutil.sha3(testFileContent1))
const testFileHash2 = eutil.bufferToHex(eutil.sha3(testFileContent2))
const testIpfsHash1 = eutil.bufferToHex(
  multihashes.decode(
    bs58.decode("QmXJdGeZyk8Ae7L9Ca2aLo6qGCX49tC3nnPuyahXDUCUzy")).digest)
const testIpfsHash2 = eutil.bufferToHex(
  multihashes.decode(
    bs58.decode("QmUoCHEZqSuYhr9fV1c2b4gLASG2hPpC2moQXQ6qzy697d")).digest)

contract("LinniaPermissions", (accounts) => {
  const admin = accounts[0]
  const patient1 = accounts[1]
  const patient2 = accounts[2]
  const provider1 = accounts[3]
  const provider2 = accounts[4]
  let hub, instance

  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  before("set up a LinniaRoles contract", async () => {
    const rolesInstance = await LinniaRoles.new(hub.address)
    await hub.setRolesContract(rolesInstance.address)
    rolesInstance.registerPatient({ from: patient1 })
    rolesInstance.registerPatient({ from: patient2 })
    rolesInstance.registerProvider(provider1, { from: accounts[0] })
    rolesInstance.registerProvider(provider2, { from: accounts[0] })
  })
  before("set up a LinniaRecords contract", async () => {
    const recordsInstance = await LinniaRecords.new(hub.address)
    await hub.setRecordsContract(recordsInstance.address)
    // upload 2 records, one for patient1 and one for patient2
    await recordsInstance.addRecordByPatient(testFileHash1,
      1, testIpfsHash1, { from: patient1 })
    await recordsInstance.addRecordByProvider(testFileHash2,
      patient2, 2, testIpfsHash2, { from: provider2 })
  })
  beforeEach("deploy a new LinniaPermissions contract", async () => {
    instance = await LinniaPermissions.new(hub.address,
      { from: accounts[0] })
    await hub.setPermissionsContract(instance.address)
  })

  describe("constructor", () => {
    it("should set hub address correctly", async () => {
      const instance = await LinniaRecords.new(hub.address,
        { from: accounts[0] })
      assert.equal(await instance.hub(), hub.address)
    })
  })
  describe("grant access", () => {
    it("should allow patient to grant access to their files", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      const tx = await instance.grantAccess(testFileHash1, provider2,
        fakeIpfsHash, { from: patient1 })
      assert.equal(tx.logs[0].event, "LogAccessGranted")
      assert.equal(tx.logs[0].args.fileHash, testFileHash1)
      assert.equal(tx.logs[0].args.patient, patient1)
      assert.equal(tx.logs[0].args.viewer, provider2)
      const perm = await instance.permissions(testFileHash1, provider2)
      assert.equal(perm[0], true)
      assert.equal(perm[1], fakeIpfsHash)
    })
    it("should not allow non-patient to grant access", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      await expectThrow(
        instance.grantAccess(testFileHash1, provider2,
          fakeIpfsHash, { from: provider1 })
      )
    })
    it("should not allow patient to grant access to other patients files", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      await expectThrow(
        instance.grantAccess(testFileHash1, provider2,
          fakeIpfsHash, { from: patient2 })
      )
    })
  })
  describe("revoke access", () => {
    beforeEach("grant provider2 to access patient1's file1", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      await instance.grantAccess(testFileHash1, provider2,
        fakeIpfsHash, { from: patient1 })
    })
    it("should allow patient to revoke access to their files", async () => {
      const tx = await instance.revokeAccess(testFileHash1,
        provider2, { from: patient1 })
      assert.equal(tx.logs[0].event, "LogAccessRevoked")
      assert.equal(tx.logs[0].args.fileHash, testFileHash1)
      assert.equal(tx.logs[0].args.patient, patient1)
      assert.equal(tx.logs[0].args.viewer, provider2)
      const perm = await instance.permissions(testFileHash1, provider2)
      assert.equal(perm[0], false)
      assert.equal(perm[1], eutil.bufferToHex(eutil.zeros(32)))
    })
    it("should not allow non-patient to revoke access to files", async () => {
      await expectThrow(
        instance.revokeAccess(testFileHash1,
          provider2, { from: provider1 })
      )
    })
    it("should not allow patient to revoke other patients file", async () => {
      await expectThrow(
        instance.revokeAccess(testFileHash1,
          provider2, { from: patient2 })
      )
    })
  })
})
