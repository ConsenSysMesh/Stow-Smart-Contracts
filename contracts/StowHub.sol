pragma solidity 0.4.24;


import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./StowUsers.sol";
import "./StowRecords.sol";
import "./StowPermissions.sol";


contract StowHub is Ownable, Destructible {
    StowUsers public usersContract;
    StowRecords public recordsContract;
    StowPermissions public permissionsContract;

    event StowUsersContractSet(address from, address to);
    event StowRecordsContractSet(address from, address to);
    event StowPermissionsContractSet(address from, address to);

    constructor() public { }

    function () public { }

    function setUsersContract(StowUsers _usersContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(usersContract);
        usersContract = _usersContract;
        emit StowUsersContractSet(prev, _usersContract);
        return true;
    }

    function setRecordsContract(StowRecords _recordsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        emit StowRecordsContractSet(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(StowPermissions _permissionsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        emit StowPermissionsContractSet(prev, _permissionsContract);
        return true;
    }
}
