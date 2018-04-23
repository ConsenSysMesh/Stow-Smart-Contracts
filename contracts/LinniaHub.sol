pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaUsers.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";


contract LinniaHub is Ownable {
    LinniaUsers public usersContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    event LogUsersContractSet(address from, address to);
    event LogRecordsContractSet(address from, address to);
    event LogPermissionsContractSet(address from, address to);

    function LinniaHub() public { }

    function () public { }

    function setUsersContract(LinniaUsers _usersContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(usersContract);
        usersContract = _usersContract;
        LogUsersContractSet(prev, _usersContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        LogRecordsContractSet(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        LogPermissionsContractSet(prev, _permissionsContract);
        return true;
    }
}
