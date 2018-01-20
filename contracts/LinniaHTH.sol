pragma solidity 0.4.18;

import "./Owned.sol";
import "./LinniaHub.sol";
import "./LinniaRoles.sol";
import "./LinniaRecords.sol";

contract LinniaHTH is Owned {
    event PointsAdded(address indexed user, uint points, uint total);

    LinniaHub public hub;
    // points can only be added by admin or RecordsContract
    mapping(address => uint) public score;

    // Modifiers
    modifier onlyFromRecordsContract() {
        require(msg.sender == address(hub.recordsContract()));
        _;
    }

    // Constructor
    function LinniaHTH(LinniaHub _hub, address initialAdmin)
        Owned(initialAdmin)
        public
    {
        hub = _hub;
    }

    function addPoints(address user, uint pointsToAdd)
        onlyFromRecordsContract
        public
        returns (bool)
    {
        require(_changePoints(user, true, pointsToAdd));
        PointsAdded(user, pointsToAdd, score[user]);
        return true;
    }

    function addPointsByAdmin(address user, uint pointsToAdd)
        onlyAdmin
        public
        returns (bool)
    {
        require(_changePoints(user, true, pointsToAdd));
        PointsAdded(user, pointsToAdd, score[user]);
        return true;
    }

    function _changePoints(address user, bool add, uint change)
        private
        returns (bool)
    {
        // XXX: use safemath maybe?
        if (add) {
            score[user] += change;
        } else {
            score[user] -= change;
        }
        return true;
    }
}
