const fs = require("fs");
const sanitize = require("sanitize-filename");

function safeFileName(filename) {
  return sanitize(filename, {
    replacement: (character) => encodeURIComponent(character),
  });
}

function deepSort(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSort);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};

  sortedKeys.forEach((key) => {
    sortedObj[key] = deepSort(obj[key]);
  });

  return sortedObj;
}

function deepMerge(targetObj, sourceObj) {
  // Check if either of the objects is null or undefined
  if (sourceObj == null || targetObj == null) {
    return targetObj;
  }
  // Check if both objects are arrays
  if (Array.isArray(sourceObj) && Array.isArray(targetObj)) {
    return targetObj.concat(sourceObj);
  }
  // Check if both objects are objects
  if (typeof sourceObj === "object" && typeof targetObj === "object") {
    // Iterate over all properties in the source object
    for (const key in sourceObj) {
      if (sourceObj.hasOwnProperty(key)) {
        // If the target object also has a property with this key, merge them
        if (targetObj.hasOwnProperty(key)) {
          targetObj[key] = deepMerge(targetObj[key], sourceObj[key]);
        } else {
          // Otherwise, add the property from the source object to the target object
          targetObj[key] = sourceObj[key];
        }
      }
    }
  }
  return targetObj;
}

function saveJsonToFile(data, filename, sort = true) {
  if (sort) {
    data = deepSort(data);
  }
  fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(`ERROR - can't save ${filename}`);
    }
    return "";
  });
}

function saveToFile(type, data, identifier, filename) {
  const exportData = {};
  exportData["meta"] = getMetadata();
  exportData[type] = {};

  if (Array.isArray(data)) {
    data.forEach((element) => {
      exportData[type][element[identifier]] = element;
    });
  } else {
    exportData[type][data[identifier]] = data;
  }
  fs.writeFile(filename, JSON.stringify(exportData, null, 2), (err) => {
    if (err) {
      return printMessage(`ERROR - can't save ${type} to file`, "error");
    }
    return "";
  });
}

function esvToEnv(esv) {
  return esv.toUpperCase().replace(/-/g, "_");
}

function escapePlaceholders(content) {
  return JSON.parse(JSON.stringify(content).replace(/\$\{/g, "\\\\${"));
}

function unescapePlaceholders(content) {
  return content.replace(/\\\\\${/g, "${");
}

module.exports.saveJsonToFile = saveJsonToFile;
module.exports.safeFileName = safeFileName;
module.exports.esvToEnv = esvToEnv;
module.exports.deepMerge = deepMerge;
module.exports.escapePlaceholders = escapePlaceholders;
module.exports.unescapePlaceholders = unescapePlaceholders;
