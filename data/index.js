const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const Linnia = require('@linniaprotocol/linnia-js');

const readdir = promisify(fs.readdir);
const {ipfs, web3} = require('./config');
const userPubKeys = require('./public-encryption-keys').public_encryption_keys;

const dataFolder = path.resolve(path.join(__dirname, '..', 'data/synthetic_patients_data'));

const setupRoles = async (linnia) => {
  web3.eth.getAccounts(async (err, accounts) => {
    if (err) {
      console.log(err);
    } else {
      const { users } = await linnia.getContractInstances();
      let i = 1;
      // 40 User that will have data (1-40)
      while(i < 41) {
        await users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
        i++;
      }
      // 20 Users without data, with provenance (41-60)
      while(i < 61) {
        await users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
        await users.setProvenance(accounts[i], 1, {
          from: accounts[0].toLowerCase(),
          gas: 500000,
        });
        i++;
      }
      console.log('done');
    }
  });
};

const setupData = async (linnia) => {
  let files = await readdir(dataFolder);
  files = files.map(fname => `./synthetic_patients_data/${  fname}`);
  web3.eth.getAccounts(async (err, accounts) => {
    if (err) {
      console.log(err);
    } else {
      let accountIndex = 1;
      let keyIndex = 0;
      const { records } = await linnia.getContractInstances();
      for (const file of files) {
        const data = require(file);
        const nonce = crypto.randomBytes(256);
        data.nonce = nonce.toString('hex');
        const patientName = file.substring(26, file.length - 5);
        console.log(`${accountIndex}. ${patientName}`);
        console.log(`address: ${accounts[accountIndex]}`);
        const provider = Math.floor(Math.random() * 19) + 41;
        const year = 2018 - keyIndex;
        const metadata = JSON.stringify({
          dataFormat: 'json',
          domain: 'medical data',
          storage: 'IPFS',
          encryptionScheme: 'x25519-xsalsa20-poly1305',
          encryptionPublicKey: userPubKeys[keyIndex],
          linniajsVersion: '0.2.1',
          providerName: 'Linnia Test Provider',
          providerEthereumAddress: accounts[provider],
          keywords: [ 'medical', 'diabetes', 'patient', 'test', 'data' ],
          timeframe: `${year}-06-07T10:30,${year}-06-08T10:30`,
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
          ipfs.add(JSON.stringify(encrypted), (ipfsErr, ipfsRed) => {
            ipfsErr ? reject(ipfsErr) : resolve(ipfsRed);
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

};

const setup = async () => {
  const networkId = await web3.eth.net.getId();
  if(networkId === 3 || networkId === 4 || networkId === 5777) {
    const LinniaHub = require('../build/contracts/LinniaHub.json');
    const linniaContractUpgradeHubAddress = LinniaHub.networks[networkId].address;
    const linnia = new Linnia(web3, { linniaContractUpgradeHubAddress });
    setupRoles(linnia);
    setupData(linnia);
  }
  
};

setup();



