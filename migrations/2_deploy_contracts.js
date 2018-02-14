const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaHTH = artifacts.require("./LinniaHTH")
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol")

module.exports = (deployer, network, accounts) => {
  const adminAddress = accounts[0]
  let hubInstance
  // deploy the hub
  deployer.deploy(LinniaHub).then(() => {
    return LinniaHub.deployed()
  }).then((_hubInstace) => {
    hubInstance = _hubInstace
    // deploy Roles
    return deployer.deploy(LinniaRoles, hubInstance.address)
  }).then(() => {
    // deploy HTH
    return deployer.deploy(LinniaHTH, hubInstance.address)
  }).then(() => {
    // deploy Records
    return deployer.deploy(LinniaRecords, hubInstance.address)
  }).then(() => {
    // deploy Permissions
    return deployer.deploy(LinniaPermissions, hubInstance.address)
  }).then(() => {
    // set all the addresses in the hub
    return hubInstance.setRolesContract(LinniaRoles.address)
  }).then(() => {
    return hubInstance.setHTHContract(LinniaHTH.address)
  }).then(() => {
    return hubInstance.setRecordsContract(LinniaRecords.address)
  }).then(() => {
    return hubInstance.setPermissionsContract(LinniaPermissions.address)
  })
}
