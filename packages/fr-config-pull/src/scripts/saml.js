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

const getCotEndpoint = (tenantUrl, realm, cotName) =>
  `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/federation/circlesoftrust/${cotName}`;

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

/**
 * Fetches the metadata.
 *
 * @param {string} metadataUrl - The metadata URL.
 * @param {string} token - The authentication token.
 * @param {function} restGetFn - The function to make a GET request.
 * @returns {Promise<Object>} - The fetched metadata.
 */
async function fetchMetadata(metadataUrl, token, restGetFn = restGet) {
  const response = await restGetFn(metadataUrl, null, token);
  return response.data;
}

/**
 * Merges the configuration with overrides and replacements.
 *
 * @param {Object} config - The original configuration.
 * @param {Object} overrides - The configuration overrides.
 * @param {Array} replacements - The replacements to be applied.
 * @returns {Object} - The merged configuration.
 */
function mergeConfig(config, overrides, replacements) {
  let mergedConfig = _.merge(config, overrides);
  if (replacements) {
    mergedConfig = replaceAllInJson(mergedConfig, replacements);
  }
  return mergedConfig;
}

function createTargetDir(targetDir, fsModule = fs) {
  if (!fsModule.existsSync(targetDir)) {
    fsModule.mkdirSync(targetDir, { recursive: true });
  }
}

/**
 * Exports the SAML configuration.
 *
 * @param {string} exportDir - The export directory.
 * @param {string} samlConfigFile - The SAML configuration file path.
 * @param {string} tenantUrl - The base URL of the tenant.
 * @param {string} token - The authentication token.
 * @param {Object} fsModule - The file system module.
 * @param {function} restGetFn - The function to make a GET request.
 * @param {function} saveJsonToFileFn - The function to save JSON to a file.
 */
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
      for (const samlEntity of samlEntities[realm].samlProviders) {
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
      for (const cotName of samlEntities[realm].circlesOfTrust) {
        const cotEndpoint = getCotEndpoint(tenantUrl, realm, cotName);
        const cotQuery = await restGetFn(cotEndpoint, null, token);
        if (cotQuery?.status !== 200) {
          console.error("COT does not exist %s", cotName);
          process.exit(1);
        }
        const targetDir = `${exportDir}/realms/${realm}/${EXPORT_SUBDIR}/COT`;
        createTargetDir(targetDir, fsModule);

        const fileName = `${targetDir}/${cotName}.json`;
        saveJsonToFileFn(cotQuery.data, fileName);
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
