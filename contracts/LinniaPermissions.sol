pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./LinniaHub.sol";
import "./LinniaRecords.sol";
import "./LinniaUsers.sol";


contract LinniaPermissions is Ownable, Pausable, Destructible {
    struct Permission {
        bool canAccess;
        // ipfs path of the data, encrypted to the viewer
        string dataUri;
    }

    event LinniaAccessGranted(bytes32 indexed dataHash, address indexed owner,
        address indexed viewer
    );
    event LinniaAccessRevoked(bytes32 indexed dataHash, address indexed owner,
        address indexed viewer
    );

    LinniaHub public hub;
    // dataHash => viewer => permission mapping
    mapping(bytes32 => mapping(address => Permission)) public permissions;

    /* Modifiers */
    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    modifier onlyRecordOwnerOf(bytes32 dataHash) {
        require(hub.recordsContract().recordOwnerOf(dataHash) == msg.sender);
        _;
    }

    /* Constructor */
    constructor(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    /// Check if a viewer has access to a record
    /// @param dataHash the hash of the unencrypted file
    /// @param viewer the address being allowed to view the file
    function checkAccess(bytes32 dataHash, address viewer)
    view
    external
    returns (bool)
    {
        return permissions[dataHash][viewer].canAccess;
    }

    /// Give a viewer access to a linnia record
    /// Called by owner of the record.
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user being permissioned to view the data
    /// @param dataUri the ipfs path of the re-encrypted data
    function grantAccess(bytes32 dataHash, address viewer, string dataUri)
    onlyUser
    onlyRecordOwnerOf(dataHash)
    whenNotPaused
    external
    returns (bool)
    {
        // validate input
        require(viewer != address(0));
        require(bytes(dataUri).length != 0);

        // TODO, Uncomment this to prevent grant access twice, It is commented for testing purposes
        // access must not have already been granted
        // require(!permissions[dataHash][viewer].canAccess);
        permissions[dataHash][viewer] = Permission({
            canAccess: true,
            dataUri: dataUri
            });
        emit LinniaAccessGranted(dataHash, msg.sender, viewer);
        return true;
    }

    /// Revoke a viewer access to a linnia record
    /// Note that this does not necessarily remove the file from storage
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user that has permission to view the data
    function revokeAccess(bytes32 dataHash, address viewer)
    onlyUser
    onlyRecordOwnerOf(dataHash)
    whenNotPaused
    external
    returns (bool)
    {
        // access must have already been grated
        require(permissions[dataHash][viewer].canAccess);
        permissions[dataHash][viewer] = Permission({
            canAccess: false,
            dataUri: ""
            });
        emit LinniaAccessRevoked(dataHash, msg.sender, viewer);
        return true;
    }
}
