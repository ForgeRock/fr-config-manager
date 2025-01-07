const fs = require("fs");
const sanitize = require("sanitize-filename");
const { STDOUT_OPTION, STDOUT_OPTION_SHORT } = require("./constants.js");

function safeFileName(filename) {
  return sanitize(filename, {
    replacement: (character) => encodeURIComponent(character),
  });
}

function safeFileNameUnderscore(filename) {
  return sanitize(filename, {
    replacement: "_",
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

  const jsonData = JSON.stringify(data, null, 2);
  if (
    process.argv.includes(`--${STDOUT_OPTION}`) ||
    process.argv.includes(`-${STDOUT_OPTION_SHORT}`)
  ) {
    console.log(jsonData);
    return;
  }

  fs.writeFile(filename, jsonData, (err) => {
    if (err) {
      console.error(`ERROR - can't save ${filename}`);
    }
    return;
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

function journeyNodeNeedsScript(node) {
  return (
    node.hasOwnProperty("script") &&
    (!node.hasOwnProperty("useScript") || node.useScript)
  );
}
function replaceAllInJson(content, replacements) {
  let contentString = JSON.stringify(content);

  replacements.forEach(({ search, replacement }) => {
    contentString = contentString.split(search).join(replacement);
  });
  return JSON.parse(contentString);
}

module.exports.saveJsonToFile = saveJsonToFile;
module.exports.safeFileName = safeFileName;
module.exports.esvToEnv = esvToEnv;
module.exports.deepMerge = deepMerge;
module.exports.escapePlaceholders = escapePlaceholders;
module.exports.unescapePlaceholders = unescapePlaceholders;
module.exports.journeyNodeNeedsScript = journeyNodeNeedsScript;
module.exports.replaceAllInJson = replaceAllInJson;
module.exports.safeFileNameUnderscore = safeFileNameUnderscore;
