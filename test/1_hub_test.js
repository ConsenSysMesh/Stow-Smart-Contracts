const LinniaHub = artifacts.require("./LinniaHub.sol")

import expectThrow from "openzeppelin-solidity/test/helpers/expectThrow"
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert"

contract("LinniaHub", (accounts) => {
  let instance
  beforeEach("deploy a new LinniaHub contract", async () => {
    instance = await LinniaHub.new()
  })

  describe("constructor", () => {
    it("should set admin correctly", async () => {
      const instance = await LinniaHub.new()
      assert.equal(await instance.owner(), accounts[0])
    })
    it("should initialize users, records addresss to zero",
      async () => {
        assert.equal(await instance.usersContract(), 0)
        assert.equal(await instance.recordsContract(), 0)
      })
  })
  describe("set users contract", () => {
    it("should allow admin to set Users address", async () => {
      const tx = await instance.setUsersContract(42)
      assert.equal(tx.logs[0].event, "LogUsersContractSet")
      assert.equal(tx.logs[0].args.from, 0)
      assert.equal(tx.logs[0].args.to, 42)
      assert.equal(await instance.usersContract(), 42)
    })
    it("should not allow non-admin to set Users address", async () => {
      await expectThrow(instance.setUsersContract(42, { from: accounts[1] }))
    })
  })
  describe("set Records contract", () => {
    it("should allow admin to set Records address", async () => {
      const tx = await instance.setRecordsContract(42)
      assert.equal(tx.logs[0].event, "LogRecordsContractSet")
      assert.equal(tx.logs[0].args.from, 0)
      assert.equal(tx.logs[0].args.to, 42)
      assert.equal(await instance.recordsContract(), 42)
    })
    it("should not allow non-admin to set Records address", async () => {
      await expectThrow(instance.setRecordsContract(42, { from: accounts[1] }))
    })

  })
  describe("set Permissions contract", () => {
    it("should allow admin to set Permissions address", async () => {
      const tx = await instance.setPermissionsContract(42)
      assert.equal(tx.logs[0].event, "LogPermissionsContractSet")
      assert.equal(tx.logs[0].args.from, 0)
      assert.equal(tx.logs[0].args.to, 42)
      assert.equal(await instance.permissionsContract(), 42)
    })
    it("should not allow non-admin to set Permissions address", async () => {
      await expectThrow(instance.setPermissionsContract(42,
        { from: accounts[1] }))
    })
  })
  describe("Pausable", () => {
    it("should not allow non-admin to pause or unpause", async () => {
      await assertRevert(instance.pause({ from: accounts[1] }))
      await assertRevert(instance.unpause({ from: accounts[1] }))
    })
    it("should allow admin to pause and unpause", async () => {
      const tx = await instance.pause()
      assert.equal(tx.logs[0].event, "Pause")
      await assertRevert(instance.setUsersContract(42))
      const tx2 = await instance.unpause()
      assert.equal(tx2.logs[0].event, "Unpause")
      const tx3 = await instance.setUsersContract(42)
    })
  })
})
