'use strict';
const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
function sumPrimes (num) {
let allNum = [];
let filteredNum = []
 for (let j = 2; j <= num; j++) {
    allNum.push(j);
  }
  filteredNum = allNum.filter((num) => primes.every((prime) => num % prime !== 0 && num !== prime));
  for (let i = 0; i < primes.length; i++) {
    if (primes[i]<= num) {
    filteredNum.push(primes[i]);
    }
  }
  console.log(filteredNum)
 return filteredNum.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

console.log(sumPrimes(10));
console.log(sumPrimes(5));
console.log(sumPrimes(2));
console.log(sumPrimes(0));
console.log(sumPrimes(977));