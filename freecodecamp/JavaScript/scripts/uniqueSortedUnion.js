'use strict';

function uniteUnique (...rest) {
const newArr = [];
for (const i of rest) {
    for (let j = 0; j < i.length;j++) {
        if (!newArr.includes(i[j])) {
            newArr.push(i[j]);
        }
    }
 
}
return newArr;
}



console.log(uniteUnique([1, 3, 2], [5, 2, 1, 4], [2, 1]));
console.log(uniteUnique([1, 2, 3], [5, 2, 1]));
console.log(uniteUnique([1, 2, 3], [5, 2, 1, 4], [2, 1], [6, 7, 8]));
console.log(uniteUnique([1, 3, 2], [5, 4], [5, 6]));
console.log(uniteUnique([1, 3, 2, 3], [5, 2, 1, 4], [2, 1]));