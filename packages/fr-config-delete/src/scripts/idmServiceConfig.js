const { restGet, restDelete } = require("../../../fr-config-common/src/restClient.js");

async function processServiceConfig(serviceInstances, tenantUrl, name, token, service, dryRun) {
  let matchFound = false;
  for (const serviceInstance of serviceInstances) {
    const serviceName = serviceInstance._id.split("/")[1];

    if (name && name !== serviceName) {
      continue; 
    }

    matchFound = true;

    if (dryRun) {
      console.log(`Dry run: Deleting ${service}: ${serviceName}`);
      continue;
    }

    const idmEndpoint = `${tenantUrl}/openidm/config/${serviceInstance._id}`; // path service/<service> how _id includes the full path

    try {
      await restDelete(idmEndpoint, token, null, true);
      console.log(`Deleting ${service}: ${serviceName}`);
    } catch (err) {
      console.error(`Error deleting ${service} ${serviceName}:`, err);
    }
  }

  if (name && !matchFound) {
    console.log(`Warning: service '${name}' not found.`);
  }
}

async function deleteServiceConfig(tenantUrl, name, token, service, dryRun) {
  try {
    const idmEndpoint = `${tenantUrl}/openidm/config`;

    const response = await restGet(
      idmEndpoint,
      { _queryFilter: `_id sw "${service}/"` },
      token
    );
    const serviceInstances = response.data.result;

    if (serviceInstances.length === 0) {
      console.log(`No ${service} found to delete.`);
      return;
    }

    await processServiceConfig(serviceInstances, tenantUrl, name, token, service, dryRun);

  } catch (err) {
    console.log(err);
  }
}

module.exports.deleteServiceConfig = deleteServiceConfig;