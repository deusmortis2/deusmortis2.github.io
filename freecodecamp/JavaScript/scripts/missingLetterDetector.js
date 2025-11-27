function fearNotLetter(string) {
  const alpha = "abcdefghijklmnopqrstuvwxyz";
  const first = string[0];
  const last = string[string.length - 1];
  const full = alpha.slice(alpha.indexOf(first), alpha.indexOf(last) + 1);
  console.log(alpha, first, last, full);
  for (let i = 0; i < full.length; i++) {
    if (!string.includes(full[i])) {
      return full[i];
    }
  }
  return undefined;
}

console.log(fearNotLetter("abce"));
console.log(fearNotLetter("abcdefghjklmno"));
console.log(fearNotLetter("stvwx"));
console.log(fearNotLetter("bcdf"));
console.log(fearNotLetter("abcdefghijklmnopqrstuvwxyz"));
