pragma solidity 0.4.24;


contract /* interface */ PermissionPolicyI {

    /// check permission policy then return true if condition are met
    /// @param viewer the user being granted permission to view the data
    /// @param dataUri the path of the re-encrypted data
    /// @param dataHash the hash of the data to be scored
    function checkPolicy(bytes32 dataHash, address viewer, string dataUri)
        view
        external
        returns (bool);
}
