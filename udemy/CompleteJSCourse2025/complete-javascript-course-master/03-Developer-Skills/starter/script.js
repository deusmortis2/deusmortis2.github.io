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
/*
// Problem:
// We work for a company building a smart home thermometer. Our most recent task is this: "Given an array of temperatures of one day, calculate the temperature amplitude. Keep in mind that sometimes there might be a sensor error."

// 1. Understanding the problem.
// - What is temperature amplitude? Answer: difference between highest and lowest temp.
// How to computer the maximum and minimum temperatures.
// What's a sensor error? What to do when it occurs?

// 2) Breaking up into sub-problems
// How to ignore errors?
// Find max value in array
// Find min value in array
// Subtract min from max and return amplitude

// const temperatures = [3, -2, -6, -1, "error", 9, 13, 17, 15, 14, 9, 5];
const calcTempAmplitudeBug = function (t1, t2) {
  const temps = t1.concat(t2);
  let max = temps[0];
  let min = temps[0];

  for (let i = 0; i < temps.length; i++) {
    const curTemp = temps[i];
    if (typeof curTemp !== "number") continue;
    if (curTemp > max) max = temps[i];
    if (curTemp < min) min = temps[i];
  }
  console.log(max);
  console.log(min);
  return max - min;
};
const amplitudeNew = calcTempAmplitudeBug([3, 5, 1], [9, 0, 5]);
console.log(amplitudeNew);

// Problem 2:
// Function should now receive 2 arrays of temps

// 1. Understanding the problem
// With 2 arrays, should we implement functionality twice? No! Just merge two arrays

// 2. Breaking it up into sub-problems
// - Merge 2 arrays
// - Send merged array to the amplitude function

*/

// 63. Debugging with the Console and Breakpoints

const measureKelvin = function () {
  const measurement = {
    type: "temp",
    unit: "celsius",
    // C) Fix
    // value: Number(prompt("Degrees celsius:")),
    value: 10,
  };

  // B) FIND
  console.log(measurement);
  console.table(measurement);
  //   console.log(measurement.value);
  //   console.warn(measurement.value);
  //   console.error(measurement.value);
  const kelvin = measurement.value + 273;
  return kelvin;
};
// A) Identify the bug
console.log(measureKelvin());

//using a debugger
const calcTempAmplitudeBug = function (t1, t2) {
  const temps = t1.concat(t2);
  let max = temps[0];
  let min = temps[0];

  for (let i = 0; i < temps.length; i++) {
    const curTemp = temps[i];
    if (typeof curTemp !== "number") continue;
    if (curTemp > max) max = temps[i];
    if (curTemp < min) min = temps[i];
  }
  console.log(max);
  console.log(min);
  return max - min;
};
const amplitudeNew = calcTempAmplitudeBug([3, 5, 1], [9, 4, 5]);
console.log(amplitudeNew);
