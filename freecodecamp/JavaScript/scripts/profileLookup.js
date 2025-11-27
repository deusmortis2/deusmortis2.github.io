let contacts = [
  {
    firstName: "Akira",
    lastName: "Laine",
    number: "0543236543",
    likes: ["Pizza", "Coding", "Brownie Points"],
  },
  {
    firstName: "Harry",
    lastName: "Potter",
    number: "0994372684",
    likes: ["Hogwarts", "Magic", "Hagrid"],
  },
  {
    firstName: "Sherlock",
    lastName: "Holmes",
    number: "0487345643",
    likes: ["Intriguing Cases", "Violin"],
  },
  {
    firstName: "Kristian",
    lastName: "Vos",
    number: "unknown",
    likes: ["JavaScript", "Gaming", "Foxes"],
  },
];

function lookUpProfile(name, prop) {
  console.log(name, prop);
  let found = false;
  for (let j = 0; j < contacts.length; j++) {
    // checking for contact existence
    if (contacts[j]["firstName"] === name) {
      found = true;
    }
  }
  if (found === true) {
    for (let i = 0; i < contacts.length; i++) {
      // search contacts for given name, return the property desired
      if (contacts[i]["firstName"] === name) {
        console.log(contacts[i]);
        console.log(Object.hasOwn(contacts[i], prop));
        if (Object.hasOwn(contacts[i], prop)) {
          return contacts[i][prop];
        } else {
          return "No such property";
        }
      }
    }
  }
  return "No such contact";
}

console.log(lookUpProfile("Kristian", "lastName"));
console.log(lookUpProfile("Sherlock", "likes"));
console.log(lookUpProfile("Harry", "likes"));
console.log(lookUpProfile("Bob", "number"));
console.log(lookUpProfile("Bob", "potato"));
console.log(lookUpProfile("Akira", "address"));
