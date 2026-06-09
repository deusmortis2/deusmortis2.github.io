function parseShipment (rawData) {
  const ans = [];
  const skuSoFar = [];
  for (const data of rawData){
    const dataList = data.split("|");
    let [sku, name, qty, expires, zone] = dataList;
    if (!skuSoFar.includes(sku)) {
      ans.push({sku: sku, name: name, qty:Number(qty), expires: expires, zone: zone || "general"});
      skuSoFar.push(sku);
    }
  }
  return ans;
}

function planRestock (pantry, shipment) {
  let ans = [];
  let pantry_skus = [];
  for (const item of pantry){
    pantry_skus.push(item.sku);
  }
  for (const item of shipment) {
    if (item.qty <= 0) {
      ans.push({type: "discard", item: {sku: item.sku,
         zone: item.zone}});
    } else if (pantry_skus.includes(item.sku)) {
      ans.push(
        {type: "restock", 
        item: item
        });
    } else {
      ans.push({type: "donate", item: item});
    }
  }
  return ans;
}

function groupByZone (actions) {
  let ans = {};
  for (const action of actions) {
    const zone = action.item.zone;
    if (!(zone in ans)) {
      ans[zone] = [];
    }
    ans[zone].push(action)
  }
  return ans;
}

function clonePantry (pantry) {
  const newPantry = JSON.parse(JSON.stringify(pantry));
  return newPantry;
}

const pantry = [
  { sku: "A10", name: "Tomatoes", qty: 4, expires: "2027-01-01", zone: "fridge" },
  { sku: "D43", name: "Pineapples", qty: 2, expires: "2020-01-01", zone: "general" }
];

const rawData = [
  "A10|Tomatoes|5|2027-01-01", 
  "B21|Bananas|10|2027-01-01", 
  "C32|Eggs|3|2027-01-01|fridge", 
  "C32|Eggs|3|2027-01-01", 
  "D43|Pineapples|0|2027-01-01", 
  "E54|Peppers|-1|2027-01-01|fridge"
];

const shipment = parseShipment(rawData);
const pantryCopy = clonePantry(pantry);
const actions = planRestock(pantryCopy, shipment);
const grouped = groupByZone(actions);

console.log(grouped);