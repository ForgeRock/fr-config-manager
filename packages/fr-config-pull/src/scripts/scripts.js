const utils = require("../../../fr-config-common/src/utils.js");
const constants = require("../../../fr-config-common/src/constants.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const { AuthzTypes } = constants;
const { safeFileName } = utils;

const SCRIPT_SUB_DIR = "scripts";
const SCRIPT_CONFIG_FILE = "scripts-config.json";
const SCRIPTS_CONTENT_DIR = "scripts-content";
const SCRIPTS_CONFIG_DIR = "scripts-config";

function saveScriptToFile(script, exportDir) {
  const scriptContentRelativePath = `${SCRIPTS_CONTENT_DIR}/${script.context}`;
  const scriptContentPath = `${exportDir}/${scriptContentRelativePath}`;
  if (!fs.existsSync(scriptContentPath)) {
    fs.mkdirSync(scriptContentPath, { recursive: true });
  }

  const scriptConfigPath = `${exportDir}/${SCRIPTS_CONFIG_DIR}`;
  if (!fs.existsSync(scriptConfigPath)) {
    fs.mkdirSync(scriptConfigPath, { recursive: true });
  }

  const scriptFilename = `${safeFileName(script.name)}.js`;
  const buff = Buffer.from(script.script, "base64");
  const source = buff.toString("utf-8");
  fs.writeFileSync(`${scriptContentPath}/${scriptFilename}`, source);
  script.script = {
    file: `${scriptContentRelativePath}/${scriptFilename}`,
  };

  const scriptFileName = `${scriptConfigPath}/${script._id}.json`;
  saveJsonToFile(script, scriptFileName);
}

function processScripts(scripts, exportDir, name) {
  const scriptConfig = { scripts: [] };

  try {
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let scriptNotFound = true;

    scripts.forEach((script) => {
      if (script.language !== "JAVASCRIPT") {
        return;
      }

      if (name && name !== script.name) {
        return;
      }

      scriptNotFound = false;

      saveScriptToFile(script, exportDir);
    });

    if (name && scriptNotFound) {
      console.warn("Script not found (check SCRIPT_PREFIXES)");
    }
  } catch (err) {
    console.error(err);
  }
}

async function exportScriptById(exportDir, tenantUrl, realm, id, token) {
  const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts/${id}`;

  const response = await restGet(amEndpoint, null, token);

  const script = response.data;

  const fileDir = `${exportDir}/${realm}/${SCRIPT_SUB_DIR}`;

  saveScriptToFile(script, fileDir);
}

async function exportScripts(
  exportDir,
  tenantUrl,
  realms,
  prefixes,
  name,
  token
) {
  var scriptPrefixes = null;
  try {
    scriptPrefixes = JSON.parse(prefixes);
  } catch (err) {
    console.error("Error: script prefixes must be valid JSON array");
    process.exit(1);
  }

  let queryFilter = "true";

  for (let i = 0; i < scriptPrefixes.length; i++) {
    if (i === 0) {
      queryFilter = `name+sw+"${scriptPrefixes[0]}"`;
    } else {
      queryFilter += `+or+name+sw+"${scriptPrefixes[i]}"`;
    }
  }

  for (const realm of realms) {
    try {
      const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts?_queryFilter=${queryFilter}`;

      const response = await restGet(amEndpoint, null, token);

      const scripts = response.data.result;

      const fileDir = `${exportDir}/${realm}/${SCRIPT_SUB_DIR}`;
      processScripts(scripts, fileDir, name);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

module.exports.exportScripts = exportScripts;
module.exports.exportScriptById = exportScriptById;
