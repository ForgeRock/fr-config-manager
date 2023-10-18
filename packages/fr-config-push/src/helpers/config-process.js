function replaceEnvSpecificValues(content, base64Encode = false) {
  let newContent = content;

  const placeholders = content.match(/\\*?\${.*?}/g);

  if (!placeholders) {
    return newContent;
  }

  for (const placeholder of placeholders) {
    if (placeholder.startsWith("\\\\")) {
      continue;
    }
    const placeholderName = placeholder.replace(/\${(.*)}/, "$1");

    let value = process.env[placeholderName];
    if (!value) {
      console.error("ERROR: no environment variable for", placeholderName);
      process.exit(1);
    }

    if (base64Encode) {
      value = Buffer.from(value).toString("base64");
    }

    newContent = newContent.replaceAll(placeholder, value);
  }

  return unescapePlaceholders(newContent);
}

function unescapePlaceholders(content) {
  return content.replace(/\\\\\${/g, "${");
}

function removeProperty(obj, propertyName) {
  for (prop in obj) {
    if (prop === propertyName) {
      delete obj[prop];
    } else if (typeof obj[prop] === "object") {
      removeProperty(obj[prop], propertyName);
    }
  }
}

module.exports.replaceEnvSpecificValues = replaceEnvSpecificValues;
module.exports.removeProperty = removeProperty;
