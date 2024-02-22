const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;

async function exportConfig(
  name,
  exportDir,
  exportSubDir,
  tenantUrl,
  token,
  ignoreNotFound = false
) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/${name}`;

    var response;

    try {
      response = await restGet(idmEndpoint, null, token, null, ignoreNotFound);
    } catch (e) {
      console.error(`Bad response for ${name} status ${e.response.status}`);
      return;
    }

    if (!response) {
      console.error(`Warning: no config for ${name}`);
      return;
    }

    const config = response.data;

    const targetDir = `${exportDir}/${exportSubDir}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const fileName = `${targetDir}/${name}.json`;
    saveJsonToFile(config, fileName);
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
