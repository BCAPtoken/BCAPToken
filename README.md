# Blockchain Capital Token Smart Contract #

Blockchain Capital Token Smart Contract.
Copyright © 2017 by ABDK Consulting.


## How to Build ##

In order to build Blockchain Capital Token Smart Contract you need the
following software to be properly installed on your system:

1. Oracle JRE 8+
2. Apache Ant 1.9.7+
3. Solidity 0.4.1+
4. Geth 1.5.2+

To build Blockchain Capital Token Smart Contract, do the following:

1. Checkout sources of Blockchain Capital Token Smart Contract
2. Go to the root folder of Blockchain Capital Token Smart Contract sources,
   i.e. to the folder containing this `README.md` file
3. Copy `build.properties.sample` file into `build.properties` and
   edit it as necessary
4. Run the following command: `ant build`
5. After successful build, `target` directory will contain compiled contract
   as well as ABI definition files

## How to Run Tests ##

After successful build you may want to run tests via `ant test` command.
