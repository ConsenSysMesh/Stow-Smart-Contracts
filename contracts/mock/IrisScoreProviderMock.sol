pragma solidity 0.4.24;

import "../interfaces/IrisScoreProviderI.sol";


contract IrisScoreProviderMock is IrisScoreProviderI{

    uint256 public val = 42;

    function report(bytes32 dataHash) public view returns (uint256) {
        require(dataHash != 0);
        return val;
    }

    function setVal(uint256 newVale) public {
        val = newVale;
    }
}
