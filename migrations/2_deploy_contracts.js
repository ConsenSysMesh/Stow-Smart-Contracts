const LinniaRoles = artifacts.require("./LinniaRoles.sol");

module.exports = function(deployer) {
  deployer.deploy(LinniaRoles);
};
