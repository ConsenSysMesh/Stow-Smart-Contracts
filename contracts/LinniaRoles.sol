pragma solidity 0.4.18;

contract LinniaRoles {
    enum Role { Nil, Patient, Doctor, Provider }
    event PatientRegistered(address indexed user);
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

    // patientRegister allows any user to self register as a patient
    function patientRegister() public {
        require(roles[msg.sender] == Role.Nil);
        roles[msg.sender] = Role.Patient;
        PatientRegistered(msg.sender);
    }

    function updateRole(address user, Role newRole) onlyAdmin public {
        roles[user] = newRole;
        RoleUpdated(user, newRole);
    }

    function changeAdmin(address newAdmin) onlyAdmin public {
        admin = newAdmin;
    }
}
