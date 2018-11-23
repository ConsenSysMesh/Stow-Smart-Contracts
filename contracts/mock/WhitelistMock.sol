pragma solidity ^0.4.24;

import "../StowWhitelistI.sol";
import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract WhitelistMock is  StowWhitelistI, Ownable, Destructible {

    function updateScore(address user, uint score)
    	public
    	onlyOwner
    	returns(bool)
    {
        expertScores[user] = score;
        emit LogExpertScoreUpdated(user, score);
        return true;
    }

    function expertScoreOf(address user)
    	public
    	view
    	returns(uint)
    {
        return expertScores[user];
    }

}
