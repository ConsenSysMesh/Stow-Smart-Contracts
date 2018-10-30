const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const ethSigUtil = require('eth-sig-util');

const ALGO_VERSION = 'x25519-xsalsa20-poly1305';

/**
 * EIP 1098 (https://github.com/ethereum/EIPs/pull/1098)
 * Generate Keys
 * @returns {JSON} with publicKey and privateKey
 */
const genKeyPair = () => {
  const keys = nacl.box.keyPair();
  return {
    privateKey: nacl.util.encodeBase64(keys.secretKey),
    publicKey: nacl.util.encodeBase64(keys.publicKey),
  };
};

/**
 * EIP 1098 (https://github.com/ethereum/EIPs/pull/1098)
 * Encrypt
 * @param {String} pubKeyTo
 * @param {JSON} data Data to be encrypted (Has to be JSON Object)
 * @returns {JSON} Encrypted message
 */
const encrypt = (pubKeyTo, data) => ethSigUtil.encryptSafely(pubKeyTo, { data }, ALGO_VERSION);

/**
 * EIP 1098 (https://github.com/ethereum/EIPs/pull/1098)
 * Decrypt
 * @param {String} privKey
 * @param {String} encrypted Encrypted message
 * @returns {String} plaintext
 */
const decrypt = (privKey, encrypted) => ethSigUtil.decryptSafely(encrypted, nacl.util.decodeBase64(privKey));

/* eslint-disable */

const truffleHack = (contract) => {
  if (typeof contract.currentProvider.sendAsync !== 'function') {
    contract.currentProvider.sendAsync = function () {
      return contract.currentProvider.send.apply(contract.currentProvider, arguments);
    };
  }
  return contract;
};

/* eslint-enable */

module.exports = {
  genKeyPair,
  encrypt,
  decrypt,
  truffleHack,
};
