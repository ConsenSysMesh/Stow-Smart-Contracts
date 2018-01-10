pragma solidity 0.4.18;

import "./Owned.sol";

contract LinniaRoles is Owned {
    enum Role { Nil, Patient, Doctor, Provider }
    event PatientRegistered(address indexed user);
    event DoctorRegistered(address indexed user);
    event ProviderRegistered(address indexed user);
    event RoleUpdated(address indexed user, Role role);

    mapping(address => Role) public roles;

    function LinniaRoles(address initialAdmin) Owned(initialAdmin) public {
    }

    // registerPatient allows any user to self register as a patient
    function registerPatient() public {
        require(roles[msg.sender] == Role.Nil);
        roles[msg.sender] = Role.Patient;
        PatientRegistered(msg.sender);
    }

    // registerDoctor allows admin to register a doctor
    function registerDoctor(address user) onlyAdmin public {
        require(roles[user] == Role.Nil);
        roles[user] = Role.Doctor;
        DoctorRegistered(user);
    }

    // registerProvider allows admin to register a provider
    function registerProvider(address user) onlyAdmin public {
        require(roles[user] == Role.Nil);
        roles[user] = Role.Provider;
        ProviderRegistered(user);
    }

    // updateRole allows admin to update any role
    function updateRole(address user, Role newRole) onlyAdmin public {
        roles[user] = newRole;
        RoleUpdated(user, newRole);
    }
}
