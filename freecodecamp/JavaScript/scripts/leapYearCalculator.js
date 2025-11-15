let year = 1984;
function isLeapYear (year) {
 const isDivisibleBy4 = year % 4 ;
 const isDivisibleBy400 = year % 400;
 const isDivisibleBy100 = year % 100;
 console.log(isDivisibleBy4);
 console.log(isDivisibleBy400);
 console.log(isDivisibleBy100);
 if (isDivisibleBy4 === 0 & isDivisibleBy100 === 0 & isDivisibleBy400 === 0) {
   return `${year} is a leap year.`;
      } else if (isDivisibleBy4 === 0 & isDivisibleBy100 !== 0 ) {
        return `${year} is a leap year.`;
      }
 else {
   return `${year} is not a leap year.`;
 }
}
let result = isLeapYear(year);
console.log(result);
result = isLeapYear(2024);
console.log(result);
result = isLeapYear(2000);
console.log(result);
result = isLeapYear(1900);
console.log(result);