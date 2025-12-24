'use strict';
function steamrollArray (arr) {
    let flat = [].concat(...arr)
    if (flat.some(Array.isArray)) {
        return steamrollArray(flat);
    } else {
        return flat;
    }

}

console.log(steamrollArray([[["a"]], [["b"]]]));
console.log(steamrollArray([1, [2], [3, [[4]]]]));
console.log(steamrollArray([1, [], [3, [[4]]]]));
console.log(steamrollArray([1, {}, [3, [[4]]]]));
