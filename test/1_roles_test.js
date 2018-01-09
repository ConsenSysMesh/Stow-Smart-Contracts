var LinniaRoles = artifacts.require("./LinniaRoles.sol");

contract('LinniaRoles', (accounts) => {
  it("should set the correct admin address when deployed" +
    "with a given admin address",
    async () => {
      const newInstance = await LinniaRoles.new(accounts[1]);
      const admin = await newInstance.admin()
      assert.equal(admin, accounts[1])
    })
  it("should set the deployer as admin if not explicitly given",
    async () => {
      const instance = await LinniaRoles.deployed()
      const admin = await instance.admin()
      assert.equal(admin, accounts[0])
    })
  it("should allow admin to update roles",
    async () => {
      const instance = await LinniaRoles.new()
      const tx1 = await instance.updateRole(accounts[1], 1)
      // check event
      assert.equal(tx1.logs[0].args.user, accounts[1])
      assert.equal(tx1.logs[0].args.role, 1)
      // check contract state
      const role1 = await instance.roles(accounts[1])
      assert.equal(role1, 1)

      const tx2 = await instance.updateRole(accounts[2], 2)
      assert.equal(tx2.logs[0].args.user, accounts[2])
      assert.equal(tx2.logs[0].args.role, 2)
      const role2 = await instance.roles(accounts[2])
      assert.equal(role2, 2)
    })
  it("should not allow non admin to update roles",
    async () => {
      const instance = await LinniaRoles.deployed()
      try {
        await instance.updateRole(accounts[1], 3, { from: accounts[1] })
        assert.fail("role is updated by non-admin")
      } catch (err) {
        // ok
      }
    })
  it("should not allow non admin to change admin",
    async () => {
      const instance = await LinniaRoles.deployed()
      try {
        await instance.updateRole(accounts[1], { from: accounts[1] })
        assert.fail("admin is changed by non-admin")
      } catch (err) {
        // ok
      }
    })
  it("should allow admin to change admin",
    async () => {
      const instance = await LinniaRoles.new()
      await instance.changeAdmin(accounts[1], { from: accounts[0] })
      const newAdmin = await instance.admin()
      assert.equal(newAdmin, accounts[1])
    })
  it("should allow patient to self register",
    async () => {
      const instance = await LinniaRoles.new()
      const tx = await instance.patientRegister({ from: accounts[1] })
      assert.equal(tx.logs[0].args.user, accounts[1])
      const role = await instance.roles(accounts[1])
      assert.equal(role, 1)
    })
  it("should disallow user to self register as patient twice",
    async () => {
      const instance = await LinniaRoles.new()
      const tx = await instance.patientRegister({ from: accounts[1] })
      assert.equal(tx.logs[0].args.user, accounts[1])
      try {
        await instance.patientRegister({ from: accounts[1] })
        assert.fail("user has registered twice")
      } catch (err) {
        // ok
      }
    })
})
