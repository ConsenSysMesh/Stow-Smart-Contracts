require('dotenv').load();
const IPFS = require('ipfs-mini');
const Web3 = require('web3');

const providerHost = process.env.STOW_ETH_PROVIDER;
const ipfsProvider = process.env.STOW_IPFS_HOST;
const ipfsPort = process.env.STOW_IPFS_PORT;
const protocol = process.env.STOW_IPFS_PROTOCOL;

const HDWalletProvider = require('truffle-hdwallet-provider');

let privKeys;

// If ropsten, set the owner private key
if (providerHost === 'ropsten') {
  privKeys = require('../test-private-keys').private_keys;
  privKeys[0] = process.env.STOW_ETH_INFURA_ROPSTEN_HUB_OWNER_PRIVATE_KEY;
}

// If rinkeby, set the owner private key
if (providerHost === 'rinkeby') {
  privKeys = require('../test-private-keys').private_keys;
  privKeys[0] = process.env.STOW_ETH_INFURA_RINKEBY_HUB_OWNER_PRIVATE_KEY;
}

const networks = {
  ropsten: {
    provider() {
      return new HDWalletProvider(
        privKeys,
        `https://ropsten.infura.io/${process.env.STOW_ETH_INFURA_KEY}`,
      );
    },
    network_id: 3,
  },
  rinkeby: {
    provider() {
      return new HDWalletProvider(
        privKeys,
        `https://rinkeby.infura.io/${process.env.STOW_ETH_INFURA_KEY}`,
      );
    },
    network_id: 4,
  },
};

let web3;

// If ropsten or rinkeby
if (providerHost === 'ropsten' || providerHost === 'rinkeby') {
  const provider = networks[providerHost].provider();
  web3 = new Web3(provider.engine);
}
else{
  web3 = new Web3('http://localhost:7545');
}

const ipfs = new IPFS({ host: ipfsProvider, port: ipfsPort, protocol });

module.exports = {
  web3,
  ipfs
};
