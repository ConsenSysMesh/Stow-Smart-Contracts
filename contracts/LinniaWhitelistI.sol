pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract LinniaWhitelistI is Ownable, Destructible {

    event LogExpertScoreUpdated(
    address indexed user,
    uint indexed score);
    
    mapping(address => uint) public expertScores;
    
    function expertScoreOf(address user) 
    public
    view
    returns(uint) 
    {
        return expertScores[user];
    }

    function updateScore(address user, uint score) public returns(bool);
}  