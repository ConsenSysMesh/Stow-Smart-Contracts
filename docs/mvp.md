Linnia MVP
---
The user experience will begin with the user choosing his/her role. The roles for the initial version of the application will be:

- Patient
- Health Authority

For the MVP we will have a central authority to verify who is eligible to register as a Health Authority. Currently, there is no way to decentralize verification of someone’s profession, whether it is a Doctor, Lawyer, or Teacher. To attach an identity to a public and private key within the application, there needs to be some sort of central verification first. Once verified, these roles will be assigned to the public and private keys provided by the user.

The public and private keys of the user will be stored locally on the device. We aim to use uPort integration in our next iteration, but we feel that for this MVP, creating our own wallet within the application will be sufficient. The wallet will take care of encrypting and decrypting data that is going to or coming from decentralized storage as well.

Users’ information and role will be stored in a smart contract, where they can also create policies for the roles. This allows users to delegate who can enter data for them (ex. primary doctor) and who can see their data. The policies will only be editable by the user and thus the user can remove access from an individual or authority at any time.
