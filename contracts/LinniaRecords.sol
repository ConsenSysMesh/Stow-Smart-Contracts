pragma solidity 0.4.18;

import "./Owned.sol";
import "./LinniaRoles.sol";

contract LinniaRecords is Owned {
    struct FileRecord {
        address patient;
        address doctor;
        // For now the record types are
        // 0 nil, 1 Blood Pressure, 2 A1C, 3 HDL, 4 Triglycerides, 5 Weight
        uint recordType;
        bytes32 ipfsHash; // ipfs hash of the encrypted file
        bytes32 r; // rsv is used for ecrecover
        bytes32 s;
        uint8 v;
    }
    event RecordUploaded(address indexed patient, address indexed doctor,
        bytes32 fileHash);

    // all linnia records
    // filehash => record mapping
    mapping(bytes32 => FileRecord) public records;
    // ipfsHash => sha256 fileHash mapping
    mapping(bytes32 => bytes32) public ipfsRecords;
    LinniaRoles public rolesContract;

    // modifiers
    modifier onlyDoctor() {
        require(rolesContract.roles(msg.sender) == LinniaRoles.Role.Doctor);
        _;
    }

    // Constructor
    function LinniaRecords(LinniaRoles _rolesContract, address initialAdmin)
        Owned(initialAdmin)
        public
    {
        rolesContract = _rolesContract;
    }

    /// Adds metadata to a medical record uploaded to ipfs
    /// This function is called by certified doctors
    /// @param fileHash the hash of the original medical record file
    /// @param patient the address of patient of the file
    /// @param recordType type of the record
    /// @param ipfsHash decoded sha2-256 hash of the ipfs hash
    /// @param r signature of the doctor: R
    /// @param s signature of the doctor: S
    /// @param v signature of the doctor: V
    /// @return true if the operation is successful
    function uploadRecord(bytes32 fileHash, address patient,
        uint recordType, bytes32 ipfsHash,
        bytes32 r, bytes32 s, uint8 v)
        onlyDoctor
        public
        returns (bool)
    {
        require(recordType != 0);
        // the record must be new
        require(records[fileHash].recordType == 0);
        // update the record
        require(_updateRecord(fileHash, patient, msg.sender, recordType,
            ipfsHash, r, s, v));
        RecordUploaded(patient, msg.sender, fileHash);
        return true;
    }

    function updateRecordByAdmin(bytes32 fileHash, address patient,
        address doctor, uint recordType, bytes32 ipfsHash,
        bytes32 r, bytes32 s, uint8 v)
        onlyAdmin
        public
        returns (bool)
    {
        require(_updateRecord(fileHash, patient, doctor, recordType, ipfsHash,
            r, s, v));
        RecordUploaded(patient, doctor, fileHash);
        return true;
    }

    function _updateRecord(bytes32 fileHash, address patient,
        address doctor, uint recordType, bytes32 ipfsHash,
        bytes32 r, bytes32 s, uint8 v)
        private
        returns (bool)
    {
        // the doctor must sign the file hash
        require(recover(fileHash, r, s, v) == doctor);
        // update the record mapping
        records[fileHash] = FileRecord({
            patient: patient,
            doctor: doctor,
            recordType: recordType,
            ipfsHash: ipfsHash,
            r: r,
            s: s,
            v: v
        });
        // update the reverse mapping
        ipfsRecords[ipfsHash] = fileHash;
        return true;
    }

    function recover(bytes32 message, bytes32 r, bytes32 s, uint8 v)
        public pure returns(address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(prefix, message);
        return ecrecover(prefixedHash, v, r, s);
    }
}
