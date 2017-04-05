/*
 * Common stuff neede for tests.
 * Copyright © 2016 by ABDK Consulting.
 */

/**
 * Throws given message unless given condition is true.
 * @param message message to throw unless given condition is true
 * @param condition condition to check
 */
function assert (message, condition) {
  if (!condition) throw message;
}

/**
 * Tests to run.
 */
var tests = [];
