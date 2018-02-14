require('babel-register')({
  ignore: /node_modules\/(?!zeppelin-solidity)/
});
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      gas: 6000000,
      network_id: 5777
    }
  }
};
