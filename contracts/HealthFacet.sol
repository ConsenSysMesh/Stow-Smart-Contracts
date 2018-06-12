pragma solidity 0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Facet {
  using SafeMath for uint;
  
  string public name = "Health";
  string public symbol = "MED";
  
  // note that provenance score for user is specific to 
  mapping(address => uint) provenanceScore;
  
  function provenanceOf(address user) returns(uint) {
   return provenanceScore[user];
  }
  
  // Timestamp, Location, 
  function irisScore(address owner, address[] attestators, string metadata) returns(uint) {

  }
} 