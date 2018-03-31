Linnia Smart Contracts
---
> :warning: WIP

Smart Contracts for Linnia MVP

[More about the MVP](./docs/mvp.md)

# Overview
## Linnia Roles
A contract that keeps a registry of user roles. Patients can self register while providers are added by the contract admin.

- Patients
  - Owners of medical data
- Providers
  - Attestators of medical data
  - Every provider has a provenance score

## Linnia Records
A contract that keeps a registry of metadata of uploaded medical records, as well as the IRIS score of those records. The metadata makes records easily searchable.

- Patients can
  - Upload metadata related to their medical data
- Providers can
  - Add attestations to medical data

## Linnia Permissions
A contract that keeps a registry of permissions. Permissions include who can view what data, and where the permissioned copy is stored on IPFS.

# Installing (only once)

Installs `babel-register` and `babel-polyfill`.

```
npm install
```

# Deploying
```
truffle migrate
```

# Testing
To run tests with coverage
```
npm run coverage
```

To run tests without coverage
- First start testrpc with `npm start`
  - Alternatively you can run Ganache GUI at port 7545 with network id 5777
- Run `npm test`
