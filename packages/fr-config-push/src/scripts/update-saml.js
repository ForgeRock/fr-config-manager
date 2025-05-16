const fs = require("fs");
const path = require("path");
const {
  restGet,
  restPost,
  restPut,
} = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");
const { OPTION } = require("../helpers/cli-options");
const PROTOCOL_RESOURCE_HEADER = "protocol=2.0,resource=1.0";
const getCotEndpoint = (tenantUrl, realm, cotName) =>
  `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/federation/circlesoftrust/${cotName}`;

/**
 * Get SAML entity by entityId
 *
 * @param {string} amSamlBaseUrl - AM SAML base URL
 * @param {string} entityId - entityId of the SAML entity
 * @param {string} token - access token
 * @param {function} restGetFn - function to make a GET request
 * @returns {Promise} - Promise object represents the SAML entity
 *
 */
async function getSAMLEntity(
  amSamlBaseUrl,
  entityId,
  token,
  restGetFn = restGet
) {
  const samlEndpoint = `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`;
  const response = await restGetFn(samlEndpoint, null, token);
  return response?.data;
}

/**
 * Updates a hosted SAML entity with the provided file content.
 *
 * @param {Object} fileContent - The content of the file to update the SAML entity with.
 * @param {string} amSamlBaseUrl - The base URL for the SAML endpoint.
 * @param {string} token - The authentication token to use for the request.
 * @param {Function} [restPutFn=restPut] - Optional. The function to use for making the PUT request. Defaults to `restPut`.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
async function updateHosteSAMLdEntity(
  fileContent,
  amSamlBaseUrl,
  token,
  restPutFn = restPut
) {
  await restPutFn(
    `${amSamlBaseUrl}/hosted/${fileContent._id}`,
    fileContent,
    token,
    PROTOCOL_RESOURCE_HEADER
  );
}

/**
 * Creates a hosted SAML entity with the provided file content.
 *
 * @param {Object} fileContent - The content of the file to create the SAML entity with.
 * @param {string} amSamlBaseUrl - The base URL for the SAML endpoint.
 * @param {string} token - The authentication token to use for the request.
 * @param {Function} [restPostFn=restPost] - Optional. The function to use for making the POST request. Defaults to `restPost`.
 * @returns {Promise<void>} A promise that resolves when the creation is complete.
 */
async function createHostedSAMLEntity(
  fileContent,
  amSamlBaseUrl,
  token,
  restPostFn = restPost
) {
  await restPostFn(
    `${amSamlBaseUrl}/hosted?_action=create`,
    null,
    fileContent,
    token,
    PROTOCOL_RESOURCE_HEADER
  );
}

/**
 * Handles a hosted SAML entity.
 *
 * @param {Object} samlObject - The SAML object to handle.
 * @param {string} amSamlBaseUrl - The base URL for the SAML endpoint.
 * @param {string} token - The authentication token to use for the request.
 * @returns {Promise<void>} A promise that resolves when the SAML entity has been handled.
 */
async function handleHostedSAMLEntity(samlObject, amSamlBaseUrl, token) {
  const fileContent = { ...samlObject.config };
  delete fileContent._rev;
  const entityId = fileContent.entityId;

  const samlQuery = await getSAMLEntity(amSamlBaseUrl, entityId, token);
  if (samlQuery.resultCount === 1) {
    await updateHosteSAMLdEntity(fileContent, amSamlBaseUrl, token);
  } else if (samlQuery.resultCount === 0) {
    await createHostedSAMLEntity(fileContent, amSamlBaseUrl, token);
  } else {
    throw new Error(`Error while looking up hosted entity ${entityId}`);
  }
}

/**
 * Imports a remote SAML entity by posting the provided metadata to the specified AM SAML base URL.
 *
 * @param {string} metadata - The SAML metadata to be imported.
 * @param {string} amSamlBaseUrl - The base URL of the AM SAML service.
 * @param {string} token - The authentication token to be used for the request.
 * @param {Function} [restPostFn=restPost] - The function to use for making the POST request. Defaults to `restPost`.
 * @returns {Promise<void>} A promise that resolves when the import is complete.
 */
async function importRemoteSAMLEntity(
  metadata,
  amSamlBaseUrl,
  token,
  restPostFn = restPost
) {
  const encodedMetadata = Buffer.from(metadata, "utf-8").toString("base64url");
  await restPostFn(
    `${amSamlBaseUrl}/remote?_action=importEntity`,
    null,
    { standardMetadata: encodedMetadata },
    token,
    PROTOCOL_RESOURCE_HEADER
  );
}

/**
 * Updates a remote SAML entity by sending a PUT request to the specified URL.
 *
 * @param {Object} entity - The SAML entity to be updated.
 * @param {string} amSamlBaseUrl - The base URL for the SAML service.
 * @param {string} token - The authentication token to be used for the request.
 * @param {Function} [restPutFn=restPut] - Optional custom function to perform the PUT request. Defaults to `restPut`.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 */
async function updateRemoteSAMLEntity(
  entity,
  amSamlBaseUrl,
  token,
  restPutFn = restPut
) {
  delete entity._rev;
  {
    await restPutFn(
      `${amSamlBaseUrl}/remote/${entity._id}`,
      entity,
      token,
      PROTOCOL_RESOURCE_HEADER
    );
  }
}

