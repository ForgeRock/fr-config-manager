const {
  saveJsonToFile,
  escapePlaceholders,
  replaceAllInJson,
} = require("../../../fr-config-common/src/utils.js");
const fs = require("fs");
const {
  restGet,
  logRestError,
} = require("../../../fr-config-common/src/restClient.js");
const constants = require("../../../fr-config-common/src/constants.js");
const EXPORT_SUBDIR = "realm-config/saml";
const _ = require("lodash");

async function exportConfig(exportDir, samlConfigFile, tenantUrl, token) {
  try {
    var samlEntities = JSON.parse(fs.readFileSync(samlConfigFile, "utf8"));
    for (const realm of Object.keys(samlEntities)) {
      let amSamlBaseUrl = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/saml2`;
      for (const samlEntity of samlEntities[realm]) {
        const entityId = samlEntity.entityId;
        const samlEndpoint = `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`;

        const response = await restGet(samlEndpoint, null, token);
        let samlQuery = response.data;
        if (samlQuery.resultCount !== 1) {
          console.error("SAML entity does not exist %s", entityId);
          break;
        }

        let samlId = samlQuery.result[0]._id;
        let samlLocation = samlQuery.result[0].location;

        let samlEntityEndpoint = `${amSamlBaseUrl}/${samlLocation}/${samlId}`;

        const entityRequest = await restGet(samlEntityEndpoint, null, token);
        let config = escapePlaceholders(entityRequest.data);
        let mergedConfig = _.merge(config, samlEntity.overrides);
        if (!!samlEntity.replacements) {
          console.log(
            "replacing with " + JSON.stringify(samlEntity.replacements)
          );
          mergedConfig = replaceAllInJson(
            mergedConfig,
            samlEntity.replacements
          );
        }
        const metadataUrl = `${tenantUrl}/am/saml2/jsp/exportmetadata.jsp?entityid=${entityId}&realm=${realm}`;
        const metadataRequest = await restGet(metadataUrl, null, token);

        let samlConfig = {};
        samlConfig.config = mergedConfig;
        samlConfig.metadata = metadataRequest.data;
        const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/${samlLocation}`;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const fileName = `${targetDir}/${entityId}.json`;
        saveJsonToFile(samlConfig, fileName);
      }
    }
  } catch (err) {
    logRestError(err);
  }
}

module.exports.exportConfig = exportConfig;
