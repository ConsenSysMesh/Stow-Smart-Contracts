const {getAccounts} = require('./utils');

const setupRoles = async (linnia) => {
  const accounts = await getAccounts();
  const { users } = await linnia.getContractInstances();
  accounts.forEach(async (account,i) => {
  	if(i>0 && i<41){
      // adding 2/3 of users to smart contracts as plain users
  		await users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
  	}
  	else{
      //add user to smart contracts and then add provenance so they are providers
  		await users.register({ from: accounts[i].toLowerCase(), gas: 500000 });
  		await users.setProvenance(accounts[i], 1, {
  		  from: accounts[0].toLowerCase(),
  		  gas: 500000,
  		});
  	}
  });
  console.log('done setting up accounts');
};

module.exports ={setupRoles};