/*
 * Test for Standard Token Smart Contract.
 * Copyright © 2016 by ABDK Consulting.
 */

tests.push ({
  name: "StandardToken",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (!web3.eth.accounts || web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys three Wallet contracts: Bob, Carol and Dave",
      body: function (test) {
        loadScript (
          "target/test-solc-js/Wallet.abi.js");
        var walletABI = _;
        loadScript (
          "target/test-solc-js/Wallet.bin.js");
        var walletCode = _;
        test.walletContract =
          web3.eth.contract (walletABI);

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
          web3.eth.getTransactionReceipt (test.tx3);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx1).contractAddress',
          web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx2).contractAddress',
          web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx3).contractAddress',
          web3.eth.getTransactionReceipt (test.tx3).contractAddress);

        test.bob = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        test.carol = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        test.dave = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx3).contractAddress);
      }},
    { name: "Alice deploys StandardTokenWrapper contract with Bob as token issuer",
      body: function (test) {
        loadScript ("target/test-solc-js/StandardTokenWrapper.abi.js");
        var standardTokenWrapperABI = _;
        loadScript ("target/test-solc-js/StandardTokenWrapper.bin.js");
        var standardTokenWrapperCode = _;
        test.standardTokenWrapperContract =
          web3.eth.contract (standardTokenWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.standardTokenWrapperContract.new (
          test.bob.address,
          {from: test.alice, data: standardTokenWrapperCode, gas:1000000}).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        test.standardTokenWrapper = test.standardTokenWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Bob transfers 1000 tokens to himself",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.bob.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);
      }},
    { name: "Bob transfers 0 tokens to Dave",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Bob allows Carol to transfer 1000 of his tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 0',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.approve.getData (
            test.carol.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now allowed to transfer 1000 of Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.standardTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
          'approvalEvents [0].args._owner == test.bob.address',
          approvalEvents [0].args._owner == test.bob.address);

        assert (
          'approvalEvents [0].args._spender == test.carol.address',
          approvalEvents [0].args._spender == test.carol.address);

        assert (
          'approvalEvents [0].args._value == 1000',
          approvalEvents [0].args._value == 1000);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 1000);
      }},
    { name: "Carol transfers 100 Bob's tokens to himself",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.bob.address,
            test.bob.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);
      }},
    { name: "Carol transfers 0 Bob's tokens to Dave",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.bob.address,
            test.dave.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Dave tries to transfer 1000 tokens to himself while he does not have any tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Dave tries to transfer 1000 tokens to Bob while Dave does not have any tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.bob.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Dave transfers 0 tokens to Bob",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.bob.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Dave allows Carol to transfer 1000 of his tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 0',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.approve.getData (
            test.carol.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now allowed to transfer 1000 of Dave's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.standardTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
          'approvalEvents [0].args._owner == test.dave.address',
          approvalEvents [0].args._owner == test.dave.address);

        assert (
          'approvalEvents [0].args._spender == test.carol.address',
          approvalEvents [0].args._spender == test.carol.address);

        assert (
          'approvalEvents [0].args._value == 1000',
          approvalEvents [0].args._value == 1000);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);
      }},
    { name: "Carol tries to transfer 100 Dave's tokens to himself while Dave does not have any tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.dave.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Carol transfers 0 Daves's tokens to Bob",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.bob.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);
      }},
    { name: "Bob transfers 1000 tokens to Dave",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 0',
          test.standardTokenWrapper.totalSupply () == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 0',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.bob.address',
          transferEvents [0].args._from == test.bob.address);

        assert (
          'transferEvents [0].args._to == test.dave.address',
          transferEvents [0].args._to == test.dave.address);

        assert (
          'transferEvents [0].args._value == 1000',
          transferEvents [0].args._value == 1000);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Bob tries to transfers 2^256 - 1000 tokens to Dave but this will exceed maximum allowed number of tokens in circulation",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            web3.toBigNumber ("0x10000000000000000000000000000000000000000000000000000000000000000").sub (1000)),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Carol transfers 100 Bob's tokens to Dave",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.bob.address,
            test.dave.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.bob.address',
          transferEvents [0].args._from == test.bob.address);

        assert (
          'transferEvents [0].args._to == test.dave.address',
          transferEvents [0].args._to == test.dave.address);

        assert (
          'transferEvents [0].args._value == 100',
          transferEvents [0].args._value == 100);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 800',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 800);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);
      }},
    { name: "Bob allows Carol to transfer 2^256-1 of his tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 800',
          test.standardTokenWrapper.allowance (test.bob.address, test.carol.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.approve.getData (
            test.carol.address,
            web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now allowed to transfer 2^256-1 of Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.standardTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
          'approvalEvents [0].args._owner == test.bob.address',
          approvalEvents [0].args._owner == test.bob.address);

        assert (
          'approvalEvents [0].args._spender == test.carol.address',
          approvalEvents [0].args._spender == test.carol.address);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (approvalEvents [0].args._value)',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (approvalEvents [0].args._value));

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address))',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address)));
      }},
    { name: "Carol tries to transfer 2_256 = 1100 Bob's tokens to Dave but this will exceed maximum allowed number of tokens in circulation",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address))',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address)));

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.bob.address,
            test.dave.address,
            web3.toBigNumber ("0x10000000000000000000000000000000000000000000000000000000000000000").sub (1100)),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address))',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.standardTokenWrapper.allowance (test.bob.address, test.carol.address)));

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);
      }},
    { name: "Dave tries to transfer 1101 tokens to Carol while having only 1100 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 0',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.carol.address,
            1101),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 0',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);
      }},
    { name: "Dave transfers 100 tokens to Carol",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 0',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1100',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1100);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.carol.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.dave.address',
          transferEvents [0].args._from == test.dave.address);

        assert (
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

        assert (
          'transferEvents [0].args._value == 100',
          transferEvents [0].args._value == 100);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Dave transfers 0 tokens to Carol",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.carol.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Dave tries to transfer 1001 tokens to himself while having only 1000 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            1001),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Dave transfers 100 tokens to himself",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Dave tries to transfer 1001 tokens to Bob while having only 1000 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.bob.address,
            1001),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);
      }},
    { name: "Dave transfers 100 tokens to Bob",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1100',
          test.standardTokenWrapper.totalSupply () == 1100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 1000',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.bob.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.dave.address',
          transferEvents [0].args._from == test.dave.address);

        assert (
          'transferEvents [0].args._to == test.bob.address',
          transferEvents [0].args._to == test.bob.address);

        assert (
          'transferEvents [0].args._value == 100',
          transferEvents [0].args._value == 100);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 900',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 900);
      }},
    { name: "Carol tries to transfer 901 Dave's tokens to Carol while Dave has only 900 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 900',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 900);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.carol.address,
            901),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 900',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 900);
      }},
    { name: "Carol transfer 100 Dave's tokens to Carol",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 1000);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 100',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 100);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 900',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 900);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.carol.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.dave.address',
          transferEvents [0].args._from == test.dave.address);

        assert (
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

        assert (
          'transferEvents [0].args._value == 100',
          transferEvents [0].args._value == 100);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 200',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 200);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol transfers 0 Dave's tokens to Carol",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 200',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 200);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.carol.address,
            0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 200',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 200);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol tries to transfer 801 Dave's tokens to Dave while Date has only 800 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            test.dave.address,
            801),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol tries to transfer 801 Dave's tokens to Bob while Dave has only 800 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transfer.getData (
            test.dave.address,
            test.bob.address,
            801),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol transfers 200 Dave's tokens to Dave",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 900);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.dave.address,
            200),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol tries to transfer 701 Dave's tokens to Carol while she is allowed to transfer only 700",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 200',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 200);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.carol.address,
            701),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.carol.address) == 200',
          test.standardTokenWrapper.balanceOf (test.carol.address) == 200);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol tries to transfer 701 Dave's tokens to Bob while she is allowed to transfer only 700 tokens",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.bob.address,
            701),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          '!resultEvents [0].args._value',
          !resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);
      }},
    { name: "Carol transfers 100 Dave's tokens to Bob",
      body: function (test) {
        assert (
          'test.standardTokenWrapper.totalSupply () == 1000',
          test.standardTokenWrapper.totalSupply () == 1000);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 700);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 800',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 800);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.standardTokenWrapper.address,
          test.standardTokenWrapper.transferFrom.getData (
            test.dave.address,
            test.bob.address,
            100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.standardTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
          'transferEvents [0].args._from == test.dave.address',
          transferEvents [0].args._from == test.dave.address);

        assert (
          'transferEvents [0].args._to == test.bob.address',
          transferEvents [0].args._to == test.bob.address);

        assert (
          'transferEvents [0].args._value == 100',
          transferEvents [0].args._value == 100);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.standardTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.standardTokenWrapper.totalSupply () == 900',
          test.standardTokenWrapper.totalSupply () == 900);

        assert (
          'test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 600',
          test.standardTokenWrapper.allowance (test.dave.address, test.carol.address) == 600);

        assert (
          'test.standardTokenWrapper.balanceOf (test.bob.address) == 0',
          test.standardTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
          'test.standardTokenWrapper.balanceOf (test.dave.address) == 700',
          test.standardTokenWrapper.balanceOf (test.dave.address) == 700);
      }}
  ]});
