const {getAccounts} = require('./utils');

const setupRoles = async (stow) => {
  const accounts = await getAccounts();
  const { users } = await stow.getContractInstances();
  const userPromises = accounts.map((account,i) => {
    if(i>0 && i<41){
      // adding 2/3 of users to smart contracts as plain users
      return users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
    }
    else{
      // add user to smart contracts and then add provenance so they are providers
      return users.register({ from: accounts[i].toLowerCase(), gas: 500000 }).then(() => {
        return users.setProvenance(accounts[i], 1, {
          from: accounts[0].toLowerCase(),
          gas: 500000,
        });
      });
    }
  });

  await Promise.all(userPromises);

  console.log('done setting up accounts!');
};

module.exports ={setupRoles};
