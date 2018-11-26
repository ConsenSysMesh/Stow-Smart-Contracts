const StowHub = artifacts.require("./StowHub.sol");
const StowUsers = artifacts.require("./StowUsers.sol");
const StowRecords = artifacts.require("./StowRecords.sol");
const StowPermissions = artifacts.require("./StowPermissions.sol");

module.exports = (deployer, network, accounts) => {
  const adminAddress = accounts[0];
  let hubInstance;
  // deploy the hub
  deployer.deploy(StowHub).then(() => {
    return StowHub.deployed()
  }).then((_hubInstace) => {
    hubInstance = _hubInstace
    // deploy Users
    return deployer.deploy(StowUsers, hubInstance.address)
  }).then(() => {
    // deploy Records
    return deployer.deploy(StowRecords, hubInstance.address)
  }).then(() => {
    // deploy Permissions
    return deployer.deploy(StowPermissions, hubInstance.address)
  }).then(() => {
    // set all the addresses in the hub
    return  hubInstance.setUsersContract(StowUsers.address)
  }).then(() => {
    return hubInstance.setRecordsContract(StowRecords.address)
  }).then(() => {
    return hubInstance.setPermissionsContract(StowPermissions.address)
  })
}
