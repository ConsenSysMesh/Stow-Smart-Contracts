const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
// const Stow = require('@stowprotocol/stow-js');
const Stow = require('@linniaprotocol/linnia-js');

const readdir = promisify(fs.readdir);
const {ipfs, web3} = require('./config');

const encrypt = async (publicKey, data) => {
  const encrypted = await Stow.util.encrypt(
    publicKey,
    data,
  );
  return encrypted;
};

const ipfsPush = async (encrypted) => {
	 const ipfsHash = await new Promise((resolve, reject) => {
    ipfs.add(JSON.stringify(encrypted), (ipfsErr, ipfsRed) => {
      ipfsErr ? reject(ipfsErr) : resolve(ipfsRed);
    });
  });
	 return ipfsHash;
};

const getFiles = async () => {
  const dataFolder = path.resolve(path.join(__dirname, '..', 'testData/synthetic_patients_data'));
  let files = await readdir(dataFolder);
  	files = files.map(fname => `./synthetic_patients_data/${  fname}`);
  	return files;
};

const getAccounts = async () => {
  const accounts =  await web3.eth.getAccounts();
  return accounts;
};

module.exports = {encrypt, ipfsPush, getFiles, getAccounts};
