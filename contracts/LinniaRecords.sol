pragma solidity ^0.4.18;

import "node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./LinniaHub.sol";
import "./LinniaUsers.sol";


contract LinniaRecords is Ownable {
    using SafeMath for uint;

    struct FileRecord {
        address fileOwner;
        uint sigCount;
        mapping (address => bool) sigs;
        uint irisScore;
        bytes32 ipfsHash; // ipfs path of the encrypted file
        uint timestamp; // time the file is added
    }

    event LogRecordAdded(
        bytes32 indexed fileHash, address indexed fileOwner, string keywords
    );
    event LogRecordSigAdded(
        bytes32 indexed fileHash, address indexed attestator, uint irisScore
    );

    LinniaHub public hub;
    // all linnia records
    // filehash => record mapping
    mapping(bytes32 => FileRecord) public records;
    // reverse mapping: ipfsHash => sha256 fileHash
    mapping(bytes32 => bytes32) public ipfsRecords;

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
        bytes32 fileHash, address fileOwner, address attestator,
        string keywords, bytes32 ipfsHash)
        onlyOwner
        external
        returns (bool)
    {
        require(
            _addRecord(fileHash, fileOwner, keywords, ipfsHash)
        );
        if (attestator != 0) {
            require(_addSig(fileHash, attestator));
        }
        return true;
    }

    /* Public functions */

    /// Add a record by user without any provider's signatures.
    /// @param fileHash the hash of the original unencrypted file
    /// @param keywords keywords for the record
    /// @param ipfsHash the sha2-256 hash of the file on IPFS
    function addRecord(
        bytes32 fileHash, string keywords, bytes32 ipfsHash)
        onlyUser
        public
        returns (bool)
    {
        require(
            _addRecord(fileHash, msg.sender, keywords, ipfsHash)
        );
        return true;
    }

    /// Add a record by a data provider.
    /// @param fileHash the hash of the original unencrypted file
    /// @param fileOwner the address of the file owner
    /// @param keywords keywords for the record
    /// @param ipfsHash the sha2-256 hash of the file on IPFS
    function addRecordByProvider(
        bytes32 fileHash, address fileOwner, string keywords, bytes32 ipfsHash)
        onlyUser
        hasProvenance(msg.sender)
        public
        returns (bool)
    {
        // add the file first
        require(
            _addRecord(fileHash, fileOwner, keywords, ipfsHash)
        );
        // add provider's sig to the file
        require(_addSig(fileHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to an existing file
    /// This function is only callable by a provider
    /// @param fileHash the hash of the original file
    function addSigByProvider(bytes32 fileHash)
        hasProvenance(msg.sender)
        public
        returns (bool)
    {
        require(_addSig(fileHash, msg.sender));
        return true;
    }

    /// Add a provider's signature to an existing file.
    /// This function can be called by anyone. As long as the signatures are
    /// indeed from a provider, the sig will be added to the file record
    /// @param fileHash the hash of the original file
    /// @param r signature: R
    /// @param s signature: S
    /// @param v signature: V
    function addSig(bytes32 fileHash, bytes32 r, bytes32 s, uint8 v)
        public
        returns (bool)
    {
        // recover the provider's address from signature
        address provider = recover(fileHash, r, s, v);
        // add sig
        require(_addSig(fileHash, provider));
        return true;
    }

    function recover(bytes32 message, bytes32 r, bytes32 s, uint8 v)
        public pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(prefix, message);
        return ecrecover(prefixedHash, v, r, s);
    }

    function fileOwnerOf(bytes32 fileHash)
        public view returns (address)
    {
        return records[fileHash].fileOwner;
    }

    function sigExists(bytes32 fileHash, address provider)
        public view returns (bool)
    {
        return records[fileHash].sigs[provider];
    }

    /* Internal functions */

    function _addRecord(
        bytes32 fileHash, address fileOwner, string keywords, bytes32 ipfsHash)
        internal
        returns (bool)
    {
        // validate input
        require(fileHash != 0 && ipfsHash != 0);
        // the file must be new
        require(
            records[fileHash].timestamp == 0 && ipfsRecords[ipfsHash] == 0
        );
        // verify owner
        require(hub.usersContract().isUser(fileOwner) == true);
        // add record
        records[fileHash] = FileRecord({
            fileOwner: fileOwner,
            sigCount: 0,
            irisScore: 0,
            ipfsHash: ipfsHash,
            // solium-disable-next-line security/no-block-members
            timestamp: block.timestamp
        });
        // add the reverse mapping
        ipfsRecords[ipfsHash] = fileHash;
        // emit event
        LogRecordAdded(fileHash, fileOwner, keywords);
        return true;
    }

    function _addSig(bytes32 fileHash, address provider)
        hasProvenance(provider)
        internal
        returns (bool)
    {
        FileRecord storage record = records[fileHash];
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
        LogRecordSigAdded(fileHash, provider, record.irisScore);
        return true;
    }
}
