
function sumFibs (num) {
 const fibArray = [0, 1, 1, 2];
 let i = 3;
 let sum = 2;
 let newPush = 0;
while (newPush <= num) {
    newPush = 0;
    newPush = fibArray[i] + fibArray[i-1];
    fibArray.push(newPush);
    console.log(i);
    if (newPush % 2 != 0) {
        sum += newPush;
    }
        i++; 
        console.log(fibArray);
}return sum-newPush;
}
console.log(sumFibs(75025));