/**
 * Handles the remote SAML entity by either importing it if it does not exist or updating it if it does.
 *
 * @param {Object} samlObject - The SAML object containing configuration and metadata.
 * @param {Object} samlObject.config - The configuration of the SAML entity.
 * @param {Object} samlObject.metadata - The metadata of the SAML entity.
 * @param {string} amSamlBaseUrl - The base URL for the SAML service.
 * @param {string} token - The authentication token.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function handleRemoteSAMLEntity(samlObject, amSamlBaseUrl, token) {
  const fileContent = { ...samlObject.config };
  delete fileContent._rev;
  const entityId = fileContent.entityId;

  const samlQuery = await getSAMLEntity(amSamlBaseUrl, entityId, token);
  if (samlQuery.resultCount === 0) {
    await importRemoteSAMLEntity(samlObject.metadata, amSamlBaseUrl, token);
  }

  await updateRemoteSAMLEntity(fileContent, amSamlBaseUrl, token);
}

/**
 * Handles the Circle of Trust (COT) update for a given SAML object.
 *
 * @param {Object} samlObject - The SAML object to be updated.
 * @param {string} tenantUrl - The URL of the tenant.
 * @param {string} realm - The realm within the tenant.
 * @param {string} token - The authentication token.
 * @param {Function} [restPutFn=restPut] - The function to perform the REST PUT request.
 * @returns {Promise<void>} - A promise that resolves when the COT update is complete.
 */
async function handleCOTs(
  samlObject,
  tenantUrl,
  realm,
  token,
  restPutFn = restPut
) {
  delete samlObject._rev;

  const cotName = samlObject._id;
  const cotEndpoint = getCotEndpoint(tenantUrl, realm, cotName);
  await restPutFn(cotEndpoint, samlObject, token, PROTOCOL_RESOURCE_HEADER);
}

/**
 * Updates SAML configurations for configured realms.
 *
 * @param {Object} argv - The arguments passed to the script.
 * @param {string} token - The authentication token.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 *
 * @throws Will throw an error if the SAML configuration update fails.
 *
 * Environment Variables:
 * @property {string} REALMS - A JSON string representing an array of realms.
 * @property {string} TENANT_BASE_URL - The base URL of the tenant.
 * @property {string} CONFIG_DIR - The directory where configuration files are stored.
 */
const updateSaml = async (argv, token) => {
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;

  if (!REALMS || !TENANT_BASE_URL || !CONFIG_DIR) {
    console.error(
      "Environment variables REALMS, TENANT_BASE_URL, and CONFIG_DIR must be set"
    );
    return;
  }

  const realms = argv[OPTION.REALM] ? [argv[OPTION.REALM]] : JSON.parse(REALMS);

  const entityName = argv[OPTION.NAME];

  if (entityName) {
    if (realms.length !== 1) {
      console.error("Error: for a named SAML entity, specify a single realm");
      process.exit(1);
    } else {
      console.log("Updating SAML Entity", `"${entityName}"`);
    }
  } else {
    console.log("Updating SAML Entities");
  }

  for (const realm of realms) {
    try {
      // Read agent JSON files
      const baseDir = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/saml`
      );
      if (!fs.existsSync(baseDir)) {
        console.warn("Warning: no SAML config present for realm", realm);
        return;
      }

      const amSamlBaseUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/saml2`;

      const samlTypes = fs.readdirSync(baseDir);

      for (const samlType of samlTypes) {
        const subDir = path.join(baseDir, samlType);
        const samlFiles = fs
          .readdirSync(subDir)
          .filter((name) => path.extname(name) === ".json");

        for (const samlFile of samlFiles) {
          const samlFilePath = path.join(subDir, samlFile);
          const samlFileContents = fs.readFileSync(samlFilePath, "utf8");
          const resolvedSamlFileContents =
            replaceEnvSpecificValues(samlFileContents);
          const samlObject = JSON.parse(resolvedSamlFileContents);

          if (
            entityName &&
            ((!!samlObject._id && samlObject._id !== entityName) ||
              (!!samlObject.config &&
                samlObject.config.entityId !== entityName))
          ) {
            continue;
          }
          switch (samlType.toLowerCase()) {
            case "remote":
              await handleRemoteSAMLEntity(samlObject, amSamlBaseUrl, token);
              break;
            case "hosted":
              await handleHostedSAMLEntity(samlObject, amSamlBaseUrl, token);
              break;
            case "cot":
              //do nothing, COTs are handled separately
              break;
            default:
              console.error(`Unknown SAML type: ${samlType}`);
              process.exit(1);
          }
        }
      }
      const dir = path.join(baseDir, "COT");
      if (fs.existsSync(dir)) {
        const samlFiles = fs
          .readdirSync(dir)
          .filter((name) => path.extname(name) === ".json");
        for (const samlFile of samlFiles) {
          const samlFilePath = path.join(dir, samlFile);
          const samlFileContents = fs.readFileSync(samlFilePath, "utf8");
          const resolvedSamlFileContents =
            replaceEnvSpecificValues(samlFileContents);
          const samlObject = JSON.parse(resolvedSamlFileContents);

          await handleCOTs(samlObject, TENANT_BASE_URL, realm, token);
        }
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

module.exports = {
  getEntity: getSAMLEntity,
  handleHostedEntity: handleHostedSAMLEntity,
  handleRemoteEntity: handleRemoteSAMLEntity,
  updateHostedEntity: updateHosteSAMLdEntity,
  createHostedEntity: createHostedSAMLEntity,
  importRemoteEntity: importRemoteSAMLEntity,
  updateSaml: updateSaml,
};
