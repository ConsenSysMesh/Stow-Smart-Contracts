const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaRoles = artifacts.require("./LinniaRoles.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaHTH = artifacts.require("./LinniaHTH")
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol")

module.exports = (deployer) => {
  let adminAddress
  let hubInstance
  // deploy the hub first
  deployer.deploy(LinniaHub).then(() => {
    return LinniaHub.deployed()
  }).then((_hubInstace) => {
    // get the admin of the hub
    hubInstance = _hubInstace
    return hubInstance.admin()
  }).then((_adminAddress) => {
    adminAddress = _adminAddress
    // deploy Roles
    return deployer.deploy(LinniaRoles, hubInstance.address, adminAddress)
  }).then(() => {
    // deploy HTH
    return deployer.deploy(LinniaHTH, hubInstance.address, adminAddress)
  }).then(() => {
    // deploy Records
    return deployer.deploy(LinniaRecords, hubInstance.address, adminAddress)
  }).then(() => {
    // deploy Permissions
    return deployer.deploy(LinniaPermissions, hubInstance.address, adminAddress)
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
