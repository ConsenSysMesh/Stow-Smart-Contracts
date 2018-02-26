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
        assert.equal(tx.logs[0].event, "LogPatientRegistered")
        assert.equal(tx.logs[0].args.user, accounts[1])

        const storedPatient = await instance.patients(accounts[1])
        assert.equal(storedPatient[0], true)
        assert.equal(storedPatient[1], tx.receipt.blockNumber)
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
  describe("register provider", () => {
    it("should allow admin to register a provider", async () => {
      const tx = await instance.registerProvider(accounts[1])
      assert.equal(tx.logs[0].event, "LogProviderRegistered")
      assert.equal(tx.logs[0].args.user, accounts[1])

      const storedProvider = await instance.providers(accounts[1])
      assert.equal(storedProvider[0], true)
      // provider starts with 1 provenance score for now
      assert.equal(storedProvider[1], 1)
    })
    it("should not allow non admin to register a provider", async () => {
      await expectThrow(
        instance.registerProvider(accounts[1], { from: accounts[1] })
      )
    })
  })
  describe("remove provider", () => {
    it("should allow admin to remove an existing provider", async () => {
      // register a provider first
      await instance.registerProvider(accounts[1])
      // then remove the provider
      const tx = await instance.removeProvider(accounts[1])
      // check logs
      assert.equal(tx.logs[0].event, "LogProviderRemoved")
      assert.equal(tx.logs[0].args.user, accounts[1])
      // check state
      const storedProvider = await instance.providers(accounts[1])
      assert.equal(storedProvider[0], false)
      // provenance score should reset to zero
      assert.equal(storedProvider[1], 0)
    })
    it("should not allow non admin to remove provider", async () => {
      await instance.registerProvider(accounts[1])
      await expectThrow(
        instance.removeProvider(accounts[1], { from: accounts[1] })
      )
    })
    it("should not allow admin to remove nonexistent provider", async () => {
      await expectThrow(
        instance.removeProvider(accounts[1])
      )
    })
  })
  describe("is patient", () => {
    it("should return true if patient is registered", async () => {
      await instance.registerPatient({ from: accounts[1] })
      assert.equal(await instance.isPatient(accounts[1]), true)
    })
    it("should return false if patient is not registered", async () => {
      assert.equal(await instance.isPatient(accounts[1]), false)
    })
  })
  describe("is provider", () => {
    it("should return true if provider is registered", async () => {
      await instance.registerProvider(accounts[1])
      assert.equal(await instance.isProvider(accounts[1]), true)
    })
    it("should return false if provider is not registered", async () => {
      assert.equal(await instance.isProvider(accounts[1]), false)
    })
    it("should return false if provider is removed", async () => {
      await instance.registerProvider(accounts[1])
      await instance.removeProvider(accounts[1])
      assert.equal(await instance.isProvider(accounts[1]), false)
    })
  })
  describe("provenance score", () => {
    it("should return the provenance score of a provider", async () => {
      await instance.registerProvider(accounts[1])
      const provenanceState = (await instance.providers(accounts[1]))[1];
      assert.equal((await instance.provenance(accounts[1])).toString(),
        provenanceState.toString());
    })
    it("should return 0 if provider isnt registered", async () => {
      assert.equal(await instance.provenance(accounts[1]), 0)
    })
  })
})
