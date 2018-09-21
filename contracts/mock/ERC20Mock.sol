pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

/**
 * @title Mock Test Token Contract
 * @dev Based on ERC20 standard
 * @dev Following https://consensys.github.io/smart-contract-best-practices/tokens/
 */

contract ERC20Mock is PausableToken, DetailedERC20 {

    string public name = "Test TOKEN";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    /*------------------------------------constructor------------------------------------*/
    /**
     * @dev constructor for mock token
     */
    constructor()
    DetailedERC20(name, symbol, decimals)
    public {
        paused = true;
        totalSupply_ = 10 ** 27;
        balances[msg.sender] = totalSupply_;
        emit Transfer(address(0), msg.sender, balances[msg.sender]);
    }

    /**
    * @dev override Transfer token for a specified address
    * @dev Prevent transferring tokens to the contract address
    * @param to The address to transfer to.
    * @param value The amount to be transferred.
    */
    function transfer(address to, uint256 value) public returns (bool) {
        super.transfer(to, value);
        return true;
    }

    /**
     * @dev override Transfer tokens from one address to another
     * @dev Prevent transferring tokens to the contract address
     * @param from address The address which you want to send tokens from
     * @param to address The address which you want to transfer to
     * @param value uint256 the amount of tokens to be transferred
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    )
    public returns (bool)
    {
        require(to != address(this), "attempt to send to contact address.");
        super.transferFrom(from, to, value);
    }
}
