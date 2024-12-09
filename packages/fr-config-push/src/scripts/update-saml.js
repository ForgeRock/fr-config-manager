const fs = require("fs");
const path = require("path");
const {
  restGet,
  restPost,
  restPut,
} = require("../../../fr-config-common/src/restClient");
const { replaceEnvSpecificValues } = require("../helpers/config-process");

async function getEntity(amSamlBaseUrl, entityId, token) {
  const samlEndpoint = `${amSamlBaseUrl}?_queryFilter=entityId%20eq%20'${entityId}'`;

  const response = await restGet(samlEndpoint, null, token);
  return response?.data;
}
async function handleHostedEntity(samlObject, amSamlBaseUrl, token) {
  const fileContent = samlObject.config;
  delete fileContent._rev;
  const entityId = fileContent.entityId;

  const samlQuery = await getEntity(amSamlBaseUrl, entityId, token);
  if (samlQuery.resultCount == 1) {
    await restPut(
      `${amSamlBaseUrl}/hosted/${fileContent._id}`,
      fileContent,
      token,
      "protocol=1.0,resource=1.0"
    );
  } else if (samlQuery.resultCount == 0) {
    await restPost(
      `${amSamlBaseUrl}/hosted?_action=create`,
      null,
      fileContent,
      token,
      "protocol=1.0,resource=1.0"
    );
  } else {
    throw new Error("Error while looking up hosted entity " + entityId);
  }
}

async function handleRemoteEntity(samlObject, amSamlBaseUrl, token) {
  const fileContent = samlObject.config;
  delete fileContent._rev;
  const entityId = fileContent.entityId;

  const samlQuery = await getEntity(amSamlBaseUrl, entityId, token);
  //Import metadata if the SAML entity doesn't exist
  if (samlQuery.resultCount == 0) {
    const metadata = samlObject.metadata;
    console.log(metadata);
    const encodedMetadata = Buffer.from(metadata, "utf-8").toString(
      "base64url"
    );
    await restPost(
      `${amSamlBaseUrl}/remote?_action=importEntity`,
      null,
      { standardMetadata: encodedMetadata },
      token,
      "protocol=1.0,resource=1.0"
    );
  }
  //update the remote entity config
  await restPut(
    `${amSamlBaseUrl}/remote/${fileContent._id}`,
    fileContent,
    token,
    "protocol=1.0,resource=1.0"
  );
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
        console.log("Warning: no saml config present for realm", realm);
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
              handleRemoteEntity(samlObject, amSamlBaseUrl, token);
              break;
            case "hosted":
              handleHostedEntity(samlObject, amSamlBaseUrl, token);
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

module.exports = updateSaml;
