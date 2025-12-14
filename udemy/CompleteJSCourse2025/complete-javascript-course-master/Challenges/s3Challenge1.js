/*
Given an array of forecasted maximum temperatures, the thermometer displays a string with these temperatures.

Example: [17, 21, 23] will print "... 17ºC in 1 days ... 21ºC in 2 days ... 23ºC in 3 days ..."

Create a function 'printForecast' which takes in an array 'arr' and logs a string like the above to the console.

Use the problem-solving framework: Understand the problem and break it up into sub-problems!

TEST DATA 1: [17, 21, 23]
TEST DATA 2: [12, 5, -5, 0, 4]
*/

/* Take in an array of max temps, create a string displaying the temp then the days until that temp.. 
1. Create loop to go through all array options. 
2. Print the temperature using console log command, plus the amount of days which is the index + 1. 
3. Return the string
*/

function printForecast(maxTemps) {
  let displayTemps = ``;
  for (let i = 0; i < maxTemps.length; i++) {
    displayTemps += `... ${maxTemps[i]}°C in ${i + 1} days`;
  }
  displayTemps += ` ...`;
  return displayTemps;
}

console.log(printForecast([17, 21, 23]));
console.log(printForecast([12, 5, -5, 0, 4]));
