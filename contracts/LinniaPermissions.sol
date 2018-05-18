pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaHub.sol";
import "./LinniaRecords.sol";
import "./LinniaUsers.sol";


contract LinniaPermissions is Ownable {
    struct Permission {
        bool canAccess;
        // ipfs path of the data, encrypted to the viewer
        bytes32 dataUri;
    }

    event LogAccessGranted(bytes32 indexed rootHash, address indexed owner,
        address indexed viewer
    );
    event LogAccessRevoked(bytes32 indexed rootHash, address indexed owner,
        address indexed viewer
    );

    LinniaHub public hub;
    // rootHash => viewer => permission mapping
    mapping(bytes32 => mapping(address => Permission)) public permissions;

    /* Modifiers */
    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    modifier onlyRecordOwnerOf(bytes32 rootHash) {
        require(hub.recordsContract().recordOwnerOf(rootHash) == msg.sender);
        _;
    }

    /* Constructor */
    function LinniaPermissions(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    /// Give a viewer access to a medical record owned by a patient
    /// @param rootHash the root hash of the linnia record
    /// @param viewer the user being permissioned to view the data
    /// @param dataUri the ipfs path of the re-encrypted data
    function grantAccess(bytes32 rootHash, address viewer, bytes32 dataUri)
        onlyUser
        onlyRecordOwnerOf(rootHash)
        external
        returns (bool)
    {
        // check input
        require(viewer != 0);
        require(dataUri != 0);
        // access must not have already been granted
        require(!permissions[rootHash][viewer].canAccess);
        permissions[rootHash][viewer] = Permission({
            canAccess: true,
            dataUri: dataUri
        });
        LogAccessGranted(rootHash, msg.sender, viewer);
        return true;
    }

    /// Revoke a viewer access to a document
    /// Note that this does not remove the file off IPFS
    /// @param rootHash the root hash of the linnia record
    /// @param viewer the user that has permission to view the data
    function revokeAccess(bytes32 rootHash, address viewer)
        onlyUser
        onlyRecordOwnerOf(rootHash)
        external
        returns (bool)
    {
        // access must have already been grated
        require(permissions[rootHash][viewer].canAccess);
        permissions[rootHash][viewer] = Permission({
            canAccess: false,
            dataUri: 0
        });
        LogAccessRevoked(rootHash, msg.sender, viewer);
        return true;
    }
}
