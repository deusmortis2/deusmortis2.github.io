const inventory = [
];
let hasMatch = false;

function findProductIndex (product) {
let productIndex = inventory.findIndex(inventory => inventory.name === product.toLowerCase());
return productIndex;
}

function addProduct (product) {
    // console.log(inventory[0].hasOwnProperty("product.name"));
    hasMatch = false;
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].name === product.name.toLowerCase()) {
            hasMatch = true;
            inventory[i].quantity+=product.quantity;
            console.log(`${product.name.toLowerCase()} quantity updated`)
        }
    }
    if (hasMatch === false) {
        product.name = product.name.toLowerCase();
        inventory.push(product);
        console.log(`${product.name.toLowerCase()} added to inventory`);
    }
}

function removeProduct (productName, productQuantity) {
    hasMatch = false;
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].name === productName.toLowerCase()) {
        hasMatch = true;
            if (inventory[i].quantity > productQuantity) {
                inventory[i].quantity-= productQuantity;
                console.log(`Remaining ${productName.toLowerCase()} pieces: ${inventory[i].quantity}`)
            } else if (inventory[i].quantity === productQuantity) {
                console.log(`${inventory[i].name} has been removed.`)
                inventory.splice(inventory[i],1);
            } else {
                console.log(`Not enough ${productName.toLowerCase()} available, remaining pieces: ${inventory[i].quantity}`);
            }
        }
    }
    if (hasMatch === false) {
        console.log(`${productName.toLowerCase()} not found`)
    }
}

//test data
removeProduct("FLOUR", 5)
console.log(findProductIndex("Flour"));
addProduct({name: "FLOUR", quantity: 5});
console.log(findProductIndex("flour"));
console.log(findProductIndex("FloUr"));
addProduct({name: "FLOUR", quantity: 5});
addProduct({name: "FLOUR", quantity: 5});
removeProduct("FLOUR", 5);
removeProduct("FLOUR", 10);
addProduct({name: "FLOUR", quantity: 5});
addProduct({name: "FLOUR", quantity: 5});
addProduct({name: "RICE", quantity: 5});
console.log(inventory);
removeProduct("FLOUR", 5);