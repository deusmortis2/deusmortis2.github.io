function bouncer (arr) {
const newArr = [];
for (let i = 0; i < arr.length; i++) {
    if (Boolean(arr[i]) === true) {
        newArr.push(arr[i]);
    }
} return newArr;
}
console.log(bouncer([7, "ate", "", false, 9]));
console.log(bouncer(["a", "b", "c"]));
console.log(bouncer([false, null, 0, NaN, undefined, ""]));
console.log(bouncer([null, NaN, 1, 2, undefined]));
console.log(bouncer([]));