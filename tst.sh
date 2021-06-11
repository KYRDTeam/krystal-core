#!/bin/sh

usage="yarn test [-h] [-c <eth,bsc,polygon>] [-n <mainnet>] -- to run test on specific chain and network

where:
    -h  show this help text
    -c  which chain to run, supported <eth,bsc,polygon>
    -n  which network to run, supported <mainnet>
    -f  specific test to run if any"

# Default chain and network
CHAIN="eth"
NETWORK="mainnet"

while getopts ":hc:n:f:" option; do
  case $option in
    h) 
      echo "$usage"
      exit
      ;;
    c) 
      if [[ ! "$OPTARG" =~ ^(eth|bsc|polygon)$ ]]; then
          printf "invalid value for -%s\n" "$option" >&2
          echo "$usage" >&2
          exit 1P
      fi
      CHAIN=$OPTARG;;      
    n) 
      if [[ ! "$OPTARG" =~ ^(mainnet)$ ]]; then
          printf "invalid value for -%s\n" "$option" >&2
          echo "$usage" >&2
          exit 1
      fi
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
