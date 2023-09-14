const utils = require("../helpers/utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "secret-mappings";

async function exportConfig(exportDir, realms, tenantUrl, name, token) {
  try {
    for (const realm of realms) {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/secrets/stores/GoogleSecretManagerSecretStoreProvider/ESV/mappings`;

      const response = await axios({
        method: "get",
        url: amEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          _queryFilter: "true",
        },
      });

      const mappings = response.data.result;

      const targetDir = `${exportDir}/${realm}/${EXPORT_SUBDIR}`;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      mappings.forEach((mapping) => {
        if (name && name !== mapping._id) {
          return;
        }
        const fileName = `${targetDir}/${mapping._id}.json`;
        saveJsonToFile(mapping, fileName);
      });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
