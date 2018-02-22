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

    event PatientRegistered(address indexed user);
    event ProviderRegistered(address indexed user);
    event ProviderRemoved(address indexed user);

    LinniaHub public hub;
    mapping(address => Provider) public providers;
    mapping(address => Patient) public patients;

    function LinniaRoles(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Constant functions */
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

    /* Public functions */

    // registerPatient allows any user to self register as a patient
    function registerPatient() public returns (bool) {
        require(!isPatient(msg.sender));
        patients[msg.sender] = Patient({
            exists: true,
            registerBlocktime: block.number
        });
        PatientRegistered(msg.sender);
        return true;
    }

    // registerProvider allows admin to register a provider
    function registerProvider(address user) onlyOwner public returns (bool) {
        require(!isProvider(user));
        providers[user] = Provider({
            exists: true,
            // providers start with 1 provenance score for now
            provenance: 1
        });
        ProviderRegistered(user);
        return true;
    }

    // removeProvider allows admin to remove a provider
    function removeProvider(address user) onlyOwner public returns (bool) {
        require(isProvider(user));
        providers[user] = Provider({
            exists: false,
            provenance: 0
        });
        ProviderRemoved(user);
        return true;
    }
}
