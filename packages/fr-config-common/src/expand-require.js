const fs = require("fs");
const path = require("path");

function extractBalancedFunction(code, funcName) {
  const funcDecl = `function ${funcName}`;
  const startIndex = code.indexOf(funcDecl);
  if (startIndex === -1) return null;

  const openBraceIndex = code.indexOf("{", startIndex);
  if (openBraceIndex === -1) return null;

  let braceCount = 1;
  let i = openBraceIndex + 1;

  while (i < code.length && braceCount > 0) {
    if (code[i] === "{") braceCount++;
    else if (code[i] === "}") braceCount--;
    i++;
  }

  const funcHeader = code.substring(startIndex, openBraceIndex).trim();
  const funcBody = code.substring(openBraceIndex + 1, i - 1); // exclude outer braces

  const argsMatch = funcHeader.match(/\(([^)]*)\)/);
  const args = argsMatch ? argsMatch[1] : "";

  return {
    args,
    body: funcBody.trim(),
  };
}

function expandRequire(source, libDir) {
  // Match patterns like: var foo = require("moduleName").bar
  const requirePattern =
    /var\s+(\w+)\s*=\s*require\(["']([^"']+)["']\)\.(\w+)\s*;/g;

  const expandedSource = source.replace(
    requirePattern,
    (match, varName, moduleName, exportName) => {
      // Read the module file
      const modulePath = path.join(libDir, moduleName + ".js");
      const moduleCode = fs.readFileSync(modulePath, "utf8");

      // Try to extract function with balanced braces
      const func = extractBalancedFunction(moduleCode, exportName);

      if (func) {
        return [
          `// --EXPAND-FROM`,
          `// ${match}`,
          `// --EXPAND-TO`,
          `var ${varName} = function(${func.args}) {`,
          func.body
            .split("\n")
            .map((line) => "  " + line)
            .join("\n"),
          `};`,
          `// --EXPAND-END`,
        ].join("\n");
      }

      // Try to find a const value
      const constPattern = new RegExp(
        `var\\s+${exportName}\\s*=\\s*([^;]+);`,
        "m"
      );
      const constMatch = moduleCode.match(constPattern);

      if (constMatch) {
        const value = constMatch[1].trim();
        return [
          `// --EXPAND-FROM`,
          `// ${match}`,
          `// --EXPAND-TO`,
          `var ${varName} = ${value};`,
          `// --EXPAND-END`,
        ].join("\n");
      }

      console.error(`Export ${exportName} not found in ${modulePath}`);
      return match; // leave original if nothing found
    }
  );

  return expandedSource;
}

function contractRequire(source) {
  const expandPattern =
    /\/\/ --EXPAND-FROM\s*\n\/\/ (.*?)\s*\n\/\/ --EXPAND-TO[\s\S]*?\/\/ --EXPAND-END/g;

  const contractedSource = source.replace(
    expandPattern,
    (match, originalLine) => {
      return originalLine;
    }
  );

  return contractedSource;
}

module.exports.expandRequire = expandRequire;
module.exports.contractRequire = contractRequire;
