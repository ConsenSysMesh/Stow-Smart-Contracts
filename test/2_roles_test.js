const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")

import expectThrow from "zeppelin-solidity/test/helpers/expectThrow"

contract("LinniaRoles", (accounts) => {
  let hub
  let instance
  before("set up a LinniaHub contract", async () => {
    hub = await LinniaHub.new()
  })
  beforeEach("deploy a new LinniaRoles contract", async () => {
    instance = await LinniaRoles.new(hub.address)
    await hub.setRolesContract(instance.address)
  })
  describe("constructor", () => {
    it("should set the deployer as admin",
      async () => {
        const instance = await LinniaRoles.new(hub.address)
        assert.equal(await instance.owner(), accounts[0])
      })
    it("should set hub address correctly", async () => {
      const instance = await LinniaRoles.new(hub.address)
      assert.equal(await instance.hub(), hub.address)
    })
  })
  describe("change admin", () => {
    it("should allow admin to change admin", async () => {
      const instance = await LinniaRoles.new(hub.address)
      await instance.transferOwnership(accounts[1], { from: accounts[0] })
      assert.equal(await instance.owner(), accounts[1])
    })
    it("should not allow non admin to change admin", async () => {
      const instance = await LinniaRoles.new(hub.address)
      await expectThrow(instance.transferOwnership(accounts[1], {
        from: accounts[1]
      }))
    })
  })
  describe("register patient", () => {
    it("should allow patient to self register",
      async () => {
        const tx = await instance.registerPatient({ from: accounts[1] })
        assert.equal(tx.logs[0].args.user, accounts[1])
        assert.equal(await instance.roles(accounts[1]), 1)
      })
    it("should not allow a user to self register as patient twice",
      async () => {
        const tx = await instance.registerPatient({ from: accounts[1] })
        assert.equal(tx.logs[0].args.user, accounts[1])
        await expectThrow(
          instance.registerPatient({ from: accounts[1] })
        )
      })
  })
  describe("register doctor", () => {
    it("should allow admin to register a doctor", async () => {
      const tx = await instance.registerDoctor(accounts[1])
      assert.equal(tx.logs[0].args.user, accounts[1])
      assert.equal(await instance.roles(accounts[1]), 2)
    })
    it("should not allow non admin to register a doctor", async () => {
      await expectThrow(
        instance.registerDoctor(accounts[1], { from: accounts[1] })
      )
    })
  })
  describe("register provider", () => {
    it("should allow admin to register a provider", async () => {
      const tx = await instance.registerProvider(accounts[1])
      assert.equal(tx.logs[0].args.user, accounts[1])
      assert.equal(await instance.roles(accounts[1]), 3)
    })
    it("should not allow non admin to register a provider", async () => {
      await expectThrow(
        instance.registerProvider(accounts[1], { from: accounts[1] })
      )
    })
  })
  describe("update role", () => {
    it("should allow admin to update an existing role", async () => {
      await instance.registerPatient({ from: accounts[1] })
      const tx1 = await instance.updateRole(accounts[1], 2)
      assert.equal(tx1.logs[0].args.user, accounts[1])
      assert.equal(tx1.logs[0].args.role, 2)
      assert.equal(await instance.roles(accounts[1]), 2)
    })
    it("should not allow non admin to update roles", async () => {
      await expectThrow(
        instance.updateRole(accounts[1], 2, { from: accounts[1] })
      )
    })
  })
})
