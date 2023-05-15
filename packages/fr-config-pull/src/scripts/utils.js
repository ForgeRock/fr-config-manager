const fs = require("fs");
const slugify = require("slugify");

function getTypedFilename(name, type, suffix = "json") {
  const slug = slugify(name.replace(/^http(s?):\/\//, ""));
  return `${slug}.${type}.${suffix}`;
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

function logPullError(error) {
  console.error("Exception:", error.name);
  if (error.name === "AxiosError") {
    console.error("HTTP error", error.message);
    console.error("URL: ", error.response?.config?.url);
    console.error("Response:", error.response?.data);
  } else {
    console.error(error.message);
  }
}

module.exports.saveJsonToFile = saveJsonToFile;
module.exports.getTypedFilename = getTypedFilename;
module.exports.esvToEnv = esvToEnv;
module.exports.logPullError = logPullError;
