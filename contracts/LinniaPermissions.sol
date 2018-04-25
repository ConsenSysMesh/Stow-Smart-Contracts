pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaHub.sol";
import "./LinniaRecords.sol";
import "./LinniaUsers.sol";


contract LinniaPermissions is Ownable {
    struct Permission {
        bool canAccess;
        // IPFS hash of the file, encrypted to the viewer
        bytes32 ipfsHash;
    }

    event LogAccessGranted(address indexed fileOwner, address indexed viewer,
    bytes32 fileHash);
    event LogAccessRevoked(address indexed fileOwner, address indexed viewer,
    bytes32 fileHash);

    LinniaHub public hub;
    // filehash => viewer => permission mapping
    mapping(bytes32 => mapping(address => Permission)) public permissions;

    /* Modifiers */
    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    modifier onlyFileOwnerOf(bytes32 fileHash) {
        require(hub.recordsContract().fileOwnerOf(fileHash) == msg.sender);
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
    /// @param fileHash the hash of the unencrypted file
    /// @param viewer the user being allowed to view the file
    /// @param ipfsHash the IPFS hash of the file encrypted to viewer
    function grantAccess(bytes32 fileHash, address viewer, bytes32 ipfsHash)
        onlyUser
        onlyFileOwnerOf(fileHash)
        external
        returns (bool)
    {
        // access must not have already been granted
        require(!permissions[fileHash][viewer].canAccess);
        permissions[fileHash][viewer] = Permission({
            canAccess: true,
            ipfsHash: ipfsHash
        });
        LogAccessGranted(msg.sender, viewer, fileHash);
        return true;
    }

    /// Revoke a viewer access to a document
    /// Note that this does not remove the file off IPFS
    /// @param fileHash the hash of the unencrytped file
    /// @param viewer the user being allowed to view the file
    function revokeAccess(bytes32 fileHash, address viewer)
        onlyUser
        onlyFileOwnerOf(fileHash)
        external
        returns (bool)
    {
        // access must have already been grated
        require(permissions[fileHash][viewer].canAccess);
        permissions[fileHash][viewer] = Permission({
            canAccess: false,
            ipfsHash: 0
        });
        LogAccessRevoked(msg.sender, viewer, fileHash);
        return true;
    }
}
