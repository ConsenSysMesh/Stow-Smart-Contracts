pragma solidity 0.4.24;


import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaUsers.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";
import "./LinniaPolicies.sol";


contract LinniaHub is Ownable, Destructible {
    LinniaUsers public usersContract;
    LinniaRecords public recordsContract;
    LinniaPolicies public policiesContract;
    LinniaPermissions public permissionsContract;

    event LinniaUsersContractSet(address from, address to);
    event LinniaRecordsContractSet(address from, address to);
    event LinniaPoliciesContractSet(address from, address to);
    event LinniaPermissionsContractSet(address from, address to);

    constructor() public { }

    function () public { }

    function setUsersContract(LinniaUsers _usersContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(usersContract);
        usersContract = _usersContract;
        emit LinniaUsersContractSet(prev, _usersContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        emit LinniaRecordsContractSet(prev, _recordsContract);
        return true;
    }

    function setPoliciesContract(LinniaPolicies _policiesContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(policiesContract);
        policiesContract = _policiesContract;
        emit LinniaPoliciesContractSet(prev, _policiesContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        emit LinniaPermissionsContractSet(prev, _permissionsContract);
        return true;
    }
}
