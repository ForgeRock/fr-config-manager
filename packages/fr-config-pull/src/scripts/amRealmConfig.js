const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;
const EXPORT_SUBDIR = "realm-config";

async function exportConfig(exportDir, realms, configName, tenantUrl, token) {
  try {
    for (const realm of realms) {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/${configName}`;

      const response = await axios({
        method: "get",
        url: amEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const config = response.data;

      const targetDir = `${exportDir}/${realm}/${EXPORT_SUBDIR}`;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const fileName = `${targetDir}/${configName}.json`;
      saveJsonToFile(config, fileName);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
