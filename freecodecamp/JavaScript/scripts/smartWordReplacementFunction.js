'use strict';

function myReplace (fullStr, wordToRemove, wordReplace) {
const matches = [...wordToRemove.matchAll(/[A-Z]/g)];
const indices = matches.map((match) => match.index);
const replaceArr = wordReplace.toLowerCase().split("");
let newWordReplace = "";


for (let i = 0; i < wordReplace.length; i++) {
    if (indices.includes(i)) {
        newWordReplace += replaceArr[i].toUpperCase();
    } else {
   newWordReplace += replaceArr[i];
}
}
   return fullStr.replace(wordToRemove, newWordReplace);
}
console.log(myReplace("Jacob is running to HoLyLand", "HoLyLand", "playground"));
console.log(myReplace("Let us go to the store", "store", "mall"));
console.log(myReplace("He is Sleeping on the couch", "Sleeping", "sitting"));
console.log(myReplace("I think we should look up there", "up", "Down"));
console.log(myReplace("This has a spellngi error", "spellngi", "spelling"));
console.log(myReplace("His name is Tom", "Tom", "john"));
console.log(myReplace("Let us get back to more Coding", "Coding", "algorithms"));