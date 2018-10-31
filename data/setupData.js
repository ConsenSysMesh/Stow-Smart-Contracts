const {web3} = require('./config');
const {setupMetadata} = require('./setupMetadata');
const {encrypt, ipfsPush, getFiles} = require('./utils');


const setupData = async (linnia) => {
  const files = await getFiles();
  const { records } = await linnia.getContractInstances();
  files.forEach(async (file, i) => {
    const data = require(file);
    const {nonce, metadata, provider, publicKey, account} = await setupMetadata(i, i+1);
    data.nonce = nonce.toString('hex');
    const hash = web3.utils.sha3(JSON.stringify(data));
    const encrypted = await encrypt(publicKey,JSON.stringify(data));
    const ipfsHash = await ipfsPush(encrypted);
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
  });
  console.log('all records setup')
};

module.exports = {setupData};

