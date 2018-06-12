pragma solidity 0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./LinniaUsers.sol";
import "./LinniaRecords.sol";
import "./LinniaPermissions.sol";
import "./LinniaFacet.sol";


contract LinniaHub is Ownable {
    using SafeMath for uint;

    LinniaUsers public usersContract;
    LinniaRecords public recordsContract;
    LinniaPermissions public permissionsContract;

    mapping(uint => FacetContract) public facetContracts;
    uint public facetCount;

    event LogUsersContractSet(address from, address to);
    event LogRecordsContractSet(address from, address to);
    event LogPermissionsContractSet(address from, address to);
    event LogFacetContractSet(address to, uint facetCount);

    constructor() public { }

    function () public { }

    function setUsersContract(LinniaUsers _usersContract)
        onlyOwner
        external
        returns (bool)
    {
        address prev = address(usersContract);
        usersContract = _usersContract;
        emit LogUsersContractSet(prev, _usersContract);
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

    function setFacetContract(address _facetAddress)
        onlyOwner
        external
        returns (bool)
    {
        faceContracts[facetCount] = _facetAddress;
        facetCount = facetCount.add(1);
        emit LogFacetContractSet(_facetAddress, facetCount);
        return true;
    }
}
