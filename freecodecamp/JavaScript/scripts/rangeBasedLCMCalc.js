function smallestCommons (numArr) {
const gcd = (a, b) => b == 0 ? a : gcd (b, a % b);
const lcm = (a, b) => a * b / gcd(a,b);
   
   numArr.sort((a, b) => a - b);
   for (let i=numArr[0]+1; i < numArr[1]; ++i) {
    numArr.push(i);
    
   }

    return numArr.sort((a, b) => a - b)
                   .reduce(lcm,1);
}

console.log(smallestCommons([1, 5]));
console.log(smallestCommons([5, 1]));
console.log(smallestCommons([2, 10]));
console.log(smallestCommons([1, 13]));
console.log(smallestCommons([23, 18]));
