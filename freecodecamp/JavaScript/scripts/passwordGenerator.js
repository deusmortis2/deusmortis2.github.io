const allCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
console.log(`${allCharacters} the amount of characters to choose from is ${allCharacters.length}`);
function generatePassword (passwordLength) {
    let passwordNum;
    let generatedPW = "";
    for (let i = 0; i < passwordLength; i++) {
        passwordNum = Math.round(Math.random()* 72)
        console.log(passwordNum);
        generatedPW += allCharacters.charAt(passwordNum);
        console.log(`current password ${generatedPW}`);
    }
    return generatedPW;
}
const password = generatePassword(4);
console.log(`Generated password: ${password}`);