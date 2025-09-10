const fs = require("fs");
const path = require("path");

function expandLibraryReferences(source, libPath) {
  const lines = source.split("\n");
  const expandedLines = [];

  const referenceRegex = /^\s*\/\/\/\s*<reference\s+path="([^"]+)"\s*\/>\s*$/;

  for (const line of lines) {
    const match = line.match(referenceRegex);

    if (match) {
      const refPath = match[1];
      const fullRefPath = path.join(libPath, refPath);

      if (!fs.existsSync(fullRefPath)) {
        console.error(`Reference file ${fullRefPath} not found`);
        process.exit(1);
      }

      const refContent = fs.readFileSync(fullRefPath, "utf8");

      expandedLines.push(`/// @import-begin <reference path="${refPath}" />`);
      expandedLines.push(...refContent.split("\n"));
      expandedLines.push("/// @import-end");
    } else {
      expandedLines.push(line);
    }
  }

  return expandedLines.join("\n");
}

function revertLibraryReferences(source) {
  const lines = source.split("\n");

  const revertedLines = [];
  const importBeginRegex =
    /^\s*\/\/\/\s*@import-begin\s+<reference\s+path="([^"]+)"\s*\/>\s*$/;
  const importEndRegex = /^\s*\/\/\/\s*@import-end\s*$/;

  let skipping = false;
  let currentRefPath = null;

  for (const line of lines) {
    if (!skipping) {
      const match = line.match(importBeginRegex);
      if (match) {
        skipping = true;
        currentRefPath = match[1];
        revertedLines.push(`/// <reference path="${currentRefPath}" />`);
        continue;
      }
    } else if (importEndRegex.test(line)) {
      // End of the import block
      skipping = false;
      currentRefPath = null;
      continue;
    }

    if (!skipping) {
      revertedLines.push(line);
    }
  }

  return revertedLines.join("\n");
}

module.exports.expandLibraryReferences = expandLibraryReferences;
module.exports.revertLibraryReferences = revertLibraryReferences;
