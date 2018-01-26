const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol")

const bs58 = require("bs58")
const crypto = require("crypto")
const eutil = require("ethereumjs-util")
const multihashes = require("multihashes")
const { assertRevert } = require("./helper")

// assume this is the ipfs hash of the encrypted files
const testFileContent1 = `{foo:"bar",baz:42}`
const testFileContent2 = `{"asdf":42}`
const testFileHash1 = eutil.bufferToHex(eutil.sha3(testFileContent1))
const testFileHash2 = eutil.bufferToHex(eutil.sha3(testFileContent2))
const testIpfsHash1 = "QmXJdGeZyk8Ae7L9Ca2aLo6qGCX49tC3nnPuyahXDUCUzy"
const testIpfsHash2 = "QmUoCHEZqSuYhr9fV1c2b4gLASG2hPpC2moQXQ6qzy697d"
const testIpfsHashDecoded1 = eutil.bufferToHex(
  multihashes.decode(bs58.decode(testIpfsHash1)).digest)
const testIpfsHashDecoded2 = eutil.bufferToHex(
  multihashes.decode(bs58.decode(testIpfsHash2)).digest)

contract("LinniaPermissions", (accounts) => {
  const admin = accounts[0]
  const patient1 = accounts[1]
  const patient2 = accounts[2]
  const doctor1 = accounts[3]
  const doctor2 = accounts[4]
  let hub, instance

  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  before("set up a LinniaRoles contract", async () => {
    const rolesInstance = await LinniaRoles.new(hub.address, accounts[0])
    await hub.setRolesContract(rolesInstance.address)
    rolesInstance.registerPatient({ from: patient1 })
    rolesInstance.registerPatient({ from: patient2 })
    rolesInstance.registerDoctor(doctor1, { from: accounts[0] })
    rolesInstance.registerDoctor(doctor2, { from: accounts[0] })
  })
  before("set up a LinniaRecords contract", async () => {
    const recordsInstance = await LinniaRecords.new(hub.address,
      accounts[0], { from: accounts[0] })
    await hub.setRecordsContract(recordsInstance.address)
    // upload 2 records, one for patient1 and one for patient2
    const rsv1 = eutil.fromRpcSig(web3.eth.sign(doctor1, testFileHash1))
    await recordsInstance.uploadRecord(testFileHash1, patient1, 1,
      testIpfsHashDecoded1, eutil.bufferToHex(rsv1.r),
      eutil.bufferToHex(rsv1.s), rsv1.v, { from: doctor1 })
    const rsv2 = eutil.fromRpcSig(web3.eth.sign(doctor2, testFileHash2))
    await recordsInstance.uploadRecord(testFileHash2, patient2, 2,
      testIpfsHashDecoded2, eutil.bufferToHex(rsv2.r),
      eutil.bufferToHex(rsv2.s), rsv2.v, { from: doctor2 })
  })
  beforeEach("deploy a new LinniaPermissions contract", async () => {
    instance = await LinniaPermissions.new(hub.address,
      accounts[0], { from: accounts[0] })
    await hub.setPermissionsContract(instance.address)
  })

  describe("constructor", () => {
    it("should set hub address correctly", async () => {
      const instance = await LinniaRecords.new(hub.address,
        accounts[0], { from: accounts[0] })
      assert.equal(await instance.hub(), hub.address)
    })
  })
  describe("grant access", () => {
    it("should allow patient to grant access to their files", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      const tx = await instance.grantAccess(testFileHash1, doctor2,
        fakeIpfsHash, { from: patient1 })
      assert.equal(tx.logs[0].event, "AccessGranted")
      assert.equal(tx.logs[0].args.fileHash, testFileHash1)
      assert.equal(tx.logs[0].args.patient, patient1)
      assert.equal(tx.logs[0].args.viewer, doctor2)
      const perm = await instance.permissions(testFileHash1, doctor2)
      assert.equal(perm[0], true)
      assert.equal(perm[1], fakeIpfsHash)
    })
  })
  describe("remoke access", () => {
    it("should allow patient to revoke access to their files", async () => {
      const fakeIpfsHash = eutil.bufferToHex(crypto.randomBytes(32))
      await instance.grantAccess(testFileHash1, doctor2,
        fakeIpfsHash, { from: patient1 })
      const tx = await instance.revokeAccess(testFileHash1,
        doctor2, { from: patient1 })
      assert.equal(tx.logs[0].event, "AccessRevoked")
      assert.equal(tx.logs[0].args.fileHash, testFileHash1)
      assert.equal(tx.logs[0].args.patient, patient1)
      assert.equal(tx.logs[0].args.viewer, doctor2)
      const perm = await instance.permissions(testFileHash1, doctor2)
      assert.equal(perm[0], false)
      assert.equal(perm[1], eutil.bufferToHex(eutil.zeros(32)))
    })
  })
})
