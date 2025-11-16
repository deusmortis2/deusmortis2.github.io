const lunches = [];

function addLunchToEnd (lunches, lunchStr) {
  lunches.push(lunchStr);
  console.log(`${lunchStr} added to the end of the lunch menu.`);
  return lunches;
}

function addLunchToStart (lunches, lunchStr) {
  lunches.unshift(lunchStr);
  console.log(`${lunchStr} added to the start of the lunch menu.`);
  return lunches;
}

function removeLastLunch (lunches) {
  const lastLunch = lunches.pop();
  if (lunches.length === 0) {
    console.log("No lunches to remove.");
    return lunches;
  }else {
    console.log(`${lastLunch} removed from the end of the lunch menu.`);
    return lunches;
  }
}

function removeFirstLunch (lunches) {
  const firstLunch = lunches.shift();
  if (lunches.length === 0) {
    console.log("No lunches to remove.");
    return lunches;
  }else {
    console.log(`${firstLunch} removed from the start of the lunch menu.`);
    return lunches;
  }
}

function getRandomLunch (lunches) {
  const randomLunch = lunches[Math.round(Math.random() * lunches.length)];
  if (lunches.length === 0) {
    console.log("No lunches available.");
    return lunches;
  } else {
  console.log("Randomly selected lunch: " + randomLunch);
  return lunches;
  }
}

function showLunchMenu (lunches) {
  const lunchList = lunches.join(", ");
  if (lunches.length === 0) {
  console.log("The menu is empty.");
  return lunches;
  }else {
  console.log(`Menu items: ` + lunchList);
  return lunches;
  }
}

addLunchToEnd(lunches, "Tacos");
const lunchEnd = ["Pizza", "Tacos"];
console.log(addLunchToEnd(lunchEnd, "Burger"));
addLunchToStart(lunches, "Sushi");
const lunchStart = ["Burger", "Sushi"];
console.log(addLunchToStart(lunchStart, "Pizza"));
console.log(getRandomLunch(lunches));
const lunchMenu1 = ["Greens", "Corns", "Beans"];
console.log(showLunchMenu(lunchMenu1));
const lunchMenu2 = ["Pizza", "Burger", "Fries", "Salad"];
console.log(showLunchMenu(lunchMenu2));
