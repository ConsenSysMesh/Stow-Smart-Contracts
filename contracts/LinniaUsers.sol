pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaHub.sol";


contract LinniaUsers is Ownable {
    struct User {
        bool exists;
        uint registerBlocktime;
        uint provenance;
    }

    event LogUserRegistered(address indexed user);
    event LogProvenanceChanged(address indexed user, uint provenance);

    LinniaHub public hub;
    mapping(address => User) public users;

    function LinniaUsers(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    // register allows any user to self register on Linnia
    function register() external returns (bool) {
        require(!isUser(msg.sender));
        users[msg.sender] = User({
            exists: true,
            registerBlocktime: block.number,
            provenance: 0
        });
        LogUserRegistered(msg.sender);
        return true;
    }

    // setProvenance allows admin to set the provenance of a user
    function setProvenance(address user, uint provenance) onlyOwner external returns (bool) {
        require(isUser(user));
        users[user].provenance = provenance;
        LogProvenanceChanged(user, provenance);
        return true;
    }

    /* Public functions */

    function isUser(address user) public view returns (bool) {
        return users[user].exists;
    }

    function provenanceOf(address user) public view returns (uint) {
        if (users[user].exists) {
            return users[user].provenance;
        } else {
            return 0;
        }
    }
}
