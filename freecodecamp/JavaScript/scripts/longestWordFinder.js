function findLongestWordLength(string) {
  let words = string.split(" ");
  console.log(`These are all the words in the sentence: ${words}
  `);
  let longestWord = 0;
  for (let i = 0; i < words.length; i++) {
    longestWord = words[i].length > longestWord ? words[i].length : longestWord;
  }
  return longestWord;
}

let testSentence = "The quick brown fox jumped over the lazy dog";
let result = findLongestWordLength(testSentence);
console.log(`The longest word in the sentence "${testSentence}" is ${result} characters long.
`);

testSentence = "May the force be with you";
result = findLongestWordLength(testSentence);
console.log(`The longest word in the sentence "${testSentence}" is ${result} characters long.
`);

testSentence = "Google do a barrel roll";
result = findLongestWordLength(testSentence);
console.log(`The longest word in the sentence "${testSentence}" is ${result} characters long.
`);

testSentence = "What is the average airspeed velocity of an unladen swallow";
result = findLongestWordLength(testSentence);
console.log(`The longest word in the sentence "${testSentence}" is ${result} characters long.
`);

testSentence = "What if we try a super-long word such as otorhinolaryngology";
result = findLongestWordLength(testSentence);
console.log(`The longest word in the sentence "${testSentence}" is ${result} characters long.
`);
