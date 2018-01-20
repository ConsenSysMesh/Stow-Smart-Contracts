pragma solidity 0.4.18;

import "./Owned.sol";
import "./LinniaHub.sol";

contract LinniaRoles is Owned {
    enum Role { Nil, Patient, Doctor, Provider }
    event PatientRegistered(address indexed user);
    event DoctorRegistered(address indexed user);
    event ProviderRegistered(address indexed user);
    event RoleUpdated(address indexed user, Role role);

    LinniaHub public hub;
    mapping(address => Role) public roles;

    function LinniaRoles(LinniaHub _hub, address initialAdmin)
        Owned(initialAdmin)
        public
    {
        hub = _hub;
    }

    // registerPatient allows any user to self register as a patient
    function registerPatient() public returns (bool) {
        require(roles[msg.sender] == Role.Nil);
        roles[msg.sender] = Role.Patient;
        PatientRegistered(msg.sender);
        return true;
    }

    // registerDoctor allows admin to register a doctor
    function registerDoctor(address user) onlyAdmin public returns (bool) {
        require(roles[user] == Role.Nil);
        roles[user] = Role.Doctor;
        DoctorRegistered(user);
        return true;
    }

    // registerProvider allows admin to register a provider
    function registerProvider(address user) onlyAdmin public returns (bool) {
        require(roles[user] == Role.Nil);
        roles[user] = Role.Provider;
        ProviderRegistered(user);
        return true;
    }

    // updateRole allows admin to update any role
    function updateRole(address user, Role newRole) onlyAdmin
        public
        returns (bool)
    {
        roles[user] = newRole;
        RoleUpdated(user, newRole);
        return true;
    }
}
