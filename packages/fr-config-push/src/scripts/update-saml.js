const fs = require("fs");
const path = require("path");
const {
  restGet,
  restPost,
  restPut,
} = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");

const PROTOCOL_RESOURCE_HEADER = "protocol=1.0,resource=1.0";

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

const updateSaml = async (argv, token) => {
  console.log("Updating saml");
  const { REALMS, TENANT_BASE_URL, CONFIG_DIR } = process.env;
  for (const realm of JSON.parse(REALMS)) {
    try {
      // Read agent JSON files
      const baseDir = path.join(
        CONFIG_DIR,
        `/realms/${realm}/realm-config/saml`
      );
      if (!fs.existsSync(baseDir)) {
        console.warn("Warning: no saml config present for realm", realm);
        return;
      }

      let amSamlBaseUrl = `${TENANT_BASE_URL}/am/json/realms/root/realms/${realm}/realm-config/saml2`;
      const samlTypes = fs.readdirSync(baseDir);
      for (const samlType of samlTypes) {
        const subDir = path.join(baseDir, samlType);

        const samlFiles = fs
          .readdirSync(subDir)
          .filter((name) => path.extname(name) === ".json");

        for (const samlFile of samlFiles) {
          var samlFileContents = fs.readFileSync(
            path.join(subDir, samlFile),
            "utf8"
          );
          var resolvedSamlFileContents =
            replaceEnvSpecificValues(samlFileContents);

          const samlObject = JSON.parse(resolvedSamlFileContents);
          switch (samlType.toLowerCase()) {
            case "remote":
              handleRemoteSAMLEntity(samlObject, amSamlBaseUrl, token);
              break;
            case "hosted":
              handleHostedSAMLEntity(samlObject, amSamlBaseUrl, token);
              break;
            default:
              console.error("unable to handle saml entity type %s", samlType);
              process.exit(1);
          }
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
