function convertHTML (initialStr) {
    let fullStr = initialStr.replaceAll("&","&amp;")
                            .replaceAll("<",'&lt;')
                            .replaceAll(">","&gt;")
                            .replaceAll('"',"&quot;")
                            .replaceAll("'","&apos;");
    return fullStr;
    }

    console.log(convertHTML("Dolce & Gabbana"));
    console.log(convertHTML("Hamburgers < Pizza < Tacos"));
    console.log(convertHTML("Sixty > twelve"));
    console.log(convertHTML('Stuff in "quotation marks"'));
    console.log(convertHTML("Schindler's List"));
    console.log(convertHTML("<>"));
    console.log(convertHTML("abc"));