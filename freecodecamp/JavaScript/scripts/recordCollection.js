const recordCollection = {
  2548: {
    albumTitle: "Slippery When Wet",
    artist: "Bon Jovi",
    tracks: ["Let It Rock", "You Give Love a Bad Name"],
  },
  2468: {
    albumTitle: "1999",
    artist: "Prince",
    tracks: ["1999", "Little Red Corvette"],
  },
  1245: {
    artist: "Robert Palmer",
    tracks: [],
  },
  5439: {
    albumTitle: "ABBA Gold",
  },
};

function updateRecords(records, id, prop, value) {
  if (prop !== "tracks" && value !== "") {
    // if prop isn't tracks and the value isn't an empty string, assign value to album prop
    records[id][prop] = value;
  } else if (
    prop === "tracks" &&
    records[id].hasOwnProperty("tracks") === false
  ) {
    // if prop is tracks and the value isn't empty, and it doesn't have a tracks property create empty array and add the value
    records[id][prop] = [value];
  } else if (prop === "tracks" && value !== "") {
    //if prop is tracks and the value isn't an empty string add value to the end of the tracks array
    records[id][prop].push(value);
  } else if (value === "") {
    // if the value is an empty string delete the given property
    delete records[id][prop];
  }
  return records;
}

console.log(updateRecords(recordCollection, 5439, "artist", "ABBA"));
console.log(
  updateRecords(recordCollection, 5439, "tracks", "Take a Chance on Me")
);
console.log(updateRecords(recordCollection, 2548, "artist", ""));
console.log(
  updateRecords(recordCollection, 1245, "tracks", "Addicted to Love")
);
console.log(updateRecords(recordCollection, 2468, "tracks", "Free"));
console.log(updateRecords(recordCollection, 2548, "tracks", ""));
console.log(updateRecords(recordCollection, 1245, "albumTitle", "Riptide"));
