function dropElements (array, func) {
let newArray = [];
for (let i = 0; i < array.length; i++) {
    let x = array[i];
    
    if (func(x) === true) {
        console.log(`${x} passed the test ${func}`);
        newArray = array.slice(i, array.length);
        break;
    }
}
return newArray;
}


console.log(dropElements([1, 2, 3, 4], function(n) {return n >= 3;}));
console.log(dropElements([0, 1, 0, 1], function(n) {return n === 1;}));
console.log(dropElements([1, 2, 3], function(n) {return n > 0;}));
console.log(dropElements([1, 2, 3, 4], function(n) {return n > 5;}));
console.log(dropElements([1, 2, 3, 7, 4], function(n) {return n > 3;}));
console.log(dropElements([1, 2, 3, 9, 2], function(n) {return n > 2;}));
