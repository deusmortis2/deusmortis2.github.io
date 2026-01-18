'use strict';
const markdownInput = document.getElementById("markdown-input");
const previewText = document.getElementById("preview");
const htmlOutput = document.getElementById("html-output");
let markdownTxt = "";
let htmlTxt = "";





function convertMarkdown () {
markdownInput.addEventListener('input', function(event) {
markdownTxt = event.target.value;
return markdownTxt;
});
const test = `# heading 1 \n
## heading 2 \n
### heading 3	\n
/# /* escape characters \n
A list \n
* list 1 \n
* list 2 \n
#heading \n
* list 3 \n
**bold text** \n
__bold text__ \n
*italic text* \n 
_italic text_ \n
![alt-text](image-source) \n
[linktext](URL) \n
> quote `;
const headings = [...test.matchAll(/(?<!\/)#+(?= )/g)];
const listAsterisks = [...test.matchAll(/(?<!\/)(?<=\\s|^)\*(?= )/gm)];
const blockQuotes = [...test.matchAll(/(?<!\/)(?<=\\s|^)>(?= )/gm)];
const listIndices = listAsterisks.map((match) => match.index);
const asterisks = [...test.matchAll(/(?<!\/)\*+/g)];
const bold = asterisks.filter((asterisk) => !listIndices.includes(asterisk.index) && asterisk[0] === "**");
const italics = asterisks.filter((asterisk) => !listIndices.includes(asterisk.index) && asterisk[0] === "*");
const brackets = [...test.matchAll(/\\[(.*?)\\]/gm)].map(match => match[1]);
console.log(brackets);
htmlOutput.textContent = headings + "\n";
htmlOutput.textContent += listAsterisks + "\n";
htmlOutput.textContent += blockQuotes;

}

convertMarkdown();

/*
# heading 1
## heading 2
### heading 3	
**bold text**
__bold text__
*italic text*
_italic text_
![alt-text](image-source)
[link text](URL)
> quote
*/