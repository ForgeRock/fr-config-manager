const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

const API_VERSION = "protocol=2.0,resource=1.0";

async function processMappings(mappings, name, amEndpoint, token, dryRun) {

  let matchFound = false;

  for (const mapping of mappings) {
    const secretId = mapping._id;

    if (name && name !== secretId) {
      continue;
    }

    matchFound = true;

    const secretEndpoint = `${amEndpoint}/${secretId}`;

    if (dryRun) {
      console.log(`Dry run: Deleting secret ID mapping: ${secretId}`);
      continue;
    }
    
    try {
      await restDelete(secretEndpoint, token, API_VERSION, true);
      console.log(`Deleting secret ID mapping: ${secretId}`);
    } catch (err) {
      console.error(`Failed to delete secret ID mapping ${secretId}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: Secret mapping with ID '${name}' not found.`);
  }
}

async function deleteSecretMappings(tenantUrl, realms, name, token, dryRun) {
  try {
    for (const realm of realms) {
      const amEndpoint = `${tenantUrl}/am/json/realms/root/realms/${realm}/realm-config/secrets/stores/GoogleSecretManagerSecretStoreProvider/ESV/mappings`;

      const response = await restGet(
        amEndpoint,
        {
          _queryFilter: "true",
        },
        token
      );

      const mappings = response.data.result;

      if (mappings.length === 0) {
        console.log(`No secret mappings found to delete in realm ${realm}`);
        return;
      }

      await processMappings(mappings, name, amEndpoint, token, dryRun);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteSecretMappings = deleteSecretMappings;