const crypto = require('crypto');
const userPubKeys = require('./test-encryption-keys').public_encryption_keys;
const {getAccounts} = require('./utils');


const setupMetadata = async (keyIndex, accountIndex) => {
  const accounts = await getAccounts();
  const nonce = crypto.randomBytes(256);
  const account = accounts[accountIndex];
  const providerIndex = Math.floor(Math.random() * 19) + 41;
  const provider = accounts[providerIndex];
  const publicKey = userPubKeys[keyIndex];
  const year = 2018 - keyIndex;
  const metadata = JSON.stringify({
    dataFormat: 'json',
    domain: 'medical data',
    storage: 'IPFS',
    encryptionScheme: 'x25519-xsalsa20-poly1305',
    encryptionPublicKey: publicKey,
    stowjsVersion: '0.2.1',
    providerName: 'Stow Test Provider',
    providerEthereumAddress: provider,
    keywords: [ 'medical', 'diabetes', 'patient', 'test', 'data' ],
    timeframe: `${year}-06-07T10:30,${year}-06-08T10:30`,
  });
  return {nonce, metadata, publicKey, provider, account};
};

module.exports = {setupMetadata};
