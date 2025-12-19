function getAverage (testScores) {
    let sum = 0;
    for (let i = 0; i < testScores.length; i++) {
        sum += testScores[i];
    }
    return sum / testScores.length;
}

function getGrade (studentScore) {
    if (studentScore === 100) {
        return 'A+';
    } else if (studentScore >= 90) {
        return 'A';
    } else if (studentScore >= 80) {
        return 'B';
    } else if (studentScore >= 70) {
        return 'C';   
    } else if (studentScore >= 60) {
        return 'D';
    } else {
        return 'F';
    }
}

function hasPassingGrade (studentScore) {
    if (studentScore > 59) {
        return true;
    } else {
        return false;
    }
}

function studentMsg (testScores, studentScore) {
let passingGradeMsg = '';
if (hasPassingGrade(studentScore) === true) {
    passingGradeMsg = 'You passed the course.'
} else {
    passingGradeMsg = 'You failed the course.'
}
return `Class average: ${getAverage(testScores)}. Your grade: ${getGrade(studentScore)}. ${passingGradeMsg}`;
}


console.log(studentMsg([92, 88, 12, 77, 57, 100, 67, 38, 97, 89], 37));
console.log(studentMsg([12, 22, 32, 42, 52, 62, 72, 92], 85));
console.log(studentMsg([15, 25, 35, 45, 55, 60, 70, 60], 75));