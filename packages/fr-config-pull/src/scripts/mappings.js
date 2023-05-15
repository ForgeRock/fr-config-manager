const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "sync/mappings";

// Split managed.json into separate objects, each with separate scripts

function processMappings(mappings, targetDir) {
  try {
    mappings.forEach((mapping) => {
      const mappingPath = `${targetDir}/${mapping.name}`;

      if (!fs.existsSync(mappingPath)) {
        fs.mkdirSync(mappingPath, { recursive: true });
      }

      Object.entries(mapping).forEach(([key, value]) => {
        if (
          value &&
          value.type &&
          value.type === "text/javascript" &&
          value.source
        ) {
          const scriptFilename = `${mapping.name}.${key}.js`;
          value.file = scriptFilename;
          fs.writeFileSync(`${mappingPath}/${scriptFilename}`, value.source);
          delete value.source;
        }
      });

      const fileName = `${mappingPath}/${mapping.name}.json`;
      saveJsonToFile(mapping, fileName);
    });
  } catch (err) {
    console.error(err);
  }
}

async function exportMappings(exportDir, tenantUrl, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/sync`;

    let response = null;

    try {
      response = await axios({
        method: "get",
        url: idmEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      if (e.response.status === 404) {
        console.error(`Warning: no sync mapping config`);
        return;
      }
      console.error(`Bad response ${e.response.status}`);
      process.exit(1);
    }

    const mappings = response.data.mappings;

    const fileDir = `${exportDir}/${EXPORT_SUBDIR}`;
    processMappings(mappings, fileDir);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportMappings = exportMappings;
