const utils = require("./utils.js");
const constants = require("../../../fr-config-common/src/constants.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;
const { AuthzTypes } = constants;

const SCRIPT_SUB_DIR = "scripts";
const SCRIPT_CONFIG_FILE = "scripts-config.json";
const SCRIPTS_CONTENT_DIR = "scripts-content";

function processScripts(scripts, exportDir) {
  const scriptConfig = { scripts: [] };

  try {
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    scripts.forEach((script) => {
      if (script.language !== "JAVASCRIPT") {
        return;
      }

      const scriptContentRelativePath = `${SCRIPTS_CONTENT_DIR}/${script.context}`;
      const scriptContentPath = `${exportDir}/${scriptContentRelativePath}`;
      if (!fs.existsSync(scriptContentPath)) {
        fs.mkdirSync(scriptContentPath, { recursive: true });
      }

      const scriptFilename = `${script.name}.js`;
      const buff = Buffer.from(script.script, "base64");
      const source = buff.toString("utf-8");
      fs.writeFileSync(`${scriptContentPath}/${scriptFilename}`, source);
      script.script = {
        file: `${scriptContentRelativePath}/${scriptFilename}`,
      };

      const scriptFileName = `${exportDir}/${script.name}.json`;
      saveJsonToFile(script, scriptFileName);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportScripts(exportDir, tenantUrl, realms, prefixes, token) {
  var scriptPrefixes = null;
  try {
    scriptPrefixes = JSON.parse(prefixes);
  } catch (err) {
    console.error("Error: script prefixes must be valid JSON array");
    process.exit(1);
  }

  for (const realm of realms) {
    for (const prefix of scriptPrefixes) {
      try {
        const amEndpoint = `${tenantUrl}/am/json/${realm}/scripts?_queryFilter=name+sw+"${prefix}"`;

        const response = await axios({
          method: "get",
          url: amEndpoint,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const scripts = response.data.result;

        const fileDir = `${exportDir}/${realm}/${SCRIPT_SUB_DIR}`;
        processScripts(scripts, fileDir);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  }
}

module.exports.exportScripts = exportScripts;
