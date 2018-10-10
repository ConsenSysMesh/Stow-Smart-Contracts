pragma solidity ^0.4.24;

import "../LinniaWhitelistI.sol";


contract WhitelistMock is  LinniaWhitelistI {
    function updateScore(address user, uint score)
    public
    onlyOwner
    returns(bool)
    {
        expertScores[user] = score;
        emit LogExpertScoreUpdated(user, score);
        return true;
    }
  
}