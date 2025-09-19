const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

const API_VERSION = "resource=2.0";

async function processSecrets(secrets, name, envEndpoint, token, dryRun) {

    let matchFound = false;
    for (const secret of secrets) {
      if (name && name !== secret._id) {
        continue;
      }

      matchFound = true;

      const secretId = secret._id;

      if (dryRun) {
        console.log(`Dry run: Deleting secret: ${secretId}`);
        continue;
      }

      const secretEndpoint = `${envEndpoint}/${secretId}`;

      try {
        await restDelete(secretEndpoint, token, API_VERSION, true);
        console.log(`Deleting secret: ${secretId}`);
      } catch (err) {
        console.error(`Failed to delete secret ${secretId}:`, err);
      }

    }

  if (name && !matchFound) {
    console.log(`Warning: Secret '${name}' not found.`);
  }
}

async function deleteSecrets(tenantUrl, name, token, dryRun) {
  try {
    const envEndpoint = `${tenantUrl}/environment/secrets`;

    const response = await restGet(
      envEndpoint,
      null,
      token,
      API_VERSION
    );

    const secrets = response.data.result;

    await processSecrets(secrets, name, envEndpoint, token, dryRun);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteSecrets = deleteSecrets;