const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const {
  saveJsonToFile,
  esvToEnv,
  escapePlaceholders,
} = require("../../../fr-config-common/src/utils.js");

const EXPORT_SUBDIR = "esvs/variables";

async function exportConfig(exportDir, tenantUrl, name, token) {
  try {
    const envEndpoint = `${tenantUrl}/environment/variables`;

    const response = await restGet(
      envEndpoint,
      null,
      token,
      "protocol=1.0,resource=1.0"
    );

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const variables = response.data.result;

    variables.forEach((variable) => {
      if (name && name !== variable._id) {
        return;
      }
      const variableObject = {
        _id: variable._id,
        expressionType: variable.expressionType,
        description: escapePlaceholders(variable.description),
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
