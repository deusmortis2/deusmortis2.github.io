'use strict';
const poll = new Map();
function addOption (option) {
  option=option.trim();
  if(!option) {
    return `Option cannot be empty.`;
  }
 if (poll.has(option)) {
    return `Option "${option}" already exists.`;
   
 } else {
   poll.set(option, new Set());
   return `Option "${option}" added to the poll.`;
 }
}

function vote (option, voterId) {
  if (!poll.has(option)) {
    return `Option "${option}" does not exist.`
  } else {
    const optionVotes = poll.get(option);
    if (poll.get(option).has(voterId)) {
      return `Voter ${voterId} has already voted for "${option}".`;
    } else {
      poll.get(option).add(voterId);
      return `Voter ${voterId} voted for "${option}".`;
    }
  }
}

function displayResults (pollEnd) {
let results = `Poll Results:`;
const sortedOptions =  Array.from(poll).forEach(([key,val]) => {results += `
${key}: ${val.size} votes`
})
return results;
}


addOption('Turkey');
addOption('Morocco');
addOption('Spain');

vote('Turkey', 'traveler1');
vote('Spain', 'traveler2');
vote('Morocco', 'traveler3');

console.log(poll);
console.log(displayResults(poll));
