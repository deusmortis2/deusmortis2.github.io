/* You should create a function largestOfAll that takes an array of arrays as an argument.
The function should return an array containing the largest number from each sub-array.

Plan:
1. Use a loop to find the largest number in the array of arrays
2. Break array of arrays into each array
3. Find which array contains the largest number
4. Return that array

Plan not successful, had to change plan to find largest number of current array, and then push that number to the largest array to match user stories. 
Also had to use a number less than 0 in order to initialize largestNumber so negatives would register. 
*/
console.log(`hello`);
function largestOfAll(arr) {
  let smallArray = [];
  let largestNumber = 0;
  let largestArray = [];
  for (let i = 0; i < arr.length; i++) {
    largestNumber = -999;
    smallArray = arr[i];
    console.log(`The numbers ${i} in the array is  ${arr[i]}`);
    for (let j = 0; j < arr[i].length; j++) {
      console.log(`The numbers of the array ${arr[i]} is ${smallArray[j]}`);
      if (smallArray[j] > largestNumber) {
        largestNumber = smallArray[j];
        console.log(`Current largest number is ${largestNumber}`);
      }
      if (j === arr[i].length - 1) {
        largestArray.push(largestNumber);
      }
    }
  }
  console.log(`Current largest array is ${largestArray}`);
  return largestArray;
}

console.log(
  largestOfAll([
    [4, 5, 1, 3],
    [13, 27, 18, 26],
    [32, 35, 37, 39],
    [1000, 1001, 857, 1],
  ])
);

console.log(
  largestOfAll([
    [13, 27, 18, 26],
    [4, 5, 1, 3],
    [32, 35, 37, 39],
    [1000, 1001, 857, 1],
  ])
);

console.log(
  largestOfAll([
    [4, 9, 1, 3],
    [13, 35, 18, 26],
    [32, 35, 97, 39],
    [1000000, 1001, 857, 1],
  ])
);

console.log(
  largestOfAll([
    [17, 23, 25, 12],
    [25, 7, 34, 48],
    [4, -10, 18, 21],
    [-72, -3, -17, -10],
  ])
);
