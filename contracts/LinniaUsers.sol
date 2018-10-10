pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaWhitelistI.sol";
import "./LinniaHub.sol";


contract LinniaUsers is Ownable, Pausable, Destructible {
    struct User {
        bool exists;
        uint registerBlocktime;
        uint provenance;
    }

    event LinniaUserRegistered(address indexed user);
    event LinniaProvenanceChanged(address indexed user, uint provenance);

    LinniaHub public hub;
    mapping(address => User) public users;

    constructor(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    // register allows any user to self register on Linnia
    function register()
        whenNotPaused
        external
        returns (bool)
    {
        require(!isUser(msg.sender));
        users[msg.sender] = User({
            exists: true,
            registerBlocktime: block.number,
            provenance: 0
        });
        emit LinniaUserRegistered(msg.sender);
        return true;
    }

     // setExpertScore allows admin to set the expert score of a user from a trusted third party
    function setExpertScore(LinniaWhitelistI whitelist, address user)
        onlyOwner
        external
        returns (bool)
    {
        uint score = whitelist.expertScoreOf(user);
        setProvenance(user, score);
        return true;
    }

    /* Public functions */

     // setProvenance allows admin to set the provenance of a user
    function setProvenance(address user, uint provenance)
        onlyOwner
        public
        returns (bool)
    {
        require(isUser(user));
        users[user].provenance = provenance;
        emit LinniaProvenanceChanged(user, provenance);
        return true;
    }

    function isUser(address user)
        public
        view
        returns (bool)
    {
        return users[user].exists;
    }

    function provenanceOf(address user)
        public
        view
        returns (uint)
    {
        if (users[user].exists) {
            return users[user].provenance;
        } else {
            return 0;
        }
    }
}
