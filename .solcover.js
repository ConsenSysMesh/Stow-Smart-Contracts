module.exports = {
  port: 8555,
  copyPackages: ['zeppelin-solidity'],
  skipFiles: ['Migrations.sol'],
  compileCommand: '../node_modules/.bin/truffle compile',
  testCommand: '../node_modules/.bin/truffle test --network coverage',
};
