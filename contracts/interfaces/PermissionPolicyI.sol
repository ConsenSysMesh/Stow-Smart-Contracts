pragma solidity 0.4.24;


contract /* interface */ PermissionPolicyI {

    /// check permission policy then return true if condition are met
    /// @param dataHash the hash of the data to be scored
    /// @param viewer the user being granted permission to view the data
    /// @param keyUri IPFS hash of the encrypted key to decrypt the record
    function checkPolicy(bytes32 dataHash, address viewer, string keyUri)
        view
        external
        returns (bool);
}
