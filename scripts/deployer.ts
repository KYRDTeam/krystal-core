import {deploy} from './deployLogic';
import * as fs from 'fs';
import {network} from 'hardhat';

let contracts: Record<string, Record<string, string>> = {};
let contractsFile = `${__dirname}/../contracts.json`;

try {
  const data = fs.readFileSync(contractsFile, 'utf8');
  contracts = JSON.parse(data);
} catch {
  contracts = {};
}

deploy(contracts[network.name])
  .then((deployedContracts) => {
    // Save contracts' addresses
    contracts[network.name] = deployedContracts;
    const json = JSON.stringify(contracts, null, 2) + '\n';
    fs.writeFileSync(contractsFile, json, 'utf8');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
