function mutation([str1, str2]) {
  console.log(str1);
  console.log(str2);
  const uniqueLetters1 = new Set(str1.toLowerCase());
  const uniqueLetters2 = new Set(str2.toLowerCase());
  const uniqueCharArray1 = [...uniqueLetters1];
  const newString1 = uniqueCharArray1.join("");
  const uniqueCharArray2 = [...uniqueLetters2];
  const newString2 = uniqueCharArray2.join("");
  console.log(newString1);
  console.log(newString2);
  let match = 0;
  for (let i = 0; i < newString2.length; i++) {
    if (newString1.includes(uniqueCharArray2[i])) {
      match++;
      console.log(match);
    }
    if (match === newString2.length) {
      return true;
    }
  }
  return false;
}

console.log(mutation(["hello", "hey"]));
console.log(mutation(["hello", "Hello"]));
console.log(mutation(["zyxwvutsrqponmlkjihgfedcba", "qrstu"]));
console.log(mutation(["Mary", "Army"]));
console.log(mutation(["Mary", "Aarmy"]));
console.log(mutation(["Alien", "line"]));
console.log(mutation(["floor", "for"]));
console.log(mutation(["hello", "neo"]));
console.log(mutation(["voodoo", "no"]));
console.log(mutation(["ate", "date"]));
console.log(mutation(["Tiger", "Zebra"]));
console.log(mutation(["Noel", "Ole"]));
