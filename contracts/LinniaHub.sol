pragma solidity ^0.4.18;

import "./Owned.sol";
import "./LinniaRoles.sol";
import "./LinniaHTH.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";

contract LinniaHub is Owned {
    LinniaRoles public rolesContract;
    LinniaHTH public hthContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    event RolesContractUpdated(address from, address to);
    event HTHContractUpdated(address from, address to);
    event RecordsContractUpdated(address from, address to);
    event PermissionsContractUpdated(address from, address to);

    function LinniaHub(address initialAdmin)
        Owned(initialAdmin)
        public
    { }

    function setRolesContract(LinniaRoles _rolesContract)
        onlyAdmin
        public
        returns (bool)
    {
        address prev = address(rolesContract);
        rolesContract = _rolesContract;
        RolesContractUpdated(prev, _rolesContract);
        return true;
    }

    function setHTHContract(LinniaHTH _hthContract)
        onlyAdmin
        public
        returns (bool)
    {
        address prev = address(hthContract);
        hthContract = _hthContract;
        HTHContractUpdated(prev, _hthContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyAdmin
        public
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        RecordsContractUpdated(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyAdmin
        public
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        PermissionsContractUpdated(prev, _permissionsContract);
        return true;
    }
}
