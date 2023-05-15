const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "password-policy";

async function exportPasswordConfig(exportDir, realms, tenantUrl, token) {
  try {
    for (const realm of realms) {
      const objectName = `${realm}_user`;
      const idmEndpoint = `${tenantUrl}/openidm/config/fieldPolicy/${objectName}`;

      const response = await axios({
        method: "get",
        url: idmEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const config = response.data;

      const targetDir = `${exportDir}/${realm}/${EXPORT_SUBDIR}`;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const fileName = `${targetDir}/${objectName}-password-policy.json`;
      saveJsonToFile(config, fileName);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportPasswordConfig = exportPasswordConfig;
