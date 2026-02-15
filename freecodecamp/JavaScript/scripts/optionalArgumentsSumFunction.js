'use strict';
function addTogether (num1, ...nums) {
 console.log("nums is array? " + Array.isArray(num1))
console.log("arguments length " + arguments.length + 
"\nnum1 value " + num1 + "\nnums value " + nums[0] + "\ntype of 1 " + typeof(num1) + "\ntype of nums" + typeof(nums[0]) + "\nnums length " + nums.length);
if (nums.length === 0 && typeof num1 === "number") {
    return function(b) {if (typeof b === "number") {return num1 + b }};
}
if (typeof num1 === "number" && typeof nums[0] === "number") {
  return num1 + nums[0];
}
else if (typeof num1 !== "number" || typeof nums[0] !== "number"|| Array.isArray(isArray) === true) {
  return undefined;
}
else {

}
}

console.log("add together return " + addTogether(2)([3]));
// console.log(addTogether(5, undefined));

// console.log(addTogether(2, 3));

// console.log(addTogether(23.4, 30))

// console.log(addTogether([1]));

// console.log(addTogether("1"));

// console.log(addTogether(2)([3]))