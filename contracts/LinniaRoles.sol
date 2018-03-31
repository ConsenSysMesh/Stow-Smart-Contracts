pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaHub.sol";


contract LinniaRoles is Ownable {
    // Providers represent health care providers such as labs or doctors.
    // Provider are able to add signature.
    struct Provider {
        bool exists;
        uint provenance;
    }

    struct Patient {
        bool exists;
        uint registerBlocktime;
    }

    event LogPatientRegistered(address indexed user);
    event LogProviderRegistered(address indexed user);
    event LogProviderRemoved(address indexed user);

    LinniaHub public hub;
    mapping(address => Provider) public providers;
    mapping(address => Patient) public patients;

    function LinniaRoles(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    // registerPatient allows any user to self register as a patient
    function registerPatient() external returns (bool) {
        require(!isPatient(msg.sender));
        patients[msg.sender] = Patient({
            exists: true,
            registerBlocktime: block.number
        });
        emit LogPatientRegistered(msg.sender);
        return true;
    }

    // registerProvider allows admin to register a provider
    function registerProvider(address user) onlyOwner external returns (bool) {
        require(!isProvider(user));
        providers[user] = Provider({
            exists: true,
            // providers start with 1 provenance score for now
            provenance: 1
        });
        emit LogProviderRegistered(user);
        return true;
    }

    // removeProvider allows admin to remove a provider
    function removeProvider(address user) onlyOwner external returns (bool) {
        require(isProvider(user));
        providers[user] = Provider({
            exists: false,
            provenance: 0
        });
        emit LogProviderRemoved(user);
        return true;
    }

    /* Public functions */

    function isPatient(address user) public view returns (bool) {
        return patients[user].exists;
    }

    function isProvider(address user) public view returns (bool) {
        return providers[user].exists;
    }

    function provenance(address user) public view returns (uint) {
        if (providers[user].exists) {
            return providers[user].provenance;
        } else {
            return 0;
        }
    }
}
