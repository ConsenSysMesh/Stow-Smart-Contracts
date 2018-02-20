pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaRoles.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";


contract LinniaHub is Ownable {
    LinniaRoles public rolesContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    event RolesContractUpdated(address from, address to);
    event RecordsContractUpdated(address from, address to);
    event PermissionsContractUpdated(address from, address to);

    function LinniaHub() public { }

    function setRolesContract(LinniaRoles _rolesContract)
        onlyOwner
        public
        returns (bool)
    {
        address prev = address(rolesContract);
        rolesContract = _rolesContract;
        RolesContractUpdated(prev, _rolesContract);
        return true;
    }

    function setRecordsContract(LinniaRecords _recordsContract)
        onlyOwner
        public
        returns (bool)
    {
        address prev = address(recordsContract);
        recordsContract = _recordsContract;
        RecordsContractUpdated(prev, _recordsContract);
        return true;
    }

    function setPermissionsContract(LinniaPermissions _permissionsContract)
        onlyOwner
        public
        returns (bool)
    {
        address prev = address(permissionsContract);
        permissionsContract = _permissionsContract;
        PermissionsContractUpdated(prev, _permissionsContract);
        return true;
    }
}
