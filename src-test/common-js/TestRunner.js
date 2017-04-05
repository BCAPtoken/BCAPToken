/*
 * Tests runner.
 * Copyright © 2016 by ABDK Consulting.
 */

var currentTest = 0;
var currentStep;
var failedTests = [];

function runStep () {
  if (currentStep < tests [currentTest].steps.length) {
    if (tests [currentTest].steps [currentStep].precondition &&
        !tests [currentTest].steps [currentStep].precondition (
          tests [currentTest])) {
      setTimeout (runStep, 1000);
    } else {
      console.log (
        "  Step " + (currentStep + 1) + " of " +
        tests [currentTest].steps.length +
        (tests [currentTest].steps [currentStep].name ? ": " +
          tests [currentTest].steps [currentStep].name : ""));

      try {
        tests [currentTest].steps [currentStep].body (tests [currentTest]);

        currentStep += 1;
        runStep ();
      } catch (ex) {
        console.error (ex);
        failedTests.push (currentTest);

        currentTest += 1;
        runTest ();
      }
    }
  } else {
    currentTest += 1;
    runTest ();
  }
}

function runTest () {
  if (currentTest < tests.length) {
    console.log (
      "Test " + (currentTest + 1) + " of " + tests.length + 
      (tests [currentTest].name ? ": " + tests [currentTest].name : ""));

    currentStep = 0;
    runStep ();
  } else {
    if (failedTests.length == 0)
      console.log ("SUCCESS");
    else {
      console.log ("FAILED TESTS:");
      failedTests.forEach (function (test) {
        console.log (test + (tests [test].name ? ": " +
          tests [test].name : ""));
      });
    }
  }
}

runTest ();
