pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaRoles.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";


contract LinniaHub is Ownable {
    LinniaRoles public rolesContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    event LogRolesContractSet(address from, address to);
    event LogRecordsContractSet(address from, address to);
    event LogPermissionsContractSet(address from, address to);

    function LinniaHub() public { }

    function () public { }

    function setRolesContract(LinniaRoles _rolesContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(rolesContract);
        rolesContract = _rolesContract;
        emit LogRolesContractSet(prev, _rolesContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        emit LogRecordsContractSet(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        emit LogPermissionsContractSet(prev, _permissionsContract);
        return true;
    }
}
