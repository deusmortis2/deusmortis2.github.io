const fortune1 = 'If you think nobody cares if you are alive, try missing a couple of car payments.';
const fortune2 = 'Dogs have owners, cats have staff';
const fortune3 = 'The fortune you seek is in another cookie';
const fortune4 = `If a turtle doesn't have a shell is it naked or homeless?`;
const fortune5 = `You don't have to be faster than the bear, you just have to be faster than the slowest guy.`;
const randomNumber = Math.floor(Math.random() * 5) + 1;
let selectedFortune;
if (randomNumber == 1) {
  selectedFortune = fortune1;
}
else if (randomNumber == 2) {
  selectedFortune = fortune2;
}
else if (randomNumber == 3) {
  selectedFortune = fortune3;
}
else if (randomNumber == 4) {
  selectedFortune = fortune4;
}
else{
  selectedFortune = fortune5;
}

console.log(selectedFortune);
