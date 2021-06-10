#!/bin/sh

usage="yarn test [-h] [-c chain] -- to run test on specific chain and network

where:
    -h  show this help text
    -c  which chain to run, supported <eth,bsc>
    -n  which network to run, supported <mainnet>
    -f  specific test to run if any"

# Default chain and network
CHAIN="eth"
NETWORK="mainnet"

while getopts ":hcf:" option; do
  case $option in
    h) echo "$usage"
      exit
      ;;
    c) 
      CHAIN=$OPTARG;;
    n) 
      NETWORK=$OPTARG;;
    f) 
      FILE=$OPTARG;;
    :) 
      printf "missing argument for -%s\n" "$OPTARG" >&2
      echo "$usage" >&2
      exit 1
      ;;
    *)                               
      printf "illegal option: -%s\n" "$OPTARG" >&2
      echo "$usage" >&2
      exit 1
      ;;
  esac
done

if [ -n "$FILE" ]; then
  CHAIN=$CHAIN NETWORK=$NETWORK yarn hardhat test --no-compile --network hardhat $FILE
else
  echo "Running all tests..."
  CHAIN=$CHAIN NETWORK=$NETWORK yarn hardhat test --no-compile --network hardhat
fi
