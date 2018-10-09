pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./LinniaHub.sol";
import "./LinniaUsers.sol";


contract LinniaRecords is Ownable, Pausable, Destructible {
    using SafeMath for uint;

    // Struct of a linnia record
    // A linnia record is identified by its data hash, which is
    // keccak256(data)
    struct Record {
        // owner of the record
        address owner;
        // hash of the plaintext metadata
        bytes32 metadataHash;
        // attestator signatures
        mapping (address => bool) sigs;
        // count of attestator sigs
        uint sigCount;
        // calculated iris score
        uint irisScore;
        // ipfs path of the encrypted data
        string dataUri;
        // timestamp of the block when the record is added
        uint timestamp;
    }

    event LinniaRecordAdded(
        bytes32 indexed dataHash, address indexed owner, string metadata
    );
    event LinniaRecordSigAdded(
        bytes32 indexed dataHash, address indexed attestator, uint irisScore
    );

    event LinniaReward (bytes32 indexed dataHash, address indexed owner, uint256 value, address tokenContract);

    LinniaHub public hub;
    // all linnia records
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
    constructor(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    function addRecordByAdmin(
        bytes32 dataHash, address owner, address attestator,
        string metadata, string dataUri)
        onlyOwner
        whenNotPaused
        external
        returns (bool)
    {
        require(_addRecord(dataHash, owner, metadata, dataUri) == true);
        if (attestator != address(0)) {
            require(_addSig(dataHash, attestator));
        }
        return true;
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
        emit LinniaReward (dataHash, msg.sender, reward, token);
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

    /// Add a provider's signature to a linnia record,
    /// i.e. adding an attestation
    /// This function is only callable by a provider
    /// @param dataHash the data hash of the linnia record
    function addSigByProvider(bytes32 dataHash)
        hasProvenance(msg.sender)
        whenNotPaused
        public
        returns (bool)
    {
        require(_addSig(dataHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to a linnia record
    /// i.e. adding an attestation
    /// This function can be called by anyone. As long as the signatures are
    /// indeed from a provider, the sig will be added to the record.
    /// The signature should cover the root hash, which is
    /// hash(hash(data), hash(metadata))
    /// @param dataHash the data hash of a linnia record
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
        emit LinniaRecordAdded(dataHash, owner, metadata);
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
        emit LinniaRecordSigAdded(dataHash, provider, record.irisScore);
        return true;
    }
}
