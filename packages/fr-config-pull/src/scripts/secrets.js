const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile, esvToEnv } = utils;

const EXPORT_SUBDIR = "esvs/secrets";

async function exportConfig(exportDir, tenantUrl, name, token) {
  try {
    const envEndpoint = `${tenantUrl}/environment/secrets`;

    const response = await axios({
      method: "get",
      url: envEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-API-Version": "protocol=1.0,resource=1.0",
      },
    });

    const secrets = response.data.result;

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (const secret of secrets) {
      if (name && name !== secret._id) {
        return;
      }
      const versionsEndpoint = `${tenantUrl}/environment/secrets/${secret._id}/versions`;

      const versionsResponse = await axios({
        method: "get",
        url: versionsEndpoint,
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-API-Version": "protocol=1.0,resource=1.0",
        },
      });

      const versions = versionsResponse.data.filter(function (version) {
        return version.status !== "DESTROYED";
      });

      let versionInfo = [];

      for (let i = 0; i < versions.length; i++) {
        const version = (i + 1).toString();
        versionInfo.push({
          version: version,
          status: version.status,
          valueBase64: "${" + esvToEnv(`${secret._id}_${version}`) + "}",
        });
      }

      const secretObject = {
        _id: secret._id,
        encoding: secret.encoding,
        useInPlaceholders: secret.useInPlaceholders,
        description: secret.description,
        versions: versionInfo,
      };
      const fileName = `${targetDir}/${secret._id}.json`;
      saveJsonToFile(secretObject, fileName);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
