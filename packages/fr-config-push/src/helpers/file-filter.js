const fileFilter = (filename, filter) => {
  // console.log('FILTER DEBUG - Filename = ' + filename + ', filter = ' + filter);

  if (!filename || filename === "" || typeof filter === "undefined") {
    return true;
  }

  if (typeof filter === "boolean" || filter.trim() === "") {
    return false;
  }

  const filterParts = filter.split(",");
  for (let part of filterParts) {
    part = part.trim();
    let fuzzy = false;
    if (part.startsWith("~")) {
      fuzzy = true;
      part = part.substring(1);
    }

    // console.log('FILTER DEBUG - ' + fuzzy + ', ' + filename + ', ' + part)

    if (fuzzy && filename.indexOf(part) > -1) {
      return true;
    }

    if (!fuzzy && filename === part) {
      return true;
    }
  }

  return false;
};

module.exports = fileFilter;
