'use strict';
function countdown (num) {
  let countArray = [];
  if (num < 1) {
    return [];
  }
   if (num > 0) {
    countArray = countdown(num - 1);
    countArray.unshift(num);
    return countArray;
  }
}
const countdown10 = countdown(10);
console.log(countdown10);
console.log(countdown(5));