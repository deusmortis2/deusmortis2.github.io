'use strict';
function rangeOfNumbers(startNum, endNum) { 
  if (startNum > endNum) {
    return [];
  }

  let countArr = rangeOfNumbers(startNum, endNum - 1);
  countArr.push(endNum);
  return countArr;
}

console.log(rangeOfNumbers(3, 9));