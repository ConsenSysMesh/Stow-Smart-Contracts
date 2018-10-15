pragma solidity ^0.4.24;


contract LinniaWhitelistI {

    event LogExpertScoreUpdated(
    address indexed user,
    uint indexed score);
    
    mapping(address => uint) public expertScores;
    
    function expertScoreOf(address user) public view returns(uint); 

}  