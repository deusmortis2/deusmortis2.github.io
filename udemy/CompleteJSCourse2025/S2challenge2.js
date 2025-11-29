const bills = [125, 555, 44];

function calcTip(bill) {
  if (bill >= 50 && bill <= 300) {
    return bill * 0.15;
  } else {
    return bill * 0.2;
  }
}

const tips = [calcTip(bills[0]), calcTip(bills[1]), calcTip(bills[2])];

function calcTotals(bills, tips) {
  return bills + tips;
}
const totals = [
  calcTotals(bills[0], tips[0]),
  calcTotals(bills[1], tips[1]),
  calcTotals(bills[2], tips[2]),
];
console.log(
  `The bills were ${bills} and the tips were ${tips}, and the total bills were ${totals}`
);
