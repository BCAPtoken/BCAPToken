/*
 * Test for Blockchain Capital Token Smart Contract.
 * Copyright © 2017 by ABDK Consulting.
 */

tests.push ({
  name: "BCAPToken",
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
    { name: "Alice deploys BCAPTokenWrapper contract with Bob as central bank",
      body: function (test) {
        loadScript ("target/test-solc-js/BCAPTokenWrapper.abi.js");
        var BCAPTokenWrapperABI = _;
        loadScript ("target/test-solc-js/BCAPTokenWrapper.bin.js");
        var BCAPTokenWrapperCode = _;
        test.BCAPTokenWrapperContract =
          web3.eth.contract (BCAPTokenWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.BCAPTokenWrapperContract.new (
          test.bob.address,
          {from: test.alice, data: BCAPTokenWrapperCode, gas:1000000}).
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

        test.BCAPTokenWrapper =
          test.BCAPTokenWrapperContract.at (
            web3.eth.getTransactionReceipt (test.tx).contractAddress);

        assert (
            'test.BCAPTokenWrapper.totalSupply () == 0',
            test.BCAPTokenWrapper.totalSupply () == 0);
      }},
    { name: "Bob sends 1000 tokens to Carol",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 0',
            test.BCAPTokenWrapper.totalSupply () == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transfer.getData (
              test.carol.address,
              1000),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol got 1000 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1000',
            test.BCAPTokenWrapper.totalSupply () == 1000);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1000',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1000);
      }},
    { name: "Bob allows Dave to transfer 1000 of Bob's tokens",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 0',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.approve.getData (
              test.dave.address,
              1000),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Dave is now allowed to transfer 1000 of Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.BCAPTokenWrapper.Approval (
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
          'approvalEvents [0].args._spender == test.dave.address',
          approvalEvents [0].args._spender == test.dave.address);

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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 1000',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 1000);
      }},
    { name: "Dave sends 10 Bob's tokens to Carol",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 1000',
            test.BCAPTokenWrapper.totalSupply () == 1000);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1000',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1000);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 1000',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 1000);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.carol.address,
              10),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol got 10 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

        assert (
          'transferEvents [0].args._value == 10',
          transferEvents [0].args._value == 10);

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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990);
      }},
    { name: "Carol tries to freeze transfers but she is not the owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.freezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was cancelled",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.BCAPTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

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
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob freezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.freezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were frozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.BCAPTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 1',
          freezeEvents.length == 1);

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
      }},
    { name: "Bob tries to freeze transfers but they are already frozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.freezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.BCAPTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

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
      }},
    { name: "Bob tries to send 10 tokens to Carol but transfers are frozen",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transfer.getData (
              test.carol.address,
              10),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);
      }},
    { name: "Dave tries to send 10 Bob's tokens to Carol but transfers are frozen",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.carol.address,
              10),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990);
      }},
    { name: "Carol tries to unfreeze transfers but she is not the owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.unfreezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction was cancelled",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.BCAPTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

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
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob unfreezes transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.unfreezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were unfrozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.BCAPTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 1',
          unfreezeEvents.length == 1);

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
      }},
    { name: "Bob tries to unfreeze transfers but they are not frozen",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.unfreezeTransfers.getData (),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction succeeded but no events were logged",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.BCAPTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

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
      }},
    { name: "Bob sends 10 tokens to Carol",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 1010',
            test.BCAPTokenWrapper.totalSupply () == 1010);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1010);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transfer.getData (
              test.carol.address,
              10),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol got 10 tokebns",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

        assert (
          'transferEvents [0].args._value == 10',
          transferEvents [0].args._value == 10);

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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1020',
            test.BCAPTokenWrapper.totalSupply () == 1020);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1020',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1020);
      }},
    { name: "Dave sends 10 Bob's tokens to Carol",
      body: function (test) {
        assert (
            'test.BCAPTokenWrapper.totalSupply () == 1020',
            test.BCAPTokenWrapper.totalSupply () == 1020);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1020',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1020);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 990);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
            test.BCAPTokenWrapper.address,
            test.BCAPTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.carol.address,
              10),
            0,
            {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol got 10 tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.BCAPTokenWrapper.Transfer (
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
          'transferEvents [0].args._to == test.carol.address',
          transferEvents [0].args._to == test.carol.address);

        assert (
          'transferEvents [0].args._value == 10',
          transferEvents [0].args._value == 10);

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

        var resultEvents = test.BCAPTokenWrapper.Result (
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
            'test.BCAPTokenWrapper.totalSupply () == 1030',
            test.BCAPTokenWrapper.totalSupply () == 1030);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0',
            test.BCAPTokenWrapper.balanceOf (test.bob.address) == 0);

        assert (
            'test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1030',
            test.BCAPTokenWrapper.balanceOf (test.carol.address) == 1030);

        assert (
            'test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 980',
            test.BCAPTokenWrapper.allowance (test.bob.address, test.dave.address) == 980);
      }}
  ]});
