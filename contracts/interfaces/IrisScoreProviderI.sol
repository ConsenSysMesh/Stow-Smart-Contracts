pragma solidity 0.4.24;


contract /* interface */ IrisScoreProviderI {

    /// report the IRIS score for the dasaHash records
    /// @param dataHash the hash of the data to be scored
    function report(bytes32 dataHash)
        public
        view
        returns (uint256);
}
