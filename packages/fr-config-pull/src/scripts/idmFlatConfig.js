const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

async function exportConfig(name, exportDir, exportSubDir, tenantUrl, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/${name}`;

    var response;

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
        console.error(`Warning: no config for ${name}`);
        return;
      }
      console.error(`Bad response for ${name} status ${e.response.status}`);
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
