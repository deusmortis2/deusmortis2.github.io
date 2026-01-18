'use strict';

const txtInput = document.getElementById("text-input");
const result = document.getElementById("result");
const checkBtn = document.getElementById("check-btn");
const palResult = document.getElementById("palindromeResult");
let inputString = "";

txtInput.addEventListener('keydown', function(event) {
if (event.key === 'Enter') {
    inputString = txtInput.value;
    palResult.textContent = "";
    if (inputString === "") {
        alert("Please input a value");
    }
    result.textContent = txtInput.value;
    inputString = inputString.replaceAll(/[^a-zA-Z0-9]/gi, "");
    inputString = inputString.replaceAll(/\s+/g);
    console.log(inputString);
    if (palindromeChecker(inputString) === true)
    {
        palResult.textContent += " is a palindrome";
    } else {
        palResult.textContent += " is not a palindrome";
    }
}
});

checkBtn.addEventListener('click', function () {
    inputString = txtInput.value;
    palResult.textContent = "";
    if (inputString === "") {
        alert("Please input a value");
    }
    
    result.textContent = txtInput.value;
    inputString = inputString.replaceAll(/[^a-zA-Z0-9]/gi, "");
    inputString = inputString.replaceAll(/\s+/gi);
    console.log(inputString);
    if (palindromeChecker(inputString) === true)
    {
        palResult.textContent += " is a palindrome";
    } else {
        palResult.textContent += " is not a palindrome";
    }
});

function palindromeChecker (str) {
    const half = Math.floor(str.length/2);
    if (str.length % 2 === 0) {
        const firstEven = str.slice(0, half).toLowerCase();
        const lastEven = str.slice(half, str.length).toLowerCase();
        console.log(`first half is ${firstEven} second half is ${lastEven.split("").reverse().join("")}`);
        if (firstEven === lastEven.split("").reverse().join("")){
            return true;
        } else {
            return false;
        }
    } else {
    const firstOdd = str.slice(0, half).toLowerCase();
    const lastOdd = str.slice(half + 1, str.length).toLowerCase();
    console.log(`first half is ${firstOdd} second half is ${lastOdd.split("").reverse().join("")}`);
    if (firstOdd === lastOdd.split("").reverse().join("")){
            return true;
        } else {
            return false;
        }
    }
};