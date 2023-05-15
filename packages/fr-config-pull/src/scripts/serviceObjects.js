const utils = require("./utils.js");
const fs = require("fs");
const axios = require("axios");
const { saveJsonToFile } = utils;
const { logPullError } = utils;
const constants = require("../../../fr-config-common/src/constants.js");
const { AuthzTypes } = constants;
const EXPORT_SUBDIR = "service-objects";

async function exportConfig(exportDir, objectsConfigFile, tenantUrl, token) {
  try {
    var systemObjects = JSON.parse(fs.readFileSync(objectsConfigFile, "utf8"));
    for (const objectType of Object.keys(systemObjects)) {
      for (const systemObject of systemObjects[objectType]) {
        const idmEndpoint = `${tenantUrl}/openidm/managed/${objectType}`;

        const response = await axios({
          method: "get",
          url: idmEndpoint,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            _queryFilter: `${systemObject.searchField} eq "${systemObject.searchValue}"`,
            _fields: systemObject.fields.join(","),
          },
        });

        if (response.data.resultCount != 1) {
          console.error(
            "Unexpected result from search",
            response.data.resultCount,
            "entries found for",
            systemObject.searchValue
          );
          process.exit(1);
        }
        let attributes = response.data.result[0];

        attributes = { ...attributes, ...systemObject.overrides };
        const targetDir = `${exportDir}/${EXPORT_SUBDIR}/${objectType}`;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const fileName = `${targetDir}/${systemObject.searchValue}.json`;
        saveJsonToFile(attributes, fileName);
      }
    }
  } catch (err) {
    logPullError(err);
  }
}

module.exports.exportConfig = exportConfig;
