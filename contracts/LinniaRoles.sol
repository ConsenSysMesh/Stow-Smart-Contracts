pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaHub.sol";


contract LinniaRoles is Ownable {
    // Providers represent health care providers such as labs or doctors.
    // Provider are able to add signature.
    enum Role { Nil, Patient, Provider }
    event PatientRegistered(address indexed user);
    event ProviderRegistered(address indexed user);
    event RoleUpdated(address indexed user, Role role);

    LinniaHub public hub;
    mapping(address => Role) public roles;

    function LinniaRoles(LinniaHub _hub) public {
        hub = _hub;
    }

    // registerPatient allows any user to self register as a patient
    function registerPatient() public returns (bool) {
        require(roles[msg.sender] == Role.Nil);
        roles[msg.sender] = Role.Patient;
        PatientRegistered(msg.sender);
        return true;
    }

    // registerProvider allows admin to register a provider
    function registerProvider(address user) onlyOwner public returns (bool) {
        require(roles[user] == Role.Nil);
        roles[user] = Role.Provider;
        ProviderRegistered(user);
        return true;
    }

    // updateRole allows admin to update any role
    function updateRole(address user, Role newRole) onlyOwner
        public
        returns (bool)
    {
        roles[user] = newRole;
        RoleUpdated(user, newRole);
        return true;
    }
}
