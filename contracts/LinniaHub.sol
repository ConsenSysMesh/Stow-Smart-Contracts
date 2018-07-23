pragma solidity 0.4.24;


import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaUsers.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";


contract LinniaHub is Ownable, Destructible {
    LinniaUsers public usersContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    event LogLinniaUsersContractSet(address from, address to);
    event LogLinniaRecordsContractSet(address from, address to);
    event LogLinniaPermissionsContractSet(address from, address to);

    constructor() public { }

    function () public { }

    function setUsersContract(LinniaUsers _usersContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(usersContract);
        usersContract = _usersContract;
        emit LogLinniaUsersContractSet(prev, _usersContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        emit LogLinniaRecordsContractSet(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        emit LogLinniaPermissionsContractSet(prev, _permissionsContract);
        return true;
    }
}
