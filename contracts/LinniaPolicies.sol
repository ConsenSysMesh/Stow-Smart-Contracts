pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./LinniaHub.sol";

import "./interfaces/PolicyI.sol";

/**

    This contract acts as a container for all policy related logic in Stow protocol.

    A policy is a smart contract that looks at the state of a record or a permission
    and validates whether certain logic is true. Policies are used when creating records
    and granting access to records to make sure that certain contraints are being met.
    Users can choose to add and remove constraints their own records. App creators can
    also choose to conform to policies while faciliating the permissioning of their user's
    files.

**/

contract LinniaPolicies is Pausable, Destructible {

    /* @dev dataHash of record => policies for the record */
    mapping(bytes32 => address[]) public recordPolicies;

    LinniaHub public hub;

    event LinniaPolicyChecked(
        bytes32 indexed dataHash,
        string dataUri,
        address indexed viewer,
        address indexed policy,
        bool isOk,
        address sender
    );

    /* Constructor */
    constructor(LinniaHub _hub) public {
        hub = _hub;
    }

    /* Fallback function */
    function () public { }

    modifier onlyRecordOwnerOf(bytes32 dataHash) {
        require(hub.recordsContract().recordOwnerOf(dataHash) == msg.sender);
        _;
    }

    modifier onlyUser() {
        require(hub.usersContract().isUser(msg.sender) == true);
        _;
    }

    /* @dex checks an array of policies to make sure they are valid */
    /* @param dataHash the dataHash of the record being checked */
    /* @param viewer the address of the person being given access the record */
    /* @param dataUri where the record is */
    /* @param policies an array of the policy conforming addresses */
    function policiesAreValid(
        bytes32 dataHash,
        address viewer,
        string dataUri,
        address[] policies)
        public
        returns (bool)
    {
        /* @dev check policies and fail on first one that is not ok */
        for (uint i = 0; i < policies.length; i++) {
            address curPolicy = policies[i];
            require(policyIsValid(dataHash, viewer, dataUri, curPolicy));
        }

        return true;
    }

    /* @dev checks if a new permission follows existing record policies */
    /* @param dataHash the dataHash of the record being checked */
    /* @param viewer the address of the person being given access the record */
    /* @param dataUri where the record is */
    function followsExistingPolicies(
        bytes32 dataHash,
        address viewer,
        string dataUri)
        public
        returns (bool)
    {
        return policiesAreValid(
            dataHash,
            viewer,
            dataUri,
            recordPolicies[dataHash]
        );
    }

    function policiesForRecord(bytes32 dataHash) view returns (address[]) {
        return recordPolicies[dataHash];
    }

    /* @dev checks an array of policies to make sure they are valid */
    /* @param dataHash the dataHash of the record being checked */
    /* @param viewer the address of the person being given access the record */
    /* @param dataUri where the record is */
    /* @param policies an array of the policy conforming addresses */
    function policyIsValid(
        bytes32 dataHash,
        address viewer,
        string dataUri,
        address policy)
        public
        returns (bool)
    {
        require(policy != address(0));
        PolicyI currPolicy = PolicyI(policy);
        bool isOk = currPolicy.checkPolicy(dataHash, viewer, dataUri);
        emit LinniaPolicyChecked(dataHash, dataUri, viewer, policy, isOk, msg.sender);
        require(isOk);
        return true;
    }

    /* @dev allows a record owner to add a policy to a record as long as it conforms */
    /* @param dataHash the record the owner is adding a policy to */
    /* @param policy an address of a contract that conforms to the policy interface to add */
    function addPolicyToRecord(bytes32 dataHash, address policy)
        whenNotPaused
        external
        returns (bool)
    {
        /* @dev get the dataUri and the owner address from the records contract */
        (address owner, , , , string memory dataUri, ) = hub.recordsContract().records(dataHash);

        /* @dev only the owner of the record or the contract itself */
        require(msg.sender == address(hub.recordsContract()) || msg.sender == owner);

        /* @dev original record must be policy complaint to work */
        require(policyIsValid(
            dataHash,
            msg.sender,
            dataUri,
            policy
        ));

        recordPolicies[dataHash].push(policy);

        return true;
    }

    /* @dev allows an owner to remove a policy from a record */
    /* @param dataHash the dataHash of the record being policied */
    /* @param policy the address of the policy to remove */
    function removePolicyFromRecord(bytes32 dataHash, address policy)
        onlyUser
        onlyRecordOwnerOf(dataHash)
        whenNotPaused
        external
        returns (bool)
    {
        /* @dev search through the policies for the record */
        for (uint i = 0; i < recordPolicies[dataHash].length; i++) {
            /* @dev if one is found */
            if (recordPolicies[dataHash][i] == policy) {
                /* @dev remove the policy by shifting everything over and shortening array */
                while (i < recordPolicies[dataHash].length - 1) {
                    recordPolicies[dataHash][i] = recordPolicies[dataHash][i + 1];
                    i++;
                }

                recordPolicies[dataHash].length--;
            }
        }

        return true;
    }
}
