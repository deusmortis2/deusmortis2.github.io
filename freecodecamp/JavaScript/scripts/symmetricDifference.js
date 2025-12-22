function diffArray (arrA, arrB) {
let mergedArray = [...arrA, ...arrB];
const copiedArr = mergedArray.filter((value, index) => mergedArray.indexOf(value) !== index);
console.log(copiedArr);
return mergedArray.filter((value) => !copiedArr.includes(value));
}
console.log(diffArray(["diorite", "andesite", "grass", "dirt", "pink wool", "dead shrub"], ["diorite", "andesite", "grass", "dirt", "dead shrub"]));
console.log(diffArray(["diorite", "andesite", "grass", "dirt", "pink wool", "dead shrub"], ["andesite", "grass", "dirt", "dead shrub"]));
console.log(diffArray(["pen", "book"], ["book", "pencil", "notebook"]));
console.log(diffArray(["car", "bike", "bus"], ["bike", "train", "plane", "bus"]));
console.log(diffArray(["apple", "orange"], ["apple", "orange", "banana", "grape"]));
console.log(diffArray([], ["apple", "banana"]));
console.log(diffArray(["apple", "banana"], []));
console.log(diffArray([], []));
