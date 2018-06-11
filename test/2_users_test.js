const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaUsers = artifacts.require("./LinniaUsers.sol")

import expectThrow from "openzeppelin-solidity/test/helpers/expectThrow"

contract("LinniaUsers", (accounts) => {
  let hub
  let instance
  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  beforeEach("deploy a new LinniaUsers contract", async () => {
    instance = await LinniaUsers.new(hub.address)
    await hub.setUsersContract(instance.address)
  })
  describe("constructor", () => {
    it("should set the deployer as admin",
      async () => {
        const instance = await LinniaUsers.new(hub.address)
        assert.equal(await instance.owner(), accounts[0])
      })
    it("should set hub address correctly", async () => {
      const instance = await LinniaUsers.new(hub.address)
      assert.equal(await instance.hub(), hub.address)
    })
  })
  describe("change admin", () => {
    it("should allow admin to change admin", async () => {
      const instance = await LinniaUsers.new(hub.address)
      await instance.transferOwnership(accounts[1], { from: accounts[0] })
      assert.equal(await instance.owner(), accounts[1])
    })
    it("should not allow non admin to change admin", async () => {
      const instance = await LinniaUsers.new(hub.address)
      await expectThrow(instance.transferOwnership(accounts[1], {
        from: accounts[1]
      }))
    })
  })
  describe("register", () => {
    it("should allow user to self register",
      async () => {
        const tx = await instance.register({ from: accounts[1] })
        assert.equal(tx.logs[0].event, "LogUserRegistered")
        assert.equal(tx.logs[0].args.user, accounts[1])

        const storedUser = await instance.users(accounts[1])
        assert.equal(storedUser[0], true)
        assert.equal(storedUser[1], tx.receipt.blockNumber)
        assert.equal(storedUser[2], 0)
      })
    it("should not allow a user to self register as twice",
      async () => {
        const tx = await instance.register({ from: accounts[1] })
        assert.equal(tx.logs[0].args.user, accounts[1])
        await expectThrow(
          instance.register({ from: accounts[1] })
        )
      })
  })
  describe("set provenance", () => {
    it("should allow admin to set provenance of a user", async () => {
      // register a user first
      await instance.register({ from: accounts[1] })
      // set provenance
      const tx = await instance.setProvenance(accounts[1], 42, { from: accounts[0] })
      // check logs
      assert.equal(tx.logs[0].event, "LogProvenanceChanged")
      assert.equal(tx.logs[0].args.user, accounts[1])
      assert.equal(tx.logs[0].args.provenance, 42)
      // check state
      assert.equal((await instance.users(accounts[1]))[2], 42)
    })
    it("should not allow non admin to change provenance", async () => {
      await instance.register({ from: accounts[1] })
      await expectThrow(
        instance.setProvenance(accounts[1], 42, { from: accounts[1] })
      )
    })
    it("should not allow admin to change provenance of nonexistent provider", async () => {
      await expectThrow(
        instance.setProvenance(accounts[1], 42)
      )
    })
  })
  describe("is user", () => {
    it("should return true if user is registered", async () => {
      await instance.register({ from: accounts[1] })
      assert.equal(await instance.isUser(accounts[1]), true)
    })
    it("should return false if user is not registered", async () => {
      assert.equal(await instance.isUser(accounts[1]), false)
    })
  })
  describe("provenance score", () => {
    it("should return the provenance score of a user", async () => {
      await instance.register({ from: accounts[1] })
      await instance.setProvenance(accounts[1], 42, { from: accounts[0] })
      assert.equal((await instance.provenanceOf(accounts[1])).toString(),
        "42");
    })
    it("should return 0 if user isn't registered", async () => {
      assert.equal(await instance.provenanceOf(accounts[1]), 0)
    })
  })
})
