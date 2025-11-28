const repeatStringNumTimes = (string, num) => {
  let finalString = "";
  for (let i = 0; i < num; i++) {
    finalString += string;
  }
  return finalString;
};
console.log(repeatStringNumTimes("*", 3));
console.log(repeatStringNumTimes("abc", 3));
console.log(repeatStringNumTimes("abc", 4));
console.log(repeatStringNumTimes("abc", 1));
console.log(repeatStringNumTimes("*", 8));
console.log(repeatStringNumTimes("abc", -2));
console.log(repeatStringNumTimes("abc", 0));
