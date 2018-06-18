const LinniaHub = artifacts.require("./LinniaHub.sol")
const LinniaUsers = artifacts.require("./LinniaUsers.sol")
const LinniaRecords = artifacts.require("./LinniaRecords.sol")
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol")
const HealthFacet = artifacts.require("./HealthFacet.sol")

module.exports = (deployer, network, accounts) => {
  const adminAddress = accounts[0]
  let hubInstance
  // deploy the hub
  deployer.deploy(LinniaHub).then(() => {
    return LinniaHub.deployed()
  }).then((_hubInstace) => {
    hubInstance = _hubInstace
    // deploy Users
    return deployer.deploy(LinniaUsers, hubInstance.address)
  }).then(() => {
    // deploy Records
    return deployer.deploy(LinniaRecords, hubInstance.address)
  }).then(() => {
    // deploy Permissions
    return deployer.deploy(LinniaPermissions, hubInstance.address)
  }).then(() => {
    // set all the addresses in the hub
    return hubInstance.setUsersContract(LinniaUsers.address)
  }).then(() => {
    return hubInstance.setRecordsContract(LinniaRecords.address)
  }).then(() => {
    return hubInstance.setPermissionsContract(LinniaPermissions.address)
  }).then(() => {
    return deloyer.deploy(HealthFacet);
}
