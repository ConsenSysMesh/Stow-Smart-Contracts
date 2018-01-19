const LinniaRoles = artifacts.require("./LinniaRoles.sol");
const LinniaRecords = artifacts.require("./LinniaRecords.sol");

module.exports = (deployer) => {
  let rolesInstance
  deployer.deploy(LinniaRoles).then(() => {
    return LinniaRoles.deployed()
  }).then((_rolesInstance) => {
    rolesInstance = _rolesInstance
    return rolesInstance.admin()
  }).then((adminAddress) => {
    return deployer.deploy(LinniaRecords, rolesInstance.address, adminAddress)
  })
}
