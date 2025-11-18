const questions = [
{
  category: "math",
  question: "What is 3 + 3?",
  choices: ['5', '6','7'],
  answer: '6'
}, {
  category: "math",
  question: "What is 3 + 5?",
  choices: ['7', '8', '9'],
  answer: '8'
}, {
  category: "math",
  question: "What is 2 + 3?",
  choices: ['5', '4', '6'],
  answer: '5'
}, {
  category: "math",
  question: "What is 1 + 3?",
  choices: ['5', '4', '3'],
  answer: '4'
}, {
  category: "math",
  question: "What is 4 + 3?",
  choices: ['8', '6','7'],
  answer: '7'
} ];

function getRandomQuestion (questionsArr) {
 return questionsArr[Math.round(Math.random() * questionsArr.length)];
}

function getRandomComputerChoice (questionsArr) {
  return questionsArr[Math.round(Math.random()* questionsArr.length)]
}

function getResults (question, cpuchoice) {
  if (question.answer == cpuchoice) {
    return "The computer's choice is correct!";
  }
  else {
    return `The computer's choice is wrong. The correct answer is: ${question.answer}`;
  }
}
let randomQ = getRandomQuestion(questions);
let cpuC = getRandomComputerChoice(randomQ);
console.log(randomQ);
console.log(getRandomComputerChoice(randomQ.choices));
console.log(getResults(randomQ,cpuC));

