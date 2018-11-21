// const Stow = require('@stowprotocol/stow-js');
throw 'will not work until @linniaprotocol/linnia-js is move to stow ';
const Stow = require('@linniaprotocol/linnia-js');

const {setupRoles} = require('./setupRoles');
const {setupData} = require('./setupData');
const {web3} = require('./config');

const setup = async () => {
  const networkId = await web3.eth.net.getId();
  if(networkId === 3 || networkId === 4 || networkId === 5777) {
    const StowHub = require('../build/contracts/StowHub.json');
    const stowContractUpgradeHubAddress = StowHub.networks[networkId].address;
    const stow = new Stow(web3, { stowContractUpgradeHubAddress });
    await setupRoles(stow);
    await setupData(stow);
  }

};

setup();
