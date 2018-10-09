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

    event LinniaAccessGranted(bytes32 dataHash, address indexed owner,
        address indexed viewer, address indexed sender
    );
    event LinniaAccessRevoked(bytes32 dataHash, address indexed owner,
        address indexed viewer, address indexed sender
    );
    event LinniaDelegateAdded(address indexed user, address indexed delegate);

    LinniaHub public hub;
    // dataHash => viewer => permission mapping
    mapping(bytes32 => mapping(address => Permission)) public permissions;
    // user => delegate => bool mapping
    mapping(address => mapping(address => bool)) public delegates;

    /* Modifiers */
    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    modifier onlyRecordOwnerOf(bytes32 dataHash, address owner) {
        require(hub.recordsContract().recordOwnerOf(dataHash) == owner);
        _;
    }

    modifier onlyDelegate(address owner) {
        require(delegates[owner][msg.sender]);
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

    /// Add a delegate for a user's permissions
    /// @param delegate the address of the delegate being added by user
    function addDelegate(address delegate)
    onlyUser
    whenNotPaused
    external
    returns (bool)
    {
        delegates[msg.sender][delegate] = true;
        emit LinniaDelegateAdded(msg.sender, delegate);
        return true;
    }
    
    /// Give a viewer access to a linnia record
    /// Called by owner of the record.
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user being permissioned to view the data
    /// @param dataUri the ipfs path of the re-encrypted data
    function grantAccess(
        bytes32 dataHash, address viewer, string dataUri)
        onlyUser
        onlyRecordOwnerOf(dataHash, msg.sender)
        public
        returns (bool)
    {
        require(
            _grantAccess(dataHash, viewer, msg.sender, dataUri) == true
        );
        return true;
    }

    /// Give a viewer access to a linnia record
    /// Called by delegate to the owner of the record.
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user being permissioned to view the data
    /// @param owner the owner of the linnia record
    /// @param dataUri the ipfs path of the re-encrypted data
    function grantAccessbyDelegate(
        bytes32 dataHash, address viewer, address owner, string dataUri)
        onlyDelegate(owner)
        onlyRecordOwnerOf(dataHash, owner)
        public
        returns (bool)
    {
        require(
            _grantAccess(dataHash, viewer, owner, dataUri) == true
        );
        return true;
    }

    /// Revoke a viewer access to a linnia record
    /// Note that this does not necessarily remove the file from storage
    /// Called by owner of the record.
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user that has permission to view the data
    function revokeAccess(
        bytes32 dataHash, address viewer)
        onlyUser
        onlyRecordOwnerOf(dataHash, msg.sender)
        public
        returns (bool)
    {
        require(
            _revokeAccess(dataHash, viewer, msg.sender) == true
        );
        return true;
    }

    /// Revoke a viewer access to a linnia record
    /// Note that this does not necessarily remove the file from storage
    /// Called by delegate to the owner of the record.
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user that has permission to view the data
    /// @param owner the owner of the linnia record
    function revokeAccessbyDelegate(
        bytes32 dataHash, address viewer, address owner)
        onlyDelegate(owner)
        onlyRecordOwnerOf(dataHash, owner)
        public
        returns (bool)
    {
        require(
            _revokeAccess(dataHash, viewer, owner) == true
        );
        return true;
    }

    /// Internal function to give a viewer access to a linnia record
    /// Called by external functions
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user being permissioned to view the data
    /// @param dataUri the ipfs path of the re-encrypted data
    function _grantAccess(bytes32 dataHash, address viewer, address owner, string dataUri)
    whenNotPaused
    internal
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
        emit LinniaAccessGranted(dataHash, owner, viewer, msg.sender);
        return true;
    }

    /// Internal function to revoke a viewer access to a linnia record
    /// Called by external functions
    /// Note that this does not necessarily remove the file from storage
    /// @param dataHash the data hash of the linnia record
    /// @param viewer the user that has permission to view the data
    /// @param owner the owner of the linnia record
    function _revokeAccess(bytes32 dataHash, address viewer, address owner)
    whenNotPaused
    internal
    returns (bool)
    {
        // access must have already been grated
        require(permissions[dataHash][viewer].canAccess);
        permissions[dataHash][viewer] = Permission({
            canAccess: false,
            dataUri: ""
            });
        emit LinniaAccessRevoked(dataHash, owner, viewer, msg.sender);
        return true;
    }
}
