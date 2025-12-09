/*
// 57. Setting up Prettier and VS Code and 58. Installing Node.js and Setting Up a Dev Environment
// Remember, we're gonna use strict mode in all scripts now!
"use strict";

const x = 23;
if (x === 23) console.log(23);

const calcAge = (birthYear) => 2037 - birthYear;
console.log(calcAge(1991));
*/
// 61. Using Google, Stack Overflow and MDN

"use strict";

// Problem:
// We work for a company building a smart home thermometer. Our most recent task is this: "Given an array of temperatures of one day, calculate the temperature amplitude. Keep in mind that sometimes there might be a sensor error."

const temperatures = [3, -2, -6, -1, "error", 9, 13, 17, 15, 14, 9, 5];

// 1. Understanding the problem.
// - What is temperature amplitude? Answer: difference between highest and lowest temp.
// How to computer the maximum and minimum temperatures.
// What's a sensor error? What to do when it occurs?

// 2) Breaking up into sub-problems
// How to ignore errors?
// Find max value in array
// Find min value in array
// Subtract min from max and return amplitude

const calcTempAmplitude = function (temps) {};
