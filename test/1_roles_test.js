var LinniaRoles = artifacts.require("./LinniaRoles.sol");

contract('LinniaRoles', (accounts) => {
  describe("constructor", () => {
    it("should set the correct admin address when deployed" +
      "with a given admin address",
      async () => {
        const newInstance = await LinniaRoles.new(accounts[1], {
          from: accounts[0]
        });
        const admin = await newInstance.admin()
        assert.equal(admin, accounts[1])
      })
    it("should set the deployer as admin if not explicitly given",
      async () => {
        const instance = await LinniaRoles.new()
        const admin = await instance.admin()
        assert.equal(admin, accounts[0])
      })
  })
  describe("register patient", () => {
    it("should allow patient to self register",
      async () => {
        const instance = await LinniaRoles.new()
        const tx = await instance.registerPatient({ from: accounts[1] })
        assert.equal(tx.logs[0].args.user, accounts[1])
        const role = await instance.roles(accounts[1])
        assert.equal(role, 1)
      })
    it("should not allow a user to self register as patient twice",
      async () => {
        const instance = await LinniaRoles.new()
        const tx = await instance.registerPatient({ from: accounts[1] })
        assert.equal(tx.logs[0].args.user, accounts[1])
        try {
          await instance.registerPatient({ from: accounts[1] })
          assert.fail("user has registered twice")
        } catch (err) {
          // ok
        }
      })
  })
  describe("register doctor", () => {
    it("should allow admin to register a doctor", async () => {
      const instance = await LinniaRoles.new();
      const tx = await instance.registerDoctor(accounts[1])
      assert.equal(tx.logs[0].args.user, accounts[1])
      const role = await instance.roles(accounts[1])
      assert.equal(role, 2)
    })
    it("should not allow non admin to register a doctor", async () => {
      const instance = await LinniaRoles.new();
      try {
        await instance.registerDoctor(accounts[1], { from: accounts[1] })
        assert.fail("non admin has registered a doctor")
      } catch (err) {
        // ok
      }
    })
  })
  describe("register provider", () => {
    it("should allow admin to register a provider", async () => {
      const instance = await LinniaRoles.new();
      const tx = await instance.registerProvider(accounts[1])
      assert.equal(tx.logs[0].args.user, accounts[1])
      const role = await instance.roles(accounts[1])
      assert.equal(role, 3)
    })
    it("should not allow non admin to register a provider", async () => {
      const instance = await LinniaRoles.new();
      try {
        await instance.registerProvider(accounts[1], { from: accounts[1] })
        assert.fail("non admin has registered a provider")
      } catch (err) {
        // ok
      }
    })
  })
  describe("update role", () => {
    it("should allow admin to update an existing role", async () => {
      const instance = await LinniaRoles.new()
      await instance.registerPatient({ from: accounts[1] })
      const tx1 = await instance.updateRole(accounts[1], 2)
      assert.equal(tx1.logs[0].args.user, accounts[1])
      assert.equal(tx1.logs[0].args.role, 2)
      const role1 = await instance.roles(accounts[1])
      assert.equal(role1, 2)
    })
    it("should not allow non admin to update roles", async () => {
      const instance = await LinniaRoles.new()
      try {
        await instance.updateRole(accounts[1], 2, { from: accounts[1] })
        assert.fail("role is updated by non-admin")
      } catch (err) {
        // ok
      }
    })
  })
  describe("change admin", () => {
    it("should allow admin to change admin", async () => {
      const instance = await LinniaRoles.new({ from: accounts[0] })
      await instance.changeAdmin(accounts[1], { from: accounts[0] })
      const newAdmin = await instance.admin()
      assert.equal(newAdmin, accounts[1])
    })
    it("should not allow non admin to change admin", async () => {
      const instance = await LinniaRoles.new({ from: accounts[0] })
      try {
        await instance.updateRole(accounts[1], { from: accounts[1] })
        assert.fail("admin is changed by non-admin")
      } catch (err) {
        // ok
      }
    })
  })
})
