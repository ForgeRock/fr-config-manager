const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;

async function exportConfig(path, exportDir, name, tenantUrl, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/${path}`;

    const response = await axios({
      method: "get",
      url: idmEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        _queryFilter: "true",
      },
    });

    const config = response.data.result;

    const targetDir = `${exportDir}/${name}`;
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
