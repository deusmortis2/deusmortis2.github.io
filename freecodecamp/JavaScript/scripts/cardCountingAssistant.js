let count = 0;
function cc (card) {
  if (card < 7 ) {
    count++;
    if (count > 0) {
      return count + ` Bet`;
    }
    else {
      return count + ` Hold`;
    }
  } else if (card > 6 && card < 10) {
    if (count > 0) {     
    return count + ` Bet`;
    }
    else {
      return count + ` Hold`;
    };
  } else {
    count--;
    if (count > 0) {     
    return count + ` Bet`;
    }
    else {
      return count + ` Hold`;
    };
  }
}
//test game 1
cc(2);
cc(3);
cc(4);
cc(5);
console.log(cc(6));
count = 0;
//test game 2
cc(7);
cc(8);
console.log(cc(9));
count = 0;
//test game 3
cc(10);
cc("J");
cc("Q");
cc("K");
console.log(cc("A"));
count = 0;
//test game 4
cc(3);
cc(7);
cc("Q");
cc(8);
console.log(cc("A"));
count = 0;
//test game 5
cc(2);
cc("J");
cc(9);
cc(2);
console.log(cc(7));
count = 0;
//game 6
cc(2);
cc(2);
console.log(cc(10));
count = 0;
//test game 7
cc(3);
cc(2);
cc("A");
cc(10);
console.log(cc("K"));

