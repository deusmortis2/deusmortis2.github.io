const calcAverage = (score1, score2, score3) => (score1 + score2 + score3) / 3;
let scoreDolphins = calcAverage(44, 23, 71);
let scoreKoalas = calcAverage(65, 54, 49);

function checkWinner(scoreDolphins, scoreKoalas) {
  if (scoreDolphins >= scoreKoalas * 2) {
    return console.log(`Dolphins win (${scoreDolphins} vs. ${scoreKoalas})`);
  } else if (scoreKoalas >= scoreDolphins * 2) {
    return console.log(`Koalas win (${scoreKoalas} vs. ${scoreDolphins})`);
  } else {
    return console.log(`No team wins...`);
  }
}
checkWinner(scoreDolphins, scoreKoalas);

scoreDolphins = calcAverage(85, 54, 41);
scoreKoalas = calcAverage(23, 34, 27);
checkWinner(scoreDolphins, scoreKoalas);

//personal test
checkWinner(calcAverage(28, 21, 19), calcAverage(88, 80, 95));
