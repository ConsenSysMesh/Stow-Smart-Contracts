pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./StowHub.sol";
import "./StowUsers.sol";
import "./interfaces/IrisScoreProviderI.sol";



contract StowRecords is Ownable, Pausable, Destructible {
    using SafeMath for uint;

    // Struct of a stow record
    // A stow record is identified by its data hash, which is
    // keccak256(data + optional nonce)
    struct Record {
        // owner of the record
        address owner;
        // hash of the plaintext metadata
        bytes32 metadataHash;
        // attester signatures
        mapping (address => bool) sigs;
        // count of attester sigs
        uint sigCount;
        // calculated iris score
        uint irisScore;
        // ipfs path of the encrypted data
        string dataUri;
        // timestamp of the block when the record is added
        uint timestamp;
        // non zero score returned from the specific IRIS provider oracles
        mapping (address => uint256)  irisProvidersReports;
    }

    event StowUpdateRecordsIris(
        bytes32 indexed dataHash, address indexed irisProvidersAddress, uint256 val, address indexed sender)
    ;

    event StowRecordAdded(
        bytes32 indexed dataHash, address indexed owner, string metadata
    );

    event StowRecordSigAdded(
        bytes32 indexed dataHash, address indexed attester, uint irisScore
    );

    event StowReward(bytes32 indexed dataHash, address indexed owner, uint256 value, address tokenContract);

    StowHub public hub;
    // all stow records
    // dataHash => record mapping
    mapping(bytes32 => Record) public records;

    /* Modifiers */

    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    modifier hasProvenance(address user) {
        require(hub.usersContract().provenanceOf(user) > 0);
        _;
    }

    /* Constructor */
    constructor(StowHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    function addRecordByAdmin(
        bytes32 dataHash, address owner, address attester,
        string metadata, string dataUri)
        onlyOwner
        whenNotPaused
        external
        returns (bool)
    {
        require(_addRecord(dataHash, owner, metadata, dataUri) == true);
        if (attester != address(0)) {
            require(_addSig(dataHash, attester));
        }
        return true;
    }

    /// @param dataHash the datahash of the record to be scored
    /// @param irisProvidersAddress address of the oracle contract
    function updateIris(bytes32 dataHash, address irisProvidersAddress)
        external
        onlyOwner
        whenNotPaused
        returns (uint256)
    {
        require(irisProvidersAddress != address(0));
        require(dataHash != 0);

        Record storage record = records[dataHash];
        require(records[dataHash].timestamp != 0);

        // make sure the irisProviders is only called once
        require(record.irisProvidersReports[irisProvidersAddress] == 0);

        IrisScoreProviderI currOracle = IrisScoreProviderI(irisProvidersAddress);
        uint256 val = currOracle.report(dataHash);
        // zero and less values are reverted
        require(val > 0);
        record.irisScore = record.irisScore.add(val);

        // keep a record of iris score breakdown
        record.irisProvidersReports[irisProvidersAddress] = val;
        emit StowUpdateRecordsIris(dataHash, irisProvidersAddress, val, msg.sender);
        return val;
    }

    function getIrisProvidersReport(bytes32 dataHash, address irisProvider)
        external
        view
        returns (uint256)
    {
        return records[dataHash].irisProvidersReports[irisProvider];
    }

    /* Public functions */

    /// Add a record by user without any provider's signatures.
    /// @param dataHash the hash of the data
    /// @param metadata plaintext metadata for the record
    /// @param dataUri the ipfs path of the encrypted data
    function addRecord(
        bytes32 dataHash, string metadata, string dataUri)
        onlyUser
        whenNotPaused
        public
        returns (bool)
    {
        require(
            _addRecord(dataHash, msg.sender, metadata, dataUri) == true
        );
        return true;
    }

    /// Add a record by user without any provider's signatures and get a reward.
    ///
    /// @param dataHash the hash of the data
    /// @param metadata plaintext metadata for the record
    /// @param dataUri the data uri path of the encrypted data
    /// @param token the ERC20 token address for the rewarding token
    function addRecordwithReward (
        bytes32 dataHash, string metadata, string dataUri, address token)
        onlyUser
        whenNotPaused
        public
        returns  (bool)
    {
        // the amount of tokens to be transferred
        uint256 reward = 1 finney;
        require (token != address (0));
        require (token != address (this));
        ERC20 tokenInstance = ERC20 (token);
        require (
            _addRecord (dataHash, msg.sender, metadata, dataUri) == true
        );
        // tokens are provided by the contracts balance
        require(tokenInstance.transfer (msg.sender, reward));
        emit StowReward (dataHash, msg.sender, reward, token);
        return true;
    }

    /// Add a record by a data provider.
    /// @param dataHash the hash of the data
    /// @param owner owner of the record
    /// @param metadata plaintext metadata for the record
    /// @param dataUri the ipfs path of the encrypted data
    function addRecordByProvider(
        bytes32 dataHash, address owner, string metadata, string dataUri)
        onlyUser
        hasProvenance(msg.sender)
        whenNotPaused
        public
        returns (bool)
    {
        // add the file first
        require(_addRecord(dataHash, owner, metadata, dataUri) == true);
        // add provider's sig to the file
        require(_addSig(dataHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to a stow record,
    /// i.e. adding an attestation
    /// This function is only callable by a provider
    /// @param dataHash the data hash of the stow record
    function addSigByProvider(bytes32 dataHash)
        hasProvenance(msg.sender)
        whenNotPaused
        public
        returns (bool)
    {
        require(_addSig(dataHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to a stow record
    /// i.e. adding an attestation
    /// This function can be called by anyone. As long as the signatures are
    /// indeed from a provider, the sig will be added to the record.
    /// The signature should cover the root hash, which is
    /// hash(hash(data), hash(metadata))
    /// @param dataHash the data hash of a stow record
    /// @param r signature: R
    /// @param s signature: S
    /// @param v signature: V
    function addSig(bytes32 dataHash, bytes32 r, bytes32 s, uint8 v)
        public
        whenNotPaused
        returns (bool)
    {
        // find the root hash of the record
        bytes32 rootHash = rootHashOf(dataHash);
        // recover the provider's address from signature
        address provider = recover(rootHash, r, s, v);
        // add sig
        require(_addSig(dataHash, provider));
        return true;
    }

    function recover(bytes32 message, bytes32 r, bytes32 s, uint8 v)
        public pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, message));
        return ecrecover(prefixedHash, v, r, s);
    }

    function recordOwnerOf(bytes32 dataHash)
        public view returns (address)
    {
        return records[dataHash].owner;
    }

    function rootHashOf(bytes32 dataHash)
        public view returns (bytes32)
    {
        return keccak256(abi.encodePacked(dataHash, records[dataHash].metadataHash));
    }

    function sigExists(bytes32 dataHash, address provider)
        public view returns (bool)
    {
        return records[dataHash].sigs[provider];
    }

    /* Internal functions */

    function _addRecord(
        bytes32 dataHash, address owner, string metadata, string dataUri)
        internal
        returns (bool)
    {
        // validate input
        require(dataHash != 0);
        require(bytes(dataUri).length != 0);
        bytes32 metadataHash = keccak256(abi.encodePacked(metadata));

        // the file must be new
        require(records[dataHash].timestamp == 0);
        // verify owner
        require(hub.usersContract().isUser(owner) == true);
        // add record
        records[dataHash] = Record({
            owner: owner,
            metadataHash: metadataHash,
            sigCount: 0,
            irisScore: 0,
            dataUri: dataUri,
            // solium-disable-next-line security/no-block-members
            timestamp: block.timestamp
            });
        // emit event
        emit StowRecordAdded(dataHash, owner, metadata);
        return true;
    }

    function _addSig(bytes32 dataHash, address provider)
        hasProvenance(provider)
        internal
        returns (bool)
    {
        Record storage record = records[dataHash];
        // the file must exist
        require(record.timestamp != 0);
        // the provider must not have signed the file already
        require(!record.sigs[provider]);
        uint provenanceScore = hub.usersContract().provenanceOf(provider);
        // add signature
        record.sigCount = record.sigCount.add(1);
        record.sigs[provider] = true;
        // update iris score
        record.irisScore = record.irisScore.add(provenanceScore);
        // emit event
        emit StowRecordSigAdded(dataHash, provider, record.irisScore);
        return true;
    }
}
