pragma solidity 0.4.18;

contract Owned {
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function Owned(address initialAdmin) public {
        if (initialAdmin == 0) {
            admin = msg.sender;
        } else {
            admin = initialAdmin;
        }
    }

    function changeAdmin(address newAdmin) onlyAdmin public {
        admin = newAdmin;
    }
}
