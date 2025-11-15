let email = "sylleste2@gmail.com";
function maskEmail (email) {
  const atLoc = email.indexOf("@",1);
  const maskPart = email.slice(1,atLoc - 1);
  const emailLength = maskPart.length;
  const star = "*";
  const numStars = star.repeat(emailLength);
return email.replaceAll(maskPart, numStars);
};
console.log(maskEmail(email));
console.log(maskEmail("apple.pie@example.com"));
console.log(maskEmail("freecodecamp@example.com"));
console.log(maskEmail("info@test.dev"));
console.log(maskEmail("user@domain.org"));