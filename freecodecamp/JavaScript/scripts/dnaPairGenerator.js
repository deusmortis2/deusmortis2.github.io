function pairElement (dnaStart) {
    const dnaArray = [];
    for (const char of dnaStart) {
    if (char.toUpperCase() === 'A') {
        dnaArray.push(Array.of('A', 'T'));
    } else if (char.toUpperCase() === 'T') {
        dnaArray.push(Array.of('T', 'A'));
    } else if (char.toUpperCase() === 'C') {
        dnaArray.push(Array.of('C', 'G'));
    } else if (char.toUpperCase() === 'G') {
        dnaArray.push(Array.of('G', 'C'));
    }
    }
    return dnaArray;
}


console.log(pairElement("ATCGA"));
console.log(pairElement("TTGAG"));
console.log(pairElement("CTCTA"));