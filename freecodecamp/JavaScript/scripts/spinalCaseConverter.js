'use strict';

function spinalCase(iniStr) {
let newStr = iniStr.replaceAll(/[A-Z]/g, " $&");
newStr = newStr.replaceAll("_", " ");
newStr = newStr.replaceAll("-", " ");
if (newStr[0] === " ") {
    newStr = newStr.slice(1);
}
return newStr.toLowerCase().split(/\s+/).join("-");
}

console.log(spinalCase("This Is Spinal Tap"));
console.log(spinalCase("thisIsSpinalTap"));
console.log(spinalCase("The_Andy_Griffith_Show"));
console.log(spinalCase("Teletubbies say Eh-oh"));
console.log(spinalCase("AllThe-small Things"));