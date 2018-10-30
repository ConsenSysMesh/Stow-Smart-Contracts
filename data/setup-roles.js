const {web3} = require('./config');

const setupRoles = async (users) => {
  web3.eth.getAccounts(async (err, accounts) => {
    if (err) {
      console.log(err);
    } else {
      let i = 1;
      // 40 User that will have data (1-40)
      while(i < 41) {
        console.log('dsjcsdcdsckdjsc')
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
      console.log('dklmscdlsdklmscdlsdklmscdls')
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

module.exports = {setupRoles};
