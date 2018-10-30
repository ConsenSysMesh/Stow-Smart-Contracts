const crypto = require('crypto');
const fs = require('fs');
const {ipfs, web3} = require('./config');
const Linnia = require('@linniaprotocol/linnia-js')

const linniaContractUpgradeHubAddress = '0xb7127ac312677f66e06fcd90b39367e5215d1000'
const linnia = new Linnia(web3, { linniaContractUpgradeHubAddress });

const userPubKeys = require('./public-encryption-keys').public_encryption_keys;

const data_folder = './data/synthetic_patients_data/';

const setupData = async () => {
fs.readdir(data_folder, (err, files) => {
  files = files.map(fname => './synthetic_patients_data/' + fname);
  web3.eth.getAccounts(async (err, accounts) => {
    if (err) {
      console.log(err);
    } else {
      let accountIndex = 1;
      let keyIndex = 0;
      const { users, records, permissions } = await linnia.getContractInstances();
      for (const file of files) {
        const data = require(file);
        const nonce = crypto.randomBytes(256);
        data.nonce = nonce.toString('hex');
        const patient_name = file.substring(26, file.length - 5);
        console.log(`${accountIndex}. ${patient_name}`);
        console.log(`address: ${accounts[accountIndex]}`);
        const provider = Math.floor(Math.random() * 19) + 41;
        const metadata = JSON.stringify({
            dataFormat: "json",
            domain: "medical data",
            storage: "IPFS",
            encryptionScheme: 'x25519-xsalsa20-poly1305',
            encryptionPublicKey: userPubKeys[keyIndex],
            linniajsVersion: "0.2.1",
            providerName: "Linnia Test Provider",
            providerEthereumAddress: accounts[provider],
            keywords: [ "medical", "diabetes", "patient", "test", "data" ],
        });
        // hash of the plain file
        const hash = web3.utils.sha3(JSON.stringify(data));
        // encrypt the datag
        const encrypted = await Linnia.util.encrypt(
          userPubKeys[keyIndex],
          JSON.stringify(data),
        );
        // upload to ipfs
        const ipfsHash = await new Promise((resolve, reject) => {
          ipfs.add(JSON.stringify(encrypted), (err, ipfsRed) => {
            err ? reject(err) : resolve(ipfsRed);
          });
        });
        console.log(`ipfsHash: ${ipfsHash}`);
        // add record to Linnia, by Random provider
        const tx = await records.addRecordByProvider(
          hash,
          accounts[accountIndex],
          metadata,
          ipfsHash,
          {
            from: accounts[provider].toLowerCase(),
            gas: 500000,
          },
        );
        accountIndex++;
        keyIndex++;
        console.log(tx.logs[0].args.dataHash);
      }
    }
  });
});

};

setupData();

module.exports = {setupData}

