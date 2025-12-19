function titleCase (str) {
const wordsArray = str.toLowerCase().split(' ');
let finalString = '';
console.log(`Array = ${wordsArray}, ${str}`);
for (let i = 0; i < wordsArray.length; i++) {
    const firstLetter = wordsArray[i].toUpperCase().slice(0, 1);
    const wordEnd = wordsArray[i].slice(1,wordsArray[i].length);
    finalString += firstLetter;
    finalString += wordEnd;
    finalString += " ";
}
return finalString.trimEnd();
}


console.log(titleCase("I like to code"));
console.log(titleCase("I'm a little tea pot"));
console.log(titleCase("sHoRt AnD sToUt"));
console.log(titleCase("HERE IS MY HANDLE HERE IS MY SPOUT"));
console.log(titleCase("javaScript is fun"));