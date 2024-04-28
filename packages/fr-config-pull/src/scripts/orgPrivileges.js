const utils = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const {
  restGet,
  restPost,
} = require("../../../fr-config-common/src/restClient.js");
const { saveJsonToFile } = utils;
const {
  ORG_PRIVILEGES_CONFIG,
} = require("../../../fr-config-common/src/constants.js");

const EXPORT_SUBDIR = "org-privileges";

async function exportOrgPrivileges(exportDir, tenantUrl, name, token) {
  try {
    const filePath = `${exportDir}/${EXPORT_SUBDIR}`;

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    for (const configEntry of ORG_PRIVILEGES_CONFIG) {
      if (name && name !== configEntry) {
        continue;
      }
      const idmEndpoint = `${tenantUrl}/openidm/config/${configEntry}`;
      const idmResponse = await restGet(idmEndpoint, null, token);
      saveJsonToFile(idmResponse.data, `${filePath}/${configEntry}.json`);
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

module.exports.exportOrgPrivileges = exportOrgPrivileges;
