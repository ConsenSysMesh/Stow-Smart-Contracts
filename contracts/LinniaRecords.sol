pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./LinniaHub.sol";
import "./LinniaUsers.sol";


contract LinniaRecords is Ownable {
    using SafeMath for uint;

    // Struct of a linnia record
    // A linnia record is identified by its root hash, which is
    // sha(sha(data), sha(metadata))
    struct Record {
        // owner of the record
        address owner;
        // hash of the data before its encrypted
        bytes32 dataHash;
        // hash of the plaintext metadata
        bytes32 metaHash;
        // attestator signatures
        mapping (address => bool) sigs;
        // count of attestator sigs
        uint sigCount;
        // calculated iris score
        uint irisScore;
        // ipfs path of the encrypted data
        bytes32 dataUri;
        // time the file is added
        uint timestamp;
    }

    event LogRecordAdded(
        bytes32 indexed rootHash, address indexed owner, string metadata
    );
    event LogRecordSigAdded(
        bytes32 indexed rootHash, address indexed attestator, uint irisScore
    );

    LinniaHub public hub;
    // all linnia records
    // rootHash => record mapping
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
    function LinniaRecords(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    /* External functions */

    function addRecordByAdmin(
        bytes32 dataHash, address owner, address attestator,
        string metadata, bytes32 dataUri)
        onlyOwner
        external
        returns (bool)
    {
        bytes32 rootHash = _addRecord(dataHash, owner, metadata, dataUri);
        require(rootHash != 0);
        if (attestator != 0) {
            require(_addSig(rootHash, attestator));
        }
        return true;
    }

    /* Public functions */

    /// Add a record by user without any provider's signatures.
    /// @param dataHash the hash of the data
    /// @param metadata plaintext metadata for the record
    /// @param dataUri the ipfs path of the encrypted data
    function addRecord(
        bytes32 dataHash, string metadata, bytes32 dataUri)
        onlyUser
        public
        returns (bool)
    {
        require(
            _addRecord(dataHash, msg.sender, metadata, dataUri) != 0
        );
        return true;
    }

    /// Add a record by a data provider.
    /// @param dataHash the hash of the data
    /// @param owner owner of the record
    /// @param metadata plaintext metadata for the record
    /// @param dataUri the ipfs path of the encrypted data
    function addRecordByProvider(
        bytes32 dataHash, address owner, string metadata, bytes32 dataUri)
        onlyUser
        hasProvenance(msg.sender)
        public
        returns (bool)
    {
        // add the file first
        bytes32 rootHash = _addRecord(dataHash, owner, metadata, dataUri);
        require(rootHash != 0);
        // add provider's sig to the file
        require(_addSig(rootHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to a linnia record,
    /// i.e. adding an attestation
    /// This function is only callable by a provider
    /// @param rootHash the root hash of the linnia record
    function addSigByProvider(bytes32 rootHash)
        hasProvenance(msg.sender)
        public
        returns (bool)
    {
        require(_addSig(rootHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to a linnia record
    /// i.e. adding an attestation
    /// This function can be called by anyone. As long as the signatures are
    /// indeed from a provider, the sig will be added to the record.
    /// The signature should cover the root hash
    /// @param rootHash the root hash of the linnia record
    /// @param r signature: R
    /// @param s signature: S
    /// @param v signature: V
    function addSig(bytes32 rootHash, bytes32 r, bytes32 s, uint8 v)
        public
        returns (bool)
    {
        // recover the provider's address from signature
        address provider = recover(rootHash, r, s, v);
        // add sig
        require(_addSig(rootHash, provider));
        return true;
    }

    function recover(bytes32 message, bytes32 r, bytes32 s, uint8 v)
        public pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(prefix, message);
        return ecrecover(prefixedHash, v, r, s);
    }

    function recordOwnerOf(bytes32 rootHash)
        public view returns (address)
    {
        return records[rootHash].owner;
    }

    function sigExists(bytes32 fileHash, address provider)
        public view returns (bool)
    {
        return records[fileHash].sigs[provider];
    }

    /* Internal functions */

    function _addRecord(
        bytes32 dataHash, address owner, string metadata, bytes32 dataUri)
        internal
        returns (bytes32)
    {
        // validate input
        require(dataHash != 0 && dataUri != 0);
        // calculate root hash
        bytes32 metaHash = keccak256(metadata);
        bytes32 rootHash = keccak256(dataHash, metaHash);
        // the file must be new
        require(
            records[rootHash].timestamp == 0
        );
        // verify owner
        require(hub.usersContract().isUser(owner) == true);
        // add record
        records[rootHash] = Record({
            owner: owner,
            dataHash: dataHash,
            metaHash: metaHash,
            sigCount: 0,
            irisScore: 0,
            dataUri: dataUri,
            // solium-disable-next-line security/no-block-members
            timestamp: block.timestamp
        });
        // emit event
        LogRecordAdded(rootHash, owner, metadata);
        return rootHash;
    }

    function _addSig(bytes32 rootHash, address provider)
        hasProvenance(provider)
        internal
        returns (bool)
    {
        Record storage record = records[rootHash];
        // the file must exist
        require(record.timestamp != 0);
        // the provider must not have signed the file already
        require(!record.sigs[provider]);
        uint provenanceScore = hub.usersContract().provenanceOf(provider);
        // add signature
        record.sigCount = record.sigCount.add(provenanceScore);
        record.sigs[provider] = true;
        // update iris score
        record.irisScore = record.irisScore.add(provenanceScore);
        // emit event
        LogRecordSigAdded(rootHash, provider, record.irisScore);
        return true;
    }
}
