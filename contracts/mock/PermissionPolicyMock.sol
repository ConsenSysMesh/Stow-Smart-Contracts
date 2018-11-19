pragma solidity 0.4.24;

import "../interfaces/PermissionPolicyI.sol";


contract /* interface */ PermissionPolicyMock is PermissionPolicyI {

    bool public result = true;

    /// @param dataHash the hash of the data to be scored
    /// @param viewer the user being granted permission to view the data
    /// @param keyUri IPFS hash of the encrypted key to decrypt the record
    function checkPolicy(bytes32 dataHash, address viewer, string keyUri)
        view
        external
    returns (bool)
    {
        return result;
    }

    function setVal(bool newResult) public {
        result = newResult;
    }
}
