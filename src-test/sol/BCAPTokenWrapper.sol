/*
 * Wrapper for Blockchain Capital Token Smart Contract.
 * Copyright © 2016 by ABDK Consulting.
 */
pragma solidity ^0.4.1;

import "./../../src/sol/BCAPToken.sol";

/**
 * Wrapper for Blockchain Capital Token Smart Contract.
 */
contract BCAPTokenWrapper is BCAPToken {
  /**
   * Create new Standard Token Wrapper smart contract with given "Central Bank"
   * account address.
   *
   * @param _centralBank "Central Bank" account address
   */
  function BCAPTokenWrapper (address _centralBank)
  BCAPToken (_centralBank) {
    // Do nothing
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens from the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) returns (bool success) {
    bool result = BCAPToken.transfer (_to, _value);
    Result (result);
    return true;
  }

  /**
   * Transfer given number of tokens from given owner to given recipient.
   *
   * @param _from address to transfer tokens from the owner of
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer from given owner to given
            recipient
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transferFrom (address _from, address _to, uint256 _value)
  returns (bool success) {
    bool result = BCAPToken.transferFrom (_from, _to, _value);
    Result (result);
    return true;
  }

  /**
   * Allow given spender to transfer given number of tokens from message sender.
   *
   * @param _spender address to allow the owner of to transfer tokens from
            message sender
   * @param _value number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _value) returns (bool success) {
    bool result = AbstractToken.approve (_spender, _value);
    Result (result);
    return true;
  }

  /**
   * Used to log result of operation.
   *
   * @param _value result of operation
   */
  event Result (bool _value);
}
