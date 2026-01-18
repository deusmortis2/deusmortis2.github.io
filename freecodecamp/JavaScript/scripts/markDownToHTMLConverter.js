'use strict';


const markdownInput = document.getElementById("markdown-input");
const previewText = document.getElementById("preview");
const htmlOutput = document.getElementById("html-output");
markdownInput.addEventListener('input', () => {
    htmlOutput.textContent = convertMarkdown();
    previewText.innerHTML = convertMarkdown();
});

function convertMarkdown () {
    const markdownInputTxtDirty = markdownInput.value;
    let markdownInputTxt = DOMPurify.sanitize(markdownInputTxtDirty);
    let htmlOutText = "";
    const headings2 = [...markdownInputTxt.matchAll(/(?<!\/)(^#+)\s(?<headingText>.*)/gm)];
    const headings = [...markdownInputTxt.matchAll(/(?<!\/)^#+(?= )/gm)];
    const listAsterisks = [...markdownInputTxt.matchAll(/(?<!\/)(?<=\\s|^)\*(?= )/gm)];
    const listIndices = listAsterisks.map((match) => match.index);
    const underscores = [...markdownInputTxt.matchAll(/(?<!\/)_+/g)];
    const boldUnder = underscores.filter((underscore) => !listIndices.includes(underscore.index) && underscore[0] === "__");
    const italicUnder = underscores.filter((underscore) => !listIndices.includes(underscore.index) && underscore[0] === "_");

    const linkText = [...markdownInputTxt.matchAll(/(?<!!)\[(?<text>.+?)\]\((?<href>.+?)\)/g)];
    const imgText = [...markdownInputTxt.matchAll(/(?<=!)\[(?<text>.+?)\]\((?<href>.+?)\)/g)];
    const bqText = [...markdownInputTxt.matchAll(/(?<!\/)(?<=\\s|^)>\s(?<blockquoteText>.*)/gm)];
    const headingTxt = [];
    const italicTxt = [];
    const headingTypes = headings.map((h) => h[0]);
    const asterisks = [...markdownInputTxt.matchAll(/(?<!\/)\*+/g)];

    let italics = asterisks.filter((asterisk) => !listIndices.includes(asterisk.index) && asterisk[0] === "*" || asterisk[0] === "***");
    for (const heading of headings2) {
        headingTxt.push(heading[2]);
    }
    htmlOutText = markdownInputTxt;   
    let htmlAdd = "";
    let markdownOld = "";
    for (let i = 0; i < headings.length; i++ ) {
        htmlAdd = "";
        markdownOld = "";
        markdownOld = "#".repeat(headingTypes[i].length) + " " + headingTxt[i];
        htmlAdd = "<h" + headingTypes[i].length + ">" + headingTxt[i] + "</h" + headingTypes[i].length + ">\n";
        htmlOutText = htmlOutText.replace(markdownOld, htmlAdd);
    }
    const italicIndices = italics.map((i) => i.index);
    const italicUnderIndices = italicUnder.map((i) => i.index);
    const allItalicIndices = [...italicIndices, ...italicUnderIndices]
    const allItalics = [...italics, ...italicUnder];
    const newItalicIndices = [];
    for (let i = 0; i < allItalicIndices.length; i++) {
        if (i % 2 === 0) {
            newItalicIndices.push(allItalicIndices[i]);
        }
    }

    for (let j = 0; j < allItalics.length; j++) {
        if (j % 2 === 0) {
        let k = j + 1;
        italicTxt.push(markdownInputTxt.slice(allItalicIndices[j]+1, allItalicIndices[k]));
        } else {
            continue;
        }
    }




    const blockquoteText = [];
    for (const bq of bqText) {
        blockquoteText.push(bq[1]);
    }


    const anchorText = [];
    const anchorHref = [];
    for (const link of linkText) {
        anchorText.push(link[1]);
        anchorHref.push(link[2]);
        
    }

        for (let i = 0; i < blockquoteText.length; i++ ) {
        markdownOld = "";
        htmlAdd = "";
        markdownOld = "> " + blockquoteText[i];
        htmlAdd = "<blockquote>" + blockquoteText[i] + "</blockquote>";
        htmlOutText = htmlOutText.replace(markdownOld, htmlAdd);

    }

    for (let i = 0; i < anchorText.length; i++ ) {
        htmlOutText += `<a href="${anchorHref[i]}">` + anchorText[i] + "</a>\n";
    }

    const imgAlt = [];
    const imgSrc = [];
    
        for (let i = 0; i < italicTxt.length; i++ ) {
        markdownOld = "";
        htmlAdd = "";
        markdownOld = markdownInputTxt.slice(newItalicIndices[i], newItalicIndices[i] + italicTxt[i].length + 2);    
        htmlAdd = "<em>" + italicTxt[i] + "</em>";
        htmlOutText = htmlOutText.replace(markdownOld, htmlAdd);
        
    }


    for (const img of imgText) {
        imgAlt.push(img[1]);
        imgSrc.push(img[2]);
    }
        let bold = asterisks.filter((asterisk) => !listIndices.includes(asterisk.index) && asterisk[0] === "**" || asterisk[0] === "***");
    const boldIndices = bold.map((b) => b.index);
    const boldUnderIndices = boldUnder.map((b) => b.index);
    const allBoldIndices = [...boldIndices, ...boldUnderIndices];
    const allBold = [...bold, ...boldUnder];
    const boldTxt = [];
    const newBoldIndices = [];

     for (let i = 0; i < allBoldIndices.length; i++) {
        if (i % 2 === 0) {
            newBoldIndices.push(allBoldIndices[i]);
        }
    }
    

    for (let j = 0; j < allBold.length; j++) {
        if (j % 2 === 0) {
        let k = j + 1;
        boldTxt.push(markdownInputTxt.slice(allBoldIndices[j]+2, allBoldIndices[k]));
        } else {
            continue;
        }
    }

    for (let i = 0; i < imgText.length; i++ ) {
        htmlOutText += `<img alt="${imgAlt[i]}" src="${imgSrc[i]}">\n`;
    }

        for (let i = 0; i < boldTxt.length; i++ ) {
        console.log(boldTxt[i]);
        markdownOld = "";
        htmlAdd = "";
        htmlAdd = "<strong>" + boldTxt[i] + "</strong>";
        markdownOld = markdownInputTxt.slice(newBoldIndices[i], newBoldIndices[i] + boldTxt[i].length + 4);    
        htmlOutText = htmlOutText.replace(markdownOld, htmlAdd);

    }
            if (htmlOutText.match(/(?<!\/)\*+/g) !== null ) {
            const asterisks2 = [...markdownInputTxt.matchAll(/(?<!\/)\*+/g)];
            console.log(asterisks2);
            htmlOutText = htmlOutText.replace(/(?<!\/)\*+/, "<strong>");
            htmlOutText = htmlOutText.replace(/(?<!\/)\*+/, "</strong>");
        }
    console.log(htmlOutText);
    return htmlOutText;
    
}

