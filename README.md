# Introduction

[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)

Smart Contracts for Krystal to help interact with protocols on Binance Smart Chain;

## Package Manager

We use `yarn` as the package manager. You may use `npm` and `npx` instead, but commands in bash scripts may have to be changed accordingly.

## Setup

1. Clone this repo
2. `yarn install`

## Compilation

`yarn compile` to compile contracts for all solidity versions.

## Contract Deployment / Interactions

For interactions or contract deployments on public testnets / mainnet, create a `.env` file specifying your private key and infura api key, with the following format:

```
PRIVATE_KEY=0x****************************************************************
BSCSCAN_KEY=********************************
```

## Testing

1. If contracts have not been compiled, run `yarn compile` or `yarn c`. This step can be skipped subsequently.
2. Run `yarn test`
3. Use `./tst.sh -f` for running a specific test file.

### Example Commands

- `yarn test` (Runs all tests)
- `./tst.sh -f ./test/swapTest.ts` (Test only swapTest.ts)

## Coverage

- Run `yarn coverage` for coverage on files
