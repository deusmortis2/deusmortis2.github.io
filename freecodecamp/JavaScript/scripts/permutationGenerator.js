'use strict';
function permuteString (str, prefix, results) {
if (str.length === 0 || str.length === 1) {
  return [str];
}else {
    let result = [];
    for (let i = 0; i < str.length; i++) {
      const currentChar = str[i];
      const remainingChars = str.slice(0, i) + str.slice(i + 1);
      const remainingCharsMixed = permuteString(remainingChars);

      for (let j = 0; j < remainingCharsMixed.length; j++) {
        const permutation = currentChar + remainingCharsMixed[j];
        result.push(permutation);
      }
    }
    const uniqueResults = [...new Set(result)];
    return uniqueResults;
  }
}

function arrayLength (num) {
  if (num <= 1) {
    return 1;
  }
  return num * arrayLength (num - 1);
}

console.log(arrayLength(4));
console.log(permuteString("fcp"));