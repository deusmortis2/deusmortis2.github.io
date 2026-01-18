'use strict';

const regexPattern = document.getElementById("pattern");
const stringToTest = document.getElementById("test-string");
const testButton = document.getElementById("test-btn");
const testResult = document.getElementById("result");
const caseInsensitiveFlag = document.getElementById("i");
const globalFlag = document.getElementById("g");

function getFlags () {
if (globalFlag.checked && caseInsensitiveFlag.checked ) {
    return "gi";
} else if (globalFlag.checked) {
    return "g";
} else if (caseInsensitiveFlag.checked) {
    return "i";
} else {
    return "";
}
}

function getRegex(flags) {
    return new RegExp(regexPattern.value, flags);
}

testButton.addEventListener("click", () => {
let currFlags = getFlags();
testResult.innerText = "";
const testStr = stringToTest.textContent;
const regex = getRegex(currFlags);
if (testStr.match(regex) !== null) {
    getSpans (currFlags, regex, testStr);
    return;
} else {
    testResult.innerText = "no match";
    return ;
}
});

function getSpans (flags, regex, testStr) {
let resultHTML = "";
let result = "";
let matchString = "";
if (flags.includes("g")) {
    const matches = [...testStr.matchAll(regex)];
    for (let i = 0; i < matches.length; i++) {
        if (i === 0) {
            matchString = matches[i].toString();
            resultHTML += testStr.slice(0,matches[0].index);
            resultHTML += '<span class="highlight">';
            resultHTML += testStr.slice(matches[i].index, matches[i].index + matchString.length);
            resultHTML += '</span>';
            result += matches[i];
            matchString = "";
        } else if (i >= 1) {
            result += ", ";
            result += matches[i];
            matchString = matches[i].toString();
            let pString = matches[i - 1].toString();
            resultHTML += testStr.slice(matches[i - 1].index + pString.length, matches[i].index);
            resultHTML += '<span class="highlight">';    
            resultHTML += testStr.slice(matches[i].index, matches[i].index + matchString.length); 
            resultHTML += '</span>';
            matchString = "";
            pString = "";
            }
        }
        matchString = matches[matches.length - 1].toString();
        resultHTML += testStr.slice(matches[matches.length - 1].index + matchString.length, testStr.length);
        matchString = "";
        testResult.innerText = result;
        stringToTest.innerHTML = "";
        stringToTest.innerHTML = resultHTML;
    }else {
        const match = testStr.match(regex);
        matchString = match.toString();
        resultHTML += testStr.slice(0,match.index);
        resultHTML += '<span class="highlight">';
        resultHTML += testStr.slice(match.index, match.index + matchString.length);
        resultHTML += '</span>';
        resultHTML += testStr.slice(match.index  + matchString.length, testStr.length);
        stringToTest.innerHTML = resultHTML;
        testResult.innerText = match;
    }
}