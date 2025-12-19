'use strict';
/*
// 76. Selecting and Manipulating Elements
console.log(document.querySelector(".message").textContent);

document.querySelector(".message").textContent = "Correct Number! 🎉";

document.querySelector(".number").textContent = 13;

document.querySelector(".score").textContent = 10;

console.log(document.querySelector(".guess").value);

document.querySelector(".guess").value = 23;
*/

//77. Handling Click Events
let secretNumber = Math.round(Math.random() * 20 + 1);
let score = 20;
let highScore = 0;

// document.querySelector('.number').textContent = secretNumber;
document.querySelector('.check').addEventListener('click', function () {
    const guess = Number(document.querySelector('.guess').value);
    console.log(guess, typeof guess);

//incorrect input
if (!guess || guess < 1 || guess > 20) {
    document.querySelector('.message').textContent = '⛔️ No Number! Select a number between 1 and 20.';
//correct guess
} else if (guess === secretNumber) {
    document.querySelector('.message').textContent = '🎉 Correct Number!';

    document.querySelector('.number').textContent = secretNumber;
    document.querySelector('body').style.backgroundColor = '#60b347';
    document.querySelector('.number').style.width = '30rem';

    if (score > highScore) {
        highScore = score;
        document.querySelector('.highscore').textContent = highScore;
    }
    
// too high
} else if (guess > secretNumber && score > 1) {
    document.querySelector('.message').textContent = '📈 Too High!';
    score--;
    document.querySelector('.score').textContent = score;
// too low
} else if (guess < secretNumber && score > 1) {
    document.querySelector('.message').textContent = '📉 Too Low!';
    score--;
    document.querySelector('.score').textContent = score;
// game over
} else {
    score=0;
    document.querySelector('.score').textContent = score;
    document.querySelector('.message').textContent = '💥 You lost the game!';
}
});

document.querySelector('.again').addEventListener('click',function() {
    score = 20;
    secretNumber = Math.round(Math.random() * 20 + 1);
    document.querySelector('.message').textContent = 'Start guessing... ';
    document.querySelector('.score').textContent = score;
    document.querySelector('.number').textContent = "?";
    document.querySelector('.guess').value = "";

    document.querySelector('body').style.backgroundColor = '#222';
    document.querySelector('.number').style.width = '15rem';
})



///////////////////////////////////////
// Coding Challenge #1

/* 
Implement a game rest functionality, so that the player can make a new guess! Here is how:

1. Select the element with the 'again' class and attach a click event handler
2. In the handler function, restore initial values of the score and secretNumber variables
3. Restore the initial conditions of the message, number, score and guess input field
4. Also restore the original background color (#222) and number width (15rem)

GOOD LUCK 😀
*/