'use strict';

function translatePigLatin (iniStr) {
let firstVowel = iniStr.match(/[aeiou]/i);
if (firstVowel === null) {
    return iniStr + "ay";
} else if (firstVowel.index === 0) {
    return iniStr += "way";
    }
    const endChar = iniStr.slice(0, firstVowel.index);
    const begPL = iniStr.slice(firstVowel.index);
    return begPL + endChar + "ay";
}



console.log(translatePigLatin("california"));
console.log(translatePigLatin("paragraphs"));
console.log(translatePigLatin("glove"));
console.log(translatePigLatin("algorithm"));
console.log(translatePigLatin("eight"));
console.log(translatePigLatin("schwartz"));
console.log(translatePigLatin("rhythm"));
