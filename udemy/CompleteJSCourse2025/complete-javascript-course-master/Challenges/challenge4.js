const bill = 275;

/* Write your code below. Good luck! 🙂 */

const tip = bill >= 50 && bill <= 300 ? bill * 0.15 : bill * 0.2;
console.log(
  `The bill was ${bill}, the tip was ${tip}, and the total value was ${
    bill + tip
  }`
);

const bill2 = 40;
const tip2 = bill2 >= 50 && bill2 <= 300 ? bill2 * 0.15 : bill2 * 0.2;
console.log(
  `The bill was ${bill2}, the tip was ${tip2}, and the total value was ${
    bill2 + tip2
  }`
);

const bill3 = 430;
const tip3 = bill3 >= 50 && bill3 <= 300 ? bill3 * 0.15 : bill3 * 0.2;
console.log(
  `The bill was ${bill3}, the tip was ${tip3}, and the total value was ${
    bill3 + tip3
  }`
);
