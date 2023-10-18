const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const { restGet } = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;

const EXPORT_SUBDIR = "internal-roles";
const EXPORT_FILENAME = "internal-roles.json";

async function exportConfig(exportDir, tenantUrl, name, token) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/internal/role`;

    const response = await restGet(
      idmEndpoint,
      {
        _queryFilter: "true",
      },
      token
    );

    const roles = response.data.result;
    var customerRoles = [];

    // We don't want to pull system roles - assuming that system roles have no privileges

    const targetDir = `${exportDir}/${EXPORT_SUBDIR}`;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    roles.forEach((role) => {
      if (name && name !== role.name) {
        return;
      }
      if (role.privileges && role.privileges.length > 0) {
        const fileName = `${targetDir}/${role.name}.json`;
        saveJsonToFile(role, fileName);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports.exportConfig = exportConfig;
