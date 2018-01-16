const LinniaRoles = artifacts.require("./LinniaRoles.sol");
const LinniaRecords = artifacts.require("./LinniaRecords.sol");

module.exports = async (deployer, network, accounts) => {
  deployer.deploy(LinniaRoles);
  const rolesInstance = await LinniaRoles.deployed();
  const adminAddress = await rolesInstance.admin();
  deployer.deploy(LinniaRecords, rolesInstance.address, adminAddress);
};
