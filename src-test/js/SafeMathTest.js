/*
 * Test for Safe Math Smart Contract.
 * Copyright © 2016 by ABDK Consulting.
 */

tests.push ({
  name: "SafeMath",
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
    { name: "Alice deploys SafeMathWrapper contract",
      body: function (test) {
        loadScript ("target/test-solc-js/SafeMathWrapper.abi.js");
        var safeMathWrapperABI = _;
        loadScript ("target/test-solc-js/SafeMathWrapper.bin.js");
        var safeMathWrapperCode = _;
        test.safeMathWrapperContract = web3.eth.contract (safeMathWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.safeMathWrapperContract.new (
          {from: test.alice, data: safeMathWrapperCode, gas:1000000}).
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

        test.safeMathWrapper = test.safeMathWrapperContract.at (
          web3.eth.getTransactionReceipt (test.tx).contractAddress);
      }},
    { name: "Safely add 0 to 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("0"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely add 3 to 5",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("3"), web3.toBigNumber ("5"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("8").eq (result [1])',
          web3.toBigNumber ("8").eq (result [1]));
      }},
    { name: "Safely add 2^256-1 to 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely add 0 to 2^256-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("0"),
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely add 2^256-2 to 1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE"),
          web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely add 1 to 2^256-2",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("1"),
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely add 2^256-1 to 1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("1"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely add 1 to 2^256-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("1"),
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely add 2^256-2 to 2",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE"),
          web3.toBigNumber ("2"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely add 2 to 2^256-2",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeAdd (
          web3.toBigNumber ("2"),
          web3.toBigNumber (
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely subtract 0 from 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeSub (
          web3.toBigNumber ("0"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely subtract 3 from 5",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeSub (
          web3.toBigNumber ("5"), web3.toBigNumber ("3"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("2").eq (result [1])',
          web3.toBigNumber ("2").eq (result [1]));
      }},
    { name: "Safely subtract 5 from 3",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeSub (
          web3.toBigNumber ("3"), web3.toBigNumber ("5"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely multiply 0 by 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely multiply 1 by 1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("1").eq (result [1])',
          web3.toBigNumber ("1").eq (result [1]));
      }},
    { name: "Safely multiply 1 by 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("1"), web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely multiply 0 by 1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0"), web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely multiply 3 by 5",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("3"), web3.toBigNumber ("5"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("15").eq (result [1])',
          web3.toBigNumber ("15").eq (result [1]));
      }},
    { name: "Safely multiply 2^256-1 by 0",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("0"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely multiply 0 by 2^256-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0"),
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0").eq (result [1])',
          web3.toBigNumber ("0").eq (result [1]));
      }},
    { name: "Safely multiply 2^256-1 by 1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("1"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely multiply 1 by 2^256-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("1"),
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (result [1]));
      }},
    { name: "Safely multiply 2^128-1 by 2^128",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Safely multiply 2^128 by 2^128-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"),
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('result [0]', result [0]);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000").eq (result [1])',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000").eq (result [1]));
      }},
    { name: "Safely multiply 2^256-1 by 2",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
          web3.toBigNumber ("2"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely multiply 2 by 2^256-1",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("2"),
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely multiply 2^255 by 2",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0x8000000000000000000000000000000000000000000000000000000000000000"),
          web3.toBigNumber ("2"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely multiply 2 by 2^255",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("2"),
          web3.toBigNumber ("0x8000000000000000000000000000000000000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }},
    { name: "Safely multiply 2^128 by 2^128",
      body: function (test) {
        var result = test.safeMathWrapper.doSafeMul (
          web3.toBigNumber ("0x100000000000000000000000000000000"),
          web3.toBigNumber ("0x100000000000000000000000000000000"));

        assert ('!result [0]', !result [0]);
      }}
  ]});
