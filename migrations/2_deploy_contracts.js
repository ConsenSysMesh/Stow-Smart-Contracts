const LinniaHub = artifacts.require("./LinniaHub.sol");
const LinniaUsers = artifacts.require("./LinniaUsers.sol");
const LinniaRecords = artifacts.require("./LinniaRecords.sol");
const LinniaPermissions = artifacts.require("./LinniaPermissions.sol");
const {setupRoles} = require('../data/setup-roles.js');
//const {setupData} = require('../data/index.js');

const isLowerEnvironment = network => network === 'development';

module.exports = (deployer, network, accounts) => {
  const adminAddress = accounts[0];
  let hubInstance;
  let userInstance;
  let recordsInstance;
  // deploy the hub
  deployer.deploy(LinniaHub).then(() => {
    return LinniaHub.deployed()
  }).then((_hubInstace) => {
    hubInstance = _hubInstace
    // deploy Users
    return deployer.deploy(LinniaUsers, hubInstance.address)
  }).then(() => {
    // deploy Records
    return LinniaUsers.deployed()
  }).then((_userInstance) => {
    // set user instance
    userInstance = _userInstance;
    // deploy Records
    return deployer.deploy(LinniaRecords, hubInstance.address)
  }).then(() => {
    // deploy Permissions
    return LinniaRecords.deployed()
  }).then((_recordsInstance) => {
    //set record instance
    recordsInstance = _recordsInstance
    // deploy Permissions
    return deployer.deploy(LinniaPermissions, hubInstance.address)
  }).then(() => {
    // set all the addresses in the hub
    return  hubInstance.setUsersContract(LinniaUsers.address)
  }).then(() => {
    return hubInstance.setRecordsContract(LinniaRecords.address)
  }).then(() => {
    return hubInstance.setPermissionsContract(LinniaPermissions.address)
  })
  // .then(() => {
  //     if (isLowerEnvironment(network)){
  //       return setupRoles(userInstance)
  //       .then(() => {
  //       return setupData(recordsInstance)
  //     })
  //     }
  //   })
}
