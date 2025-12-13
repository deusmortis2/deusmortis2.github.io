// Remember, we're gonna use strict mode in all scripts now!
"use strict";
const temperatures = [3, -2, -6, -1, "error", 9, 13, 17, 15, 14, 9, 5];
const calcTempAmplitudeNew = function (t1, t2) {
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
const amplitudeNew = calcTempAmplitudeNew([3, 5, 1], [9, 0, 5]);
console.log(amplitudeNew);

// Problem 2:
// Function should now receive 2 arrays of temps

// 1. Understanding the problem
// With 2 arrays, should we implement functionality twice? No! Just merge two arrays

// 2. Breaking it up into sub-problems
// - Merge 2 arrays
// - Send merged array to the amplitude function
