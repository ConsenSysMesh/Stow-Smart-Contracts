const {web3} = require('./config');
const Linnia = require('@linniaprotocol/linnia-js')

const linniaContractUpgradeHubAddress = '0xb7127ac312677f66e06fcd90b39367e5215d1000'
const linnia = new Linnia(web3, { linniaContractUpgradeHubAddress });


const setupRoles = async () => {
  web3.eth.getAccounts(async (err, accounts) => {
    if (err) {
      console.log(err);
    } else {
      const { users, records, permissions } = await linnia.getContractInstances();
      let i = 1;
      // 40 User that will have data (1-40)
      while(i < 41) {
        try{
        await users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
        }
        catch(e){
          console.log(e)
        }
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

setupRoles();

module.exports = {setupRoles}