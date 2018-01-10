pragma solidity 0.4.18;

contract LinniaRoles {
    enum Role { Nil, Patient, Doctor, Provider }
    event PatientRegistered(address indexed user);
    event DoctorRegistered(address indexed user);
    event ProviderRegistered(address indexed user);
    event RoleUpdated(address indexed user, Role role);

    mapping(address => Role) public roles;
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function LinniaRoles(address initialAdmin) public {
        if (initialAdmin == 0) {
            admin = msg.sender;
        } else {
            admin = initialAdmin;
        }
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

    function changeAdmin(address newAdmin) onlyAdmin public {
        admin = newAdmin;
    }
}
