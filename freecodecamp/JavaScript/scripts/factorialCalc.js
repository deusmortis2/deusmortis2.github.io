const num = 9;

function factorialCalculator(num) {
  let result = 1;
  for (let i = 1; i < num + 1; i++) {
    result = result * i;
  }
  return result;
}

let factorial = factorialCalculator(num);
const resultMsg = `Factorial of ${num} is ${factorial}`;
console.log(resultMsg);
