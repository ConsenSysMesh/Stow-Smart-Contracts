const {web3} = require('./config');
const {setupMetadata} = require('./setupMetadata');
const {encrypt, ipfsPush, getFiles} = require('./utils');


const setupData = async (stow) => {
  const files = await getFiles();
  const { records } = await stow.getContractInstances();
  for(let i=0; i<files.length; i++) {
    const data = require(files[i]);
    // set up metadata and keys
    const {nonce, metadata, provider, publicKey, account} = await setupMetadata(i, i+1);
    data.nonce = nonce.toString('hex');
    const hash = web3.utils.sha3(JSON.stringify(data));
    // encrypt file
    const encrypted = await encrypt(publicKey,JSON.stringify(data));
    // push file to ipfs
    const ipfsHash = await ipfsPush(encrypted);
    // add record to smart contract
    const tx = await records.addRecordByProvider(
      hash,
      account,
      metadata,
      ipfsHash,
      {
        from: provider.toLowerCase(),
        gas: 500000,
      },
    );
    console.log(`record:${tx.logs[0].args.dataHash} added for ${account}`);
  }
    console.log('done setting up records!')
};

module.exports = {setupData};

