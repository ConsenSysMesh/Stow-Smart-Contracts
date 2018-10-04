pragma solidity 0.4.24;

import "../interfaces/IrisScoreProviderI.sol";


contract IrisScoreProviderMock {

    function report(bytes32 dataHash) public pure returns (uint) {
        require(dataHash != 0);
        return 42;
    }
}
