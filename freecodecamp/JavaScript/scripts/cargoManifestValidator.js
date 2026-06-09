function normalizeUnits(manifest) {

  let newObj = {
    containerId: manifest.containerId,
    destination: manifest.destination,
    weight: manifest.weight,
    unit: manifest.unit,
    hazmat: manifest.hazmat
  }

  if (manifest.unit === "lb") {
    newObj.weight = manifest.weight * 0.45;
    newObj.unit = "kg";
  } else {
    newObj.weight = manifest.weight;
    newObj.unit = manifest.unit
  }

  return newObj;
}

function validateManifest(manifest) {
  let newObj = {
  }

  let containerId = manifest.containerId;
  let destination = manifest.destination;
  let weight = manifest.weight;
  let unit = manifest.unit;
  let hazmat = manifest.hazmat;

  if (Object.hasOwn(manifest, "containerId")) {
    if (typeof(containerId) !== "number" || containerId <= 0 || Number.isInteger(containerId) === false) {
      newObj.containerId = "Invalid";
  }
} else {
    newObj.containerId = "Missing";
}

  if (Object.hasOwn(manifest, "destination")) {
    if (typeof(destination) !== "string" || destination.trim().length < 1) {
      newObj.destination = "Invalid";
  }
} else {
    newObj.destination = "Missing";
}

  if (Object.hasOwn(manifest, "weight")) {
    if (typeof(weight) !== "number" || weight <= 0 || Number.isNaN(weight) !== false) {
      newObj.weight = "Invalid";
  }
} else {
    newObj.weight = "Missing";
}

  if (Object.hasOwn(manifest, "unit")) {
    if (unit !== "lb" && unit !== "kg") {
      newObj.unit = "Invalid";
  }
} else {
    newObj.unit = "Missing";
}

  if (Object.hasOwn(manifest, "hazmat")) {
    if (typeof(hazmat) !== "boolean") {
      newObj.hazmat = "Invalid";
  }
} else {
    newObj.hazmat = "Missing";
}


  return newObj;
}

function processManifest(manifest) {

  let objWeight = normalizeUnits(manifest);
  let validation = validateManifest(manifest);

  if (Object.keys(manifest).length < 5) {
    console.log(`Validation error: ${manifest.containerId}`);
    console.log(validation);
  } else {
    console.log(`Validation success: ${manifest.containerId}`);
    console.log(`Total weight: ${objWeight.weight} kg`);
  }
}

console.log(validateManifest({ containerId: 55, destination: "Carmel", weight: 400, unit: "lb", hazmat: false }))