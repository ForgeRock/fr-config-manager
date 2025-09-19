const { restDelete } = require("../../../fr-config-common/src/restClient.js");

async function deleteServiceConfig(serviceName, tenantUrl, token, ignoreNotFound = false, dryRun) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config/${serviceName}`;

    if (dryRun) {
      console.log(`Dry run: Deleting service config: ${serviceName}`);
      return;
    }

    await restDelete(idmEndpoint, token, null, ignoreNotFound);
    console.log(`Deleting ${serviceName} config`);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteServiceConfig = deleteServiceConfig;
