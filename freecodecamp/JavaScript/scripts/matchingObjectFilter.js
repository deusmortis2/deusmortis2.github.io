function whatIsInAName (objectArr,srcObj) {
    const newArr = [];
    for (let k = 0; k < objectArr.length; ++k) {
       if(compareObj(objectArr[k], srcObj)) {
        newArr.push(objectArr[k]);
       }
    }
   return newArr;
}
function compareObj (obj, srcObj) {
    let matching = 0;
    const objectKeys2 = Object.keys(srcObj).sort();
    for (let i = 0; i < objectKeys2.length; ++i) {
        if (obj.hasOwnProperty(objectKeys2[i]) && obj[objectKeys2[i]] === srcObj[objectKeys2[i]]) {
            matching++;
             if (matching === objectKeys2.length) {
                    return true;
                }
        } 
        else if (objectKeys2.length > 1) {
            if (obj.hasOwnProperty(objectKeys2[i]) && obj[objectKeys2[i]] === srcObj[objectKeys2[i]]) {
                matching++;
                if (matching === objectKeys2.length) {
                    return true;
                }
            }
        }
    } return false;
}
console.log(whatIsInAName([{ first: "Romeo", last: "Montague" }, { first: "Mercutio", last: null }, { first: "Tybalt", last: "Capulet" }], { last: "Capulet" }));
console.log(whatIsInAName([{ "apple": 1 }, { "apple": 1 }, { "apple": 1, "bat": 2 }], { "apple": 1 }));
console.log(whatIsInAName([{ "apple": 1, "bat": 2 }, { "bat": 2 }, { "apple": 1, "bat": 2, "cookie": 2 }], { "apple": 1, "bat": 2 }));
console.log(whatIsInAName([{ "apple": 1, "bat": 2 }, { "apple": 1 }, { "apple": 1, "bat": 2, "cookie": 2 }], { "apple": 1, "cookie": 2 }));
console.log(whatIsInAName([{ "apple": 1, "bat": 2 }, { "apple": 1 }, { "apple": 1, "bat": 2, "cookie": 2 }, { "bat": 2 }], { "apple": 1, "bat": 2 }));
console.log(whatIsInAName([{"a": 1, "b": 2, "c": 3}], {"a": 1, "b": 9999, "c": 3}));
console.log(whatIsInAName([{"a": 1, "b": 2, "c": 3, "d": 9999}], {"a": 1, "b": 9999, "c": 3}));

