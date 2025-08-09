const fs = require("fs");
const path = require("path");

function expandRequire(source, libDir) {
  // Match patterns like: var foo = require("moduleName").bar
  const requirePattern =
    /const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\)\.(\w+)\s*;/g;

  const expandedSource = source.replace(
    requirePattern,
    (match, varName, moduleName, exportName) => {
      // Read the module file
      const modulePath = path.join(libDir, moduleName + ".js");
      const moduleCode = fs.readFileSync(modulePath, "utf8");

      // Try to find a function definition
      const funcPattern = new RegExp(
        `function\\s+${exportName}\\s*\\(([^)]*)\\)\\s*{([\\s\\S]*?)}\\s*(?=module\\.exports|$)`,
        "m"
      );
      const funcMatch = moduleCode.match(funcPattern);

      if (funcMatch) {
        const args = funcMatch[1];
        const body = funcMatch[2].trim();
        return [
          `// --EXPAND-FROM`,
          `// ${match}`,
          `// --EXPAND-TO`,
          `const ${varName} = function(${args}) {`,
          `  ${body}`,
          `};`,
          `// --EXPAND-END`,
        ].join("\n");
      }

      // Try to find a const value
      const constPattern = new RegExp(
        `const\\s+${exportName}\\s*=\\s*([^;]+);`,
        "m"
      );
      const constMatch = moduleCode.match(constPattern);

      if (constMatch) {
        const value = constMatch[1].trim();
        return [
          `// --EXPAND-FROM`,
          `// ${match}`,
          `// --EXPAND-TO`,
          `const ${varName} = ${value};`,
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
