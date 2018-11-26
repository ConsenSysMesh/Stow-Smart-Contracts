# Stow Smart Contracts [![NPM Package](https://img.shields.io/npm/v/@stowprotocol/stow-smart-contracts.svg?style=flat-square)](https://www.npmjs.com/package/@stowprotocol/stow-smart-contracts) ![Build Status](https://circleci.com/gh/ConsenSys/Stow-Smart-Contracts.png?circle-token=:circle-token&style=shield) ![Coverage Status](https://codecov.io/gh/ConsenSys/Stow-Smart-Contracts/branch/master/graph/badge.svg)
---
> :warning: WIP

Smart Contracts for Stow

# DEPLOYED CONTACTS

- Ropsten: [0xfae15fe388a0c0c04d9614f6a8b4f81142bfc87b](https://ropsten.etherscan.io/address/0xfae15fe388a0c0c04d9614f6a8b4f81142bfc87b)

- All addresses for protocol located: [Here](https://github.com/ConsenSys/stow-addresses)

# Overview
## Stow Users
A contract that keeps a registry of registered users and their provenance.

## Stow Records
A contract that keeps a registry of metadata of uploaded medical records, as well as the IRIS score of those records. The metadata makes records easily searchable.

# Recieving Tokens when adding Stow records

When a person uploads data, 1 Finney STOW token is transferred from the Stow admin pool/acct to the user’s address.
Currently no data validation needed.

1 Finney of STOW tokens per upload for now.

## Stow Permissions
A contract that keeps a registry of permissions. Permissions include who can view what data, and where the permissioned copy is stored on IPFS.

## Stow Overall Architecture 
![Stow architecture](images/stow_architecture_chart.png)

# Getting started

### Prerequisites
* Node.js
* Node Package Manager

Clone the repository
```
$ git clone https://github.com/ConsenSys/Stow-Smart-Contracts.git
```

Install the dependencies
```
$ npm install
```

## Deploying
```
npm run migrate
```

## Testing
To run tests with coverage
```
npm run coverage
```

To run tests without coverage
- First start testrpc with `npm start`
  - Alternatively you can run Ganache GUI at port 7545 with network id 5777
- Run `npm test`

## Video to Help You Get Started

[![Video to Get You Started with Stow Smart Contract](images/getting-started-with-stow.png)](https://www.youtube.com/watch?v=9RzCvB_Gvvo&t)

# Contributing

Please read [CONTRIBUTING.md](https://github.com/ConsenSys/stow-resources/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.
