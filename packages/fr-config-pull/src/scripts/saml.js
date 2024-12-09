const fs = require("fs");
const {
  saveJsonToFile,
  escapePlaceholders,
  replaceAllInJson,
} = require("../../../fr-config-common/src/utils.js");
const {
  restGet,
  logRestError,
} = require("../../../fr-config-common/src/restClient.js");
const constants = require("../../../fr-config-common/src/constants.js");
const EXPORT_SUBDIR = "realm-config/saml";
const _ = require("lodash");

const getAmSamlBaseUrl = (tenantUrl, realm) =>
  `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/saml2`;

const getSamlEndpoint = (amSamlBaseUrl, entityId) =>
  `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`;

const getMetadataUrl = (tenantUrl, entityId, realm) =>
  `${tenantUrl}/am/saml2/jsp/exportmetadata.jsp?entityid=${entityId}&realm=${realm}`;

async function fetchSamlEntity(samlEndpoint, token, restGetFn = restGet) {
  const response = await restGetFn(samlEndpoint, null, token);
  return response.data;
}

async function fetchSamlEntityDetails(
  samlEntityEndpoint,
  token,
  restGetFn = restGet
) {
  const response = await restGetFn(samlEntityEndpoint, null, token);
  return response.data;
}

async function fetchMetadata(metadataUrl, token, restGetFn = restGet) {
  const response = await restGetFn(metadataUrl, null, token);
  return response.data;
}

function mergeConfig(config, overrides, replacements) {
  let mergedConfig = _.merge(config, overrides);
  if (replacements) {
    console.log("replacing with " + JSON.stringify(replacements));
    mergedConfig = replaceAllInJson(mergedConfig, replacements);
  }
  return mergedConfig;
}

function createTargetDir(targetDir, fsModule = fs) {
  if (!fsModule.existsSync(targetDir)) {
    fsModule.mkdirSync(targetDir, { recursive: true });
  }
}

async function exportConfig(
  exportDir,
  samlConfigFile,
  tenantUrl,
  token,
  fsModule = fs,
  restGetFn = restGet,
  saveJsonToFileFn = saveJsonToFile
) {
  try {
    const samlEntities = JSON.parse(
      fsModule.readFileSync(samlConfigFile, "utf8")
    );
    for (const realm of Object.keys(samlEntities)) {
      const amSamlBaseUrl = getAmSamlBaseUrl(tenantUrl, realm);
      for (const samlEntity of samlEntities[realm]) {
        const entityId = samlEntity.entityId;
        const samlEndpoint = getSamlEndpoint(amSamlBaseUrl, entityId);

        const samlQuery = await fetchSamlEntity(samlEndpoint, token, restGetFn);
        if (samlQuery.resultCount !== 1) {
          console.error("SAML entity does not exist %s", entityId);
          break;
        }

        const samlId = samlQuery.result[0]._id;
        const samlLocation = samlQuery.result[0].location;
        const samlEntityEndpoint = `${amSamlBaseUrl}/${samlLocation}/${samlId}`;

        const config = escapePlaceholders(
          await fetchSamlEntityDetails(samlEntityEndpoint, token, restGetFn)
        );
        const mergedConfig = mergeConfig(
          config,
          samlEntity.overrides,
          samlEntity.replacements
        );

        const metadataUrl = getMetadataUrl(tenantUrl, entityId, realm);
        const metadata = await fetchMetadata(metadataUrl, token, restGetFn);

        const samlConfig = { config: mergedConfig, metadata };
        const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/${samlLocation}`;
        createTargetDir(targetDir, fsModule);

        const fileName = `${targetDir}/${entityId}.json`;
        saveJsonToFileFn(samlConfig, fileName);
      }
    }
  } catch (err) {
    logRestError(err);
  }
}

module.exports = {
  exportConfig,
  fetchSamlEntity,
  fetchSamlEntityDetails,
  fetchMetadata,
  mergeConfig,
  createTargetDir,
};
