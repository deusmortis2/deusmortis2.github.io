"use strict";

function pyramid(string, num, bool) {
  let results = "";
  for (let i = 0; i < num; i++) {
    const space = " ";
    if (i === 0) {
      results += "\n";
    }
    if (bool) {
      results += space.repeat(i);
      results += string.repeat(num * 2 - 1 - i * 2);
      results += "\n";
    } else {
      results += space.repeat(num - 1 - i);
      results += string.repeat((i + 1) * 2 - 1);
      results += "\n";
    }
  }
  return results;
}
console.log(JSON.stringify(pyramid("o", 4, false)));
console.log(JSON.stringify(pyramid("p", 5, true)));
