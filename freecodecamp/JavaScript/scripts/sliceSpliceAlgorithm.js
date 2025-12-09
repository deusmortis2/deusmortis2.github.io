"use strict";

function frankenSplice(arr1, arr2, index) {
  const newArr = [];
  for (let i = 0; i < arr2.length || i < 1; i++) {
    if (arr2.length === 0) {
      return arr1;
    } else if (i === index) {
      newArr.push(...arr1);
    }
    newArr.push(arr2[i]);
  }
  return newArr;
}

console.log(frankenSplice([1, 2, 3], [4, 5], 1));

console.log(frankenSplice([1, 2], ["a", "b"], 1));

console.log(frankenSplice(["claw", "tentacle"], ["head", "shoulders", "knees", "toes"], 2));

console.log(frankenSplice([1, 2, 3, 4], [], 0));
