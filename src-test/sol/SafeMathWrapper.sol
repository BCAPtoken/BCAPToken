/*
 * Wrapper for Safe Math Smart Contract.  Copyright © 2016 by ABDK Consulting.
 */
pragma solidity ^0.4.1;

import "./../../src/sol/SafeMath.sol";

/**
 * Provides methods to safely add, subtract and multiply uint256 numbers.
 */
contract SafeMathWrapper is SafeMath {
  /**
   * Add two uint256 values, throw in case of overflow.
   *
   * @param x first value to add
   * @param y second value to add
   * @return x + y
   */
  function doSafeAdd (uint256 x, uint256 y)
  constant
  returns (bool success, uint256 z) {
    return (true, safeAdd (x, y));
  }

  /**
   * Subtract one uint256 value from another, throw in case of underflow.
   *
   * @param x value to subtract from
   * @param y value to subtract
   * @return x - y
   */
  function doSafeSub (uint256 x, uint256 y)
  constant
  returns (bool success, uint256 z) {
    return (true, safeSub (x, y));
  }

  /**
   * Multiply two uint256 values, throw in case of overflow.
   *
   * @param x first value to multiply
   * @param y second value to multiply
   * @return x * y
   */
  function doSafeMul (uint256 x, uint256 y)
  constant
  returns (bool success, uint256 z) {
    return (true, safeMul (x, y));
  }
}
