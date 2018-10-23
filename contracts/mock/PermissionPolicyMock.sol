pragma solidity 0.4.24;

import "../interfaces/PermissionPolicyI.sol";


contract /* interface */ PermissionPolicyMock {

    bool public result = true;

    /// @param viewer the user being granted permission to view the data
    /// @param dataUri the path of the re-encrypted data
    /// @param dataHash the hash of the data to be scored
    function checkPolicy(bytes32 dataHash, address viewer, string dataUri)
        view
        external
    returns (bool)
    {
        return result;
    }

    function setVal(bool newResult) external {
        result = newResult;
    }
}
