const Linnia = require('@linniaprotocol/linnia-js');
const {setupRoles} = require('./setupRoles');
const {setupData} = require('./setupData');
const {web3} = require('./config');

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
