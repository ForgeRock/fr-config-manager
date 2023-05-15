const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile, esvToEnv } = utils;

const EXPORT_SUBDIR = "esvs/variables";

async function exportConfig(exportDir, tenantUrl, token) {
  try {
    const envEndpoint = `${tenantUrl}/environment/variables`;

    const response = await axios({
      method: "get",
      url: envEndpoint,
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-API-Version": "protocol=1.0,resource=1.0",
      },
    });

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const variables = response.data.result;

    variables.forEach((variable) => {
      const variableObject = {
        _id: variable._id,
        expressionType: variable.expressionType,
        description: variable.description,
        valueBase64: "${" + esvToEnv(variable._id) + "}",
      };
      const fileName = `${targetDir}/${variable._id}.json`;
      saveJsonToFile(variableObject, fileName);
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